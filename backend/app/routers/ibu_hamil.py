import logging

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_bidan, ibu_milik
from ..models import Bidan, IbuHamil
from ..schemas import IbuIn, IbuOut, StatusPersalinanIn
from ..services import jadwal as svc_jadwal

log = logging.getLogger("maternalguard.ibu")
router = APIRouter(prefix="/ibu-hamil", tags=["ibu hamil"])


@router.get("", response_model=list[IbuOut])
def daftar(
    cari: str | None = None,
    status_risiko: str | None = Query(default=None, pattern="^(low risk|mid risk|high risk)$"),
    status_persalinan: str | None = Query(default=None, pattern="^(belum lahir|sudah lahir)$"),
    db: Session = Depends(get_db),
    bidan: Bidan = Depends(get_current_bidan),
):
    q = select(IbuHamil).where(IbuHamil.id_bidan == bidan.id_bidan)
    if cari and cari.strip():
        like = f"%{cari.strip()}%"
        q = q.where(or_(IbuHamil.nama.ilike(like), IbuHamil.no_wa.like(like)))
    if status_risiko:
        q = q.where(IbuHamil.status_risiko == status_risiko)
    if status_persalinan:
        q = q.where(IbuHamil.status_persalinan == status_persalinan)
    return list(db.scalars(q.order_by(IbuHamil.nama, IbuHamil.id_ibu)))


@router.post("", response_model=IbuOut, status_code=status.HTTP_201_CREATED)
def tambah(body: IbuIn, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    ibu = IbuHamil(id_bidan=bidan.id_bidan, **body.model_dump())
    db.add(ibu)
    db.commit()
    log.info("Ibu hamil %s dicatat oleh bidan %s (persetujuan_wa=%s)", ibu.id_ibu, bidan.id_bidan, ibu.persetujuan_wa)
    return ibu


@router.get("/{id_ibu}", response_model=IbuOut)
def detail(id_ibu: int, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    return ibu_milik(db, id_ibu, bidan)


@router.put("/{id_ibu}", response_model=IbuOut)
def ubah(id_ibu: int, body: IbuIn, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    ibu = ibu_milik(db, id_ibu, bidan)
    persetujuan_lama = ibu.persetujuan_wa
    for k, v in body.model_dump().items():
        setattr(ibu, k, v)
    if persetujuan_lama != ibu.persetujuan_wa:
        # Perubahan persetujuan tercatat (Bagian 10).
        log.info("AUDIT persetujuan_wa ibu=%s bidan=%s: %s -> %s", ibu.id_ibu, bidan.id_bidan, persetujuan_lama, ibu.persetujuan_wa)
    if persetujuan_lama and not ibu.persetujuan_wa:
        svc_jadwal.hentikan_jadwal(db, ibu.id_ibu, "persetujuan dicabut")
    db.commit()
    return ibu


@router.patch("/{id_ibu}/status-persalinan", response_model=IbuOut)
def status_persalinan(id_ibu: int, body: StatusPersalinanIn, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    """FR-11. Satu transaksi: ubah status dan hentikan semua jadwal bila sudah lahir."""
    from fastapi import HTTPException

    ibu = ibu_milik(db, id_ibu, bidan)
    if body.status_persalinan == "sudah lahir":
        if body.tanggal_persalinan is None:
            raise HTTPException(422, [{"loc": ["body", "tanggal_persalinan"], "msg": "Tanggal persalinan wajib diisi.", "type": "value_error"}])
        ibu.status_persalinan = "sudah lahir"
        ibu.tanggal_persalinan = body.tanggal_persalinan
        svc_jadwal.hentikan_jadwal(db, ibu.id_ibu, "ibu sudah lahir")
    else:
        # Koreksi data: jadwal yang sudah berhenti tidak aktif kembali otomatis.
        ibu.status_persalinan = "belum lahir"
        ibu.tanggal_persalinan = None
    db.commit()
    return ibu
