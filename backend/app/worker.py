"""Proses worker penjadwal notifikasi (Bagian 5 & 6.3): jalankan SEBAGAI SATU PROSES TERPISAH.

    python -m app.worker

Tiap menit memeriksa jadwal aktif yang jatuh tempo. Baris dikunci (FOR UPDATE SKIP LOCKED) agar pesan
tidak terkirim ganda; jadwal berikutnya dimajukan dan riwayat dicatat sebelum pesan dikirim.
Jangan menjalankan lebih dari satu replika worker.
"""

import logging
from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import select

from .config import get_settings
from .db import session_factory
from .models import Bidan, IbuHamil, JadwalPesan, RiwayatNotifikasi
from .services import jadwal as svc_jadwal
from .services import notifikasi as svc_notif
from .whatsapp import WhatsAppProvider, get_provider

log = logging.getLogger("maternalguard.worker")


def jalankan_jadwal(sf=None, provider: WhatsAppProvider | None = None, now: datetime | None = None, batch: int = 50) -> int:
    """Memproses jadwal jatuh tempo. Mengembalikan jumlah pesan yang dibuat."""
    sf = sf or session_factory()
    now = now or svc_jadwal.sekarang()
    dibuat: list[int] = []

    with sf() as db:
        rows = db.scalars(
            select(JadwalPesan)
            .where(JadwalPesan.status == "aktif", JadwalPesan.kirim_berikutnya <= now)
            .order_by(JadwalPesan.kirim_berikutnya)
            .limit(batch)
            .with_for_update(skip_locked=True)
        ).all()
        for j in rows:
            ibu = db.get(IbuHamil, j.id_ibu)
            bidan = db.get(Bidan, ibu.id_bidan)
            alasan = svc_notif.alasan_tidak_bisa_kirim(ibu)
            if alasan:
                # Syarat tidak lagi terpenuhi: jadwal berhenti.
                svc_jadwal.hentikan_jadwal(db, ibu.id_ibu, alasan)
                continue
            tpl = svc_notif.template_berikutnya(db, j)
            if tpl is None:
                log.error("Tidak ada template tema untuk jadwal %s", j.id_jadwal)
                j.kirim_berikutnya = svc_jadwal.slot_berikutnya(now + timedelta(minutes=1))
                continue
            r = svc_notif.buat_riwayat(db, j, tpl, ibu, bidan)
            j.kirim_berikutnya = svc_jadwal.slot_berikutnya(now + timedelta(minutes=1))
            dibuat.append(r.id_notifikasi)
        db.commit()  # melepas kunci baris

    for id_notif in dibuat:
        svc_notif.proses_kirim(sf, id_notif, provider)
    if dibuat:
        log.info("Worker membuat %s pesan terjadwal", len(dibuat))
    pulihkan_tertunda(sf, provider, now, kecuali=tuple(dibuat))
    return len(dibuat)


MENIT_TERTUNDA = 2


def pulihkan_tertunda(sf=None, provider: WhatsAppProvider | None = None, now: datetime | None = None, batch: int = 50, kecuali: tuple[int, ...] = ()) -> int:
    """Pesan yang tercatat 'menunggu' tetapi tidak pernah dikirim (mis. API restart sesaat setelah commit)
    dikirim oleh worker setelah MENIT_TERTUNDA menit, agar tidak menggantung selamanya."""
    sf = sf or session_factory()
    now = now or svc_jadwal.sekarang()
    with sf() as db:
        ids = list(
            db.scalars(
                select(RiwayatNotifikasi.id_notifikasi)
                .where(
                    RiwayatNotifikasi.status_kirim == "menunggu",
                    RiwayatNotifikasi.id_pesan_gateway.is_(None),
                    RiwayatNotifikasi.waktu_kirim < now - timedelta(minutes=MENIT_TERTUNDA),
                    RiwayatNotifikasi.id_notifikasi.notin_(kecuali) if kecuali else True,
                )
                .order_by(RiwayatNotifikasi.id_notifikasi)
                .limit(batch)
            )
        )
    for i in ids:
        svc_notif.proses_kirim(sf, i, provider)
    if ids:
        log.warning("Worker memulihkan %s pesan yang tertunda", len(ids))
    return len(ids)


def _job():
    try:
        jalankan_jadwal()
    except Exception:  # noqa: BLE001
        log.exception("Worker gagal memproses jadwal")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    get_settings()
    get_provider()  # gagal cepat bila konfigurasi WhatsApp salah
    sched = BlockingScheduler(timezone="UTC")
    sched.add_job(_job, "interval", minutes=1, id="jadwal", max_instances=1, coalesce=True, next_run_time=datetime.now(UTC))
    log.info("Worker penjadwal berjalan (tiap 1 menit)")
    sched.start()


if __name__ == "__main__":
    main()
