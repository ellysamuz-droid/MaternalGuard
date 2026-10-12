from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_bidan, ibu_milik
from ..models import Bidan, HasilLab
from ..schemas import HasilLabIn, HasilLabOut, proteinuria_positif

router = APIRouter(prefix="/ibu-hamil/{id_ibu}/hasil-lab", tags=["hasil lab"])


def _out(l: HasilLab) -> HasilLabOut:
    return HasilLabOut(
        id_lab=l.id_lab,
        id_ibu=l.id_ibu,
        id_bidan=l.id_bidan,
        tanggal_lab=l.tanggal_lab,
        protein_dipstik=l.protein_dipstik,
        protein_24jam=l.protein_24jam,
        rasio_protein_kreatinin=l.rasio_protein_kreatinin,
        catatan=l.catatan,
        proteinuria_positif=proteinuria_positif(l.protein_dipstik, l.protein_24jam, l.rasio_protein_kreatinin),
    )


@router.get("", response_model=list[HasilLabOut])
def daftar(id_ibu: int, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    ibu_milik(db, id_ibu, bidan)
    rows = db.scalars(select(HasilLab).where(HasilLab.id_ibu == id_ibu).order_by(HasilLab.tanggal_lab.desc(), HasilLab.id_lab.desc()))
    return [_out(l) for l in rows]


@router.post("", response_model=HasilLabOut, status_code=status.HTTP_201_CREATED)
def tambah(id_ibu: int, body: HasilLabIn, db: Session = Depends(get_db), bidan: Bidan = Depends(get_current_bidan)):
    """FR-06. Hasil lab belum menjadi input model; proteinuria_positif dihitung dari ambang yang dikonfigurasi."""
    ibu_milik(db, id_ibu, bidan)
    l = HasilLab(id_ibu=id_ibu, id_bidan=bidan.id_bidan, **body.model_dump())
    db.add(l)
    db.commit()
    return _out(l)
