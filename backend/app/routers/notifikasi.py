from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_bidan, ibu_milik
from ..models import Bidan, IbuHamil, JadwalPesan, JenisKeluhan, RiwayatNotifikasi
from ..schemas import JadwalOut, JadwalPatch, JenisKeluhanOut, NotifikasiOut
from ..services import jadwal as svc_jadwal

router = APIRouter(tags=["notifikasi dan jadwal"])


@router.get("/ibu-hamil/{id_ibu}/notifikasi", response_model=list[NotifikasiOut])
def riwayat_notifikasi(id_ibu: int, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    """FR-10. Riwayat hanya dibaca; tidak ada endpoint ubah atau hapus."""
    ibu_milik(db, id_ibu, bidan)
    q = (
        select(RiwayatNotifikasi)
        .join(JadwalPesan, JadwalPesan.id_jadwal == RiwayatNotifikasi.id_jadwal)
        .where(JadwalPesan.id_ibu == id_ibu)
        .order_by(RiwayatNotifikasi.waktu_kirim.desc(), RiwayatNotifikasi.id_notifikasi.desc())
    )
    return list(db.scalars(q))


@router.get("/ibu-hamil/{id_ibu}/jadwal-pesan", response_model=list[JadwalOut])
def daftar_jadwal(id_ibu: int, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    ibu_milik(db, id_ibu, bidan)
    return list(db.scalars(select(JadwalPesan).where(JadwalPesan.id_ibu == id_ibu).order_by(JadwalPesan.id_jadwal.desc())))


@router.patch("/jadwal-pesan/{id_jadwal}", response_model=JadwalOut)
def ubah_jadwal(id_jadwal: int, body: JadwalPatch, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    """FR-12: jeda atau aktifkan kembali. Jadwal yang sudah berhenti tidak bisa diaktifkan."""
    j = db.get(JadwalPesan, id_jadwal)
    ibu: IbuHamil | None = db.get(IbuHamil, j.id_ibu) if j else None
    if j is None or ibu is None or ibu.id_bidan != bidan.id_bidan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Jadwal pesan tidak ditemukan.")
    if j.status == "berhenti":
        raise HTTPException(status.HTTP_409_CONFLICT, "Jadwal sudah berhenti dan tidak dapat diaktifkan kembali.")
    if body.status == "aktif":
        if ibu.status_persalinan == "sudah lahir":
            raise HTTPException(status.HTTP_409_CONFLICT, "Ibu sudah lahir, jadwal tidak dapat diaktifkan.")
        if not ibu.persetujuan_wa:
            raise HTTPException(status.HTTP_409_CONFLICT, "Persetujuan WhatsApp ibu belum aktif.")
        if j.status != "aktif":
            svc_jadwal.aktifkan_kembali(j)
    else:
        j.status = "dijeda"
    db.commit()
    return j


@router.get("/jenis-keluhan", response_model=list[JenisKeluhanOut])
def jenis_keluhan(db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    return list(db.scalars(select(JenisKeluhan).order_by(JenisKeluhan.id_jenis_keluhan)))
