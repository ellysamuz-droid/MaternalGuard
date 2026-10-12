import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db, session_factory
from ..deps import get_current_bidan, ibu_milik
from ..models import Bidan, JenisKeluhan, Pemeriksaan, SkorRisiko, Vital
from ..schemas import HasilPencatatanOut, JadwalOut, PemeriksaanIn, PemeriksaanOut, PesanWhatsappOut
from ..services import jadwal as svc_jadwal
from ..services import notifikasi as svc_notif
from ..services.scoring import Scorer, get_scorer
from ..utils import hitung_usia

log = logging.getLogger("maternalguard.pemeriksaan")
router = APIRouter(prefix="/ibu-hamil/{id_ibu}/pemeriksaan", tags=["pemeriksaan"])


@router.get("", response_model=list[PemeriksaanOut])
def riwayat(id_ibu: int, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    ibu_milik(db, id_ibu, bidan)
    q = (
        select(Pemeriksaan)
        .where(Pemeriksaan.id_ibu == id_ibu)
        .options(selectinload(Pemeriksaan.vital), selectinload(Pemeriksaan.skor), selectinload(Pemeriksaan.keluhan))
        .order_by(Pemeriksaan.tanggal_pemeriksaan.desc(), Pemeriksaan.id_pemeriksaan.desc())
    )
    return list(db.scalars(q))


@router.post("", response_model=HasilPencatatanOut, status_code=status.HTTP_201_CREATED)
def catat(
    id_ibu: int,
    body: PemeriksaanIn,
    tugas: BackgroundTasks,
    db: Session = Depends(get_db),
    bidan: Bidan = Depends(get_current_bidan),
    scorer: Scorer = Depends(get_scorer),
):
    """FR-05, 07, 08. Pemeriksaan + vital + detail keluhan disimpan dalam SATU transaksi. Skoring
    dijalankan setelah commit sehingga kegagalan skoring tidak membatalkan pencatatan."""
    ibu = ibu_milik(db, id_ibu, bidan)

    ids = sorted(set(body.id_jenis_keluhan))
    keluhan = list(db.scalars(select(JenisKeluhan).where(JenisKeluhan.id_jenis_keluhan.in_(ids)))) if ids else []
    if len(keluhan) != len(ids):
        raise HTTPException(422, [{"loc": ["body", "id_jenis_keluhan"], "msg": "Ada jenis keluhan yang tidak dikenal.", "type": "value_error"}])

    now = svc_jadwal.sekarang()
    v = body.vital
    p = Pemeriksaan(
        id_ibu=ibu.id_ibu,
        id_bidan=bidan.id_bidan,
        tanggal_pemeriksaan=now,
        keluhan_lain=body.keluhan_lain.strip(),
        tanggal_kontrol_berikutnya=body.tanggal_kontrol_berikutnya,
        vital=Vital(
            sistolik=v.sistolik,
            diastolik=v.diastolik,
            nadi=v.nadi,
            suhu=v.suhu_c,
            gula_darah=v.gula_mgdl,
            berat_badan=v.berat_badan,
        ),
        keluhan=keluhan,
    )
    db.add(p)
    db.commit()  # transaksi 1 selesai: pencatatan aman

    # Skoring (setelah commit)
    skor: SkorRisiko | None = None
    try:
        usia = hitung_usia(ibu.tanggal_lahir, svc_jadwal.hari_ini_wib())
        hasil = scorer.prediksi(usia, v.sistolik, v.diastolik, v.gula_mgdl, v.suhu_c, v.nadi)
        skor = SkorRisiko(id_pemeriksaan=p.id_pemeriksaan, kategori=hasil.kategori, tanggal_prediksi=svc_jadwal.sekarang())
        p.skor = skor
        ibu.status_risiko = hasil.kategori
        db.flush()
    except Exception as e:  # noqa: BLE001 - skoring tidak boleh menggagalkan pencatatan
        db.rollback()
        skor = None
        log.error("Skoring gagal untuk pemeriksaan %s (%s)", p.id_pemeriksaan, type(e).__name__)

    if skor is None:
        db.expire_all()
        p = db.get(Pemeriksaan, p.id_pemeriksaan)
        return HasilPencatatanOut(
            pemeriksaan=PemeriksaanOut.model_validate(p),
            pesan_whatsapp=PesanWhatsappOut(dikirim=False, alasan="Skor risiko belum tersedia, pesan WhatsApp tidak dikirim."),
            jadwal=None,
        )

    dikirim, alasan, jadwal, id_notif = svc_notif.tangani_hasil_skor(db, ibu, bidan, skor.kategori, skor)
    if id_notif is not None:
        # Pesan pertama dikirim di latar belakang, tidak menahan respons ke bidan (NFR-03).
        tugas.add_task(svc_notif.proses_kirim, session_factory(), id_notif)

    return HasilPencatatanOut(
        pemeriksaan=PemeriksaanOut.model_validate(p),
        pesan_whatsapp=PesanWhatsappOut(dikirim=dikirim, alasan=alasan),
        jadwal=JadwalOut.model_validate(jadwal) if jadwal else None,
    )
