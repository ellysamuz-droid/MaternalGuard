import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..models import Bidan
from ..schemas import BidanOut, BidanRingkas, LoginIn, LoginOut, RegisterIn
from ..security import buat_token, hash_password, pembatas_login, verify_password

log = logging.getLogger("maternalguard.auth")
router = APIRouter(prefix="/auth", tags=["auth"])

# Hash tiruan agar waktu respons tidak membedakan email yang ada dan tidak ada.
_DUMMY_HASH = hash_password("tidak-dipakai-123")


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if pembatas_login.terkunci(email):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.")
    bidan = db.scalar(select(Bidan).where(Bidan.email == email))
    ok = verify_password(body.password, bidan.password if bidan else _DUMMY_HASH)
    if not bidan or not ok:
        pembatas_login.catat_gagal(email)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email atau kata sandi salah.")
    pembatas_login.reset(email)
    return LoginOut(access_token=buat_token(bidan.id_bidan, bidan.nama), bidan=BidanRingkas(id_bidan=bidan.id_bidan, nama=bidan.nama))


@router.post("/register", response_model=BidanOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    """ASUMSI: belum ada di dokumen v2.0 (keputusan terbuka nomor 5). Nonaktifkan dengan REGISTRATION_ENABLED=false."""
    if not get_settings().registration_enabled:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Pendaftaran bidan sedang tidak dibuka.")
    if db.scalar(select(Bidan.id_bidan).where(Bidan.email == body.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email sudah terdaftar.")
    bidan = Bidan(nama=body.nama, email=body.email, no_hp=body.no_hp, password=hash_password(body.password))
    db.add(bidan)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email sudah terdaftar.") from None
    log.info("Bidan baru terdaftar id=%s", bidan.id_bidan)
    return bidan
