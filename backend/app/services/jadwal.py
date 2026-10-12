"""Aturan jadwal pesan (Bagian 6.3): satu jadwal belum-berhenti per ibu, 2x per minggu pada hari dan jam tetap."""

import logging
from datetime import UTC, date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import IbuHamil, JadwalPesan, SkorRisiko

log = logging.getLogger("maternalguard.jadwal")

WIB = timezone(timedelta(hours=7))
HARI = {"senin": 0, "selasa": 1, "rabu": 2, "kamis": 3, "jumat": 4, "sabtu": 5, "minggu": 6}


def sekarang() -> datetime:
    return datetime.now(UTC)


def _hari_aktif() -> list[int]:
    nama = [h.strip().lower() for h in get_settings().jadwal_hari.split(",") if h.strip()]
    hasil = sorted({HARI[n] for n in nama if n in HARI})
    return hasil or [1, 4]


def label_hari() -> str:
    inv = {v: k for k, v in HARI.items()}
    return ", ".join(inv[h].capitalize() for h in _hari_aktif())


def _jam() -> time:
    try:
        jj, mm = get_settings().jadwal_jam.split(":")
        return time(int(jj), int(mm))
    except ValueError:
        return time(10, 0)


def slot_berikutnya(setelah: datetime) -> datetime:
    """Waktu kirim tetap (hari + jam WIB) paling awal yang >= `setelah`, dalam UTC."""
    if setelah.tzinfo is None:
        setelah = setelah.replace(tzinfo=UTC)
    wib = setelah.astimezone(WIB)
    hari = _hari_aktif()
    for i in range(0, 15):
        d = wib.date() + timedelta(days=i)
        if d.weekday() in hari:
            kandidat = datetime.combine(d, _jam(), tzinfo=WIB)
            if kandidat >= setelah:
                return kandidat.astimezone(UTC)
    raise RuntimeError("Tidak ada slot jadwal (periksa JADWAL_HARI).")  # tidak mungkin tercapai


def jadwal_belum_berhenti(db: Session, id_ibu: int) -> JadwalPesan | None:
    return db.scalar(select(JadwalPesan).where(JadwalPesan.id_ibu == id_ibu, JadwalPesan.status != "berhenti"))


def hentikan_jadwal(db: Session, id_ibu: int, alasan: str) -> int:
    """Menghentikan semua jadwal ibu yang belum berhenti. Tidak melakukan commit."""
    n = 0
    for j in db.scalars(select(JadwalPesan).where(JadwalPesan.id_ibu == id_ibu, JadwalPesan.status != "berhenti")):
        j.status = "berhenti"
        j.tanggal_berhenti = sekarang().astimezone(WIB).date()
        j.kirim_berikutnya = None
        n += 1
        log.info("Jadwal %s berhenti (%s)", j.id_jadwal, alasan)
    return n


def buat_atau_perbarui(db: Session, ibu: IbuHamil, skor: SkorRisiko) -> JadwalPesan:
    """Satu jadwal aktif per ibu. Pesan terjadwal pertama minimal N hari setelah pesan langsung.
    Jadwal yang sudah ada hanya diperbarui id_skor-nya (status dijeda tidak diubah)."""
    s = get_settings()
    ada = jadwal_belum_berhenti(db, ibu.id_ibu)
    if ada:
        ada.id_skor = skor.id_skor
        return ada
    now = sekarang()
    baru = JadwalPesan(
        id_ibu=ibu.id_ibu,
        id_skor=skor.id_skor,
        status="aktif",
        frekuensi="2x per minggu",
        hari_kirim=label_hari(),
        jam_kirim=s.jadwal_jam,
        tanggal_mulai=now.astimezone(WIB).date(),
        kirim_berikutnya=slot_berikutnya(now + timedelta(days=s.pesan_pertama_min_jeda_hari)),
    )
    try:
        with db.begin_nested():
            db.add(baru)
            db.flush()
    except IntegrityError:
        # Permintaan bersamaan sudah membuatnya lebih dulu: pakai yang ada.
        existing = jadwal_belum_berhenti(db, ibu.id_ibu)
        if existing is None:
            raise
        existing.id_skor = skor.id_skor
        return existing
    return baru


def aktifkan_kembali(jadwal: JadwalPesan) -> None:
    jadwal.status = "aktif"
    jadwal.kirim_berikutnya = slot_berikutnya(sekarang())


def hari_ini_wib() -> date:
    return sekarang().astimezone(WIB).date()
