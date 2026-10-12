"""Orkestrasi notifikasi WhatsApp: aturan kelayakan, render template, pengiriman dengan ulang
terbatas, dan pembaruan status dari webhook."""

import logging
import re
import time
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import session_factory
from ..models import Bidan, IbuHamil, JadwalPesan, RiwayatNotifikasi, TemplatePesan
from ..whatsapp import SendRequest, WhatsAppError, WhatsAppProvider, get_provider
from . import jadwal as svc_jadwal
from .jadwal import sekarang

log = logging.getLogger("maternalguard.notifikasi")

ALASAN_BUKAN_HIGH = "Kategori bukan high risk, pesan WhatsApp tidak dikirim."
ALASAN_PERSETUJUAN = "Persetujuan WhatsApp ibu belum aktif."
ALASAN_NOMOR = "Nomor WhatsApp tidak valid."
ALASAN_LAHIR = "Ibu sudah melahirkan."
ALASAN_DIJEDA = "Jadwal pesan sedang dijeda oleh bidan."

RE_WA = re.compile(r"^62\d{8,13}$")
PEMBUKA = "pembuka"

# Urutan status: status tidak boleh turun karena webhook bisa tiba tidak berurutan.
RANK = {"menunggu": 0, "terkirim": 1, "diterima": 2, "gagal": 2}
STATUS_WEBHOOK = {"sent": "terkirim", "delivered": "diterima", "read": "diterima", "failed": "gagal"}


def alasan_tidak_bisa_kirim(ibu: IbuHamil) -> str | None:
    """Syarat kirim (Bagian 6.3): persetujuan aktif, nomor valid, ibu belum lahir."""
    if not ibu.persetujuan_wa:
        return ALASAN_PERSETUJUAN
    if not RE_WA.match(ibu.no_wa or ""):
        return ALASAN_NOMOR
    if ibu.status_persalinan == "sudah lahir":
        return ALASAN_LAHIR
    return None


def nama_bidan_pendek(bidan: Bidan) -> str:
    return re.sub(r"^bidan\s+", "", bidan.nama, flags=re.I).strip()


VARIABEL = re.compile(r"\{(nama|bidan|no_hp_bidan)\}")


def params_template(isi_template: str, ibu: IbuHamil, bidan: Bidan) -> list[str]:
    """Nilai variabel untuk template WhatsApp Cloud API: tiap placeholder yang berbeda satu parameter,
    berurutan menurut kemunculan PERTAMA di isi_template ({{1}}, {{2}}, ...). Jumlah dan urutannya harus
    sama dengan template yang didaftarkan di Meta."""
    nilai = {"nama": ibu.nama, "bidan": nama_bidan_pendek(bidan), "no_hp_bidan": bidan.no_hp}
    urut: list[str] = []
    for m in VARIABEL.finditer(isi_template):
        if m.group(1) not in urut:
            urut.append(m.group(1))
    return [nilai[k] for k in urut]


def render(teks: str, ibu: IbuHamil, bidan: Bidan) -> str:
    return (
        teks.replace("{nama}", ibu.nama)
        .replace("{bidan}", nama_bidan_pendek(bidan))
        .replace("{no_hp_bidan}", bidan.no_hp)
    )


def template_pembuka(db: Session) -> TemplatePesan | None:
    return db.scalar(select(TemplatePesan).where(TemplatePesan.jenis_pesan == PEMBUKA))


def template_berikutnya(db: Session, jadwal: JadwalPesan) -> TemplatePesan | None:
    """Tema bergilir: kontrol, istirahat, kenali tanda, tanya kabar (urut id), tidak termasuk pembuka."""
    tema = list(
        db.scalars(
            select(TemplatePesan)
            .where(TemplatePesan.kategori_risiko == "high risk", TemplatePesan.jenis_pesan != PEMBUKA)
            .order_by(TemplatePesan.id_template)
        )
    )
    if not tema:
        return None
    terkirim = db.scalar(
        select(func.count())
        .select_from(RiwayatNotifikasi)
        .join(TemplatePesan, TemplatePesan.id_template == RiwayatNotifikasi.id_template)
        .where(
            RiwayatNotifikasi.id_jadwal == jadwal.id_jadwal,
            RiwayatNotifikasi.status_kirim != "gagal",
            TemplatePesan.jenis_pesan != PEMBUKA,
        )
    )
    return tema[(terkirim or 0) % len(tema)]


def buat_riwayat(db: Session, jadwal: JadwalPesan, template: TemplatePesan, ibu: IbuHamil, bidan: Bidan) -> RiwayatNotifikasi:
    """Menambah satu baris riwayat berstatus menunggu. Tidak melakukan commit."""
    r = RiwayatNotifikasi(
        id_jadwal=jadwal.id_jadwal,
        id_template=template.id_template,
        isi_pesan=render(template.isi_template, ibu, bidan),
        waktu_kirim=sekarang(),
        status_kirim="menunggu",
        no_wa_tujuan=ibu.no_wa,
    )
    db.add(r)
    db.flush()
    return r


