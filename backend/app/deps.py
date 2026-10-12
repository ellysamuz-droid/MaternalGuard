import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .db import get_db
from .models import Bidan, IbuHamil
from .security import baca_token

_bearer = HTTPBearer(auto_error=False)
_TIDAK_VALID = "Token tidak valid atau kedaluwarsa."


def get_current_bidan(
    cred: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Bidan:
    if cred is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _TIDAK_VALID, headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = baca_token(cred.credentials)
        id_bidan = int(payload["sub"])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _TIDAK_VALID, headers={"WWW-Authenticate": "Bearer"}) from None
    bidan = db.get(Bidan, id_bidan)
    if bidan is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _TIDAK_VALID, headers={"WWW-Authenticate": "Bearer"})
    return bidan


def ibu_milik(db: Session, id_ibu: int, bidan: Bidan) -> IbuHamil:
    """Akses data dibatasi id_bidan dari token (Bagian 10). Ibu bidan lain diperlakukan sama
    seperti tidak ada (404) agar keberadaannya tidak bocor."""
    ibu = db.get(IbuHamil, id_ibu)
    if ibu is None or ibu.id_bidan != bidan.id_bidan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ibu hamil tidak ditemukan.")
    return ibu