def proses_kirim(sf, id_notifikasi: int, provider: WhatsAppProvider | None = None) -> None:
    """Mengirim satu baris riwayat. Bila provider menolak, baris ditandai gagal dan upaya baru
    (baris baru) dibuat sampai WA_MAX_RETRY. Status akhir selanjutnya datang lewat webhook."""
    s = get_settings()
    provider = provider or get_provider()
    current = id_notifikasi
    for percobaan in range(1, max(1, s.wa_max_retry) + 1):
        with sf() as db:
            r = db.get(RiwayatNotifikasi, current)
            if r is None or r.status_kirim != "menunggu" or r.id_pesan_gateway is not None:
                return
            jadwal = r.jadwal
            ibu = jadwal.ibu
            bidan = db.get(Bidan, ibu.id_bidan)
            alasan = alasan_tidak_bisa_kirim(ibu)
            if alasan:
                # Syarat berubah antara pembuatan dan pengiriman (mis. persetujuan dicabut): jangan kirim.
                r.status_kirim = "gagal"
                db.commit()
                log.info("Notifikasi %s tidak dikirim: %s", r.id_notifikasi, alasan)
                return
            req = SendRequest(
                to=r.no_wa_tujuan,
                jenis_pesan=r.template.jenis_pesan,
                nama_template=r.template.nama_template,
                params=params_template(r.template.isi_template, ibu, bidan),
                teks=r.isi_pesan,
            )
            try:
                hasil = provider.send(req)
            except WhatsAppError as e:
                r.status_kirim = "gagal"
                db.commit()
                log.warning("Pengiriman notifikasi %s gagal (percobaan %s): %s", r.id_notifikasi, percobaan, e)
                if percobaan >= s.wa_max_retry:
                    return
                baru = RiwayatNotifikasi(
                    id_jadwal=r.id_jadwal,
                    id_template=r.id_template,
                    isi_pesan=r.isi_pesan,
                    waktu_kirim=sekarang(),
                    status_kirim="menunggu",
                    no_wa_tujuan=r.no_wa_tujuan,
                )
                db.add(baru)
                db.commit()
                current = baru.id_notifikasi
            else:
                r.id_pesan_gateway = hasil.message_id
                db.commit()
                return
        if s.wa_retry_delay_seconds > 0:
            time.sleep(s.wa_retry_delay_seconds)


def terapkan_status(db: Session, id_pesan_gateway: str, status_baru: str) -> bool:
    """Memperbarui status_kirim dari webhook. Status tidak diturunkan; diterima/gagal bersifat akhir.
    Mengembalikan True bila ada perubahan. Tidak melakukan commit."""
    r = db.scalar(select(RiwayatNotifikasi).where(RiwayatNotifikasi.id_pesan_gateway == id_pesan_gateway))
    if r is None:
        return False
    if r.status_kirim in ("diterima", "gagal"):
        return False
    if RANK[status_baru] <= RANK[r.status_kirim]:
        return False
    r.status_kirim = status_baru
    return True


def terapkan_status_sesi(id_pesan_gateway: str, status_baru: str) -> None:
    """Dipakai provider fake untuk meniru webhook (membuat sesinya sendiri)."""
    with session_factory()() as db:
        if terapkan_status(db, id_pesan_gateway, status_baru):
            db.commit()


def tangani_hasil_skor(
    db: Session, ibu: IbuHamil, bidan: Bidan, kategori: str, skor
) -> tuple[bool, str | None, JadwalPesan | None, int | None]:
    """Keputusan notifikasi setelah skor tersimpan (Bagian 6.3 butir 1-4).

    Mengembalikan (dikirim, alasan, jadwal, id_notifikasi). Jadwal dibuat/diperbarui LEBIH DULU karena
    riwayat_notifikasi.id_jadwal adalah foreign key, lalu baris riwayat berstatus menunggu dibuat.
    Pengiriman sebenarnya dilakukan setelah commit, di latar belakang (proses_kirim). Melakukan commit.
    """
    if kategori != "high risk":
        # Turunnya kategori ke low/mid menghentikan jadwal otomatis.
        svc_jadwal.hentikan_jadwal(db, ibu.id_ibu, "kategori turun")
        db.commit()
        return False, ALASAN_BUKAN_HIGH, None, None

    alasan = alasan_tidak_bisa_kirim(ibu)
    if alasan:
        db.commit()
        return False, alasan, None, None

    jadwal = svc_jadwal.buat_atau_perbarui(db, ibu, skor)
    if jadwal.status == "dijeda":
        db.commit()
        return False, ALASAN_DIJEDA, jadwal, None

    tpl = template_pembuka(db)
    if tpl is None:
        db.commit()
        return False, "Template pesan pembuka belum tersedia.", jadwal, None

    r = buat_riwayat(db, jadwal, tpl, ibu, bidan)
    db.commit()
    return True, None, jadwal, r.id_notifikasi
