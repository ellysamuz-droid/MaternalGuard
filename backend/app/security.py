import time
from datetime import UTC, datetime, timedelta
from threading import Lock

import bcrypt
import jwt

from .config import get_settings

ALGO = "HS256"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def buat_token(id_bidan: int, nama: str) -> str:
    s = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(id_bidan),
        "nama": nama,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=s.jwt_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, s.jwt_secret, algorithm=ALGO)


def baca_token(token: str) -> dict:
    """Melempar jwt.PyJWTError bila tanda tangan salah atau token kedaluwarsa."""
    return jwt.decode(token, get_settings().jwt_secret, algorithms=[ALGO], options={"require": ["exp", "sub"]})


class PembatasLogin:
    """Pembatas percobaan login (NFR-01) di memori proses.

    Cukup untuk satu instance API (sesuai arsitektur). Bila API dijalankan lebih dari
    satu replika, pindahkan ke tabel database atau Redis.
    """

    def __init__(self) -> None:
        self._gagal: dict[str, list[float]] = {}
        self._lock = Lock()

    def _bersihkan(self, key: str, jendela: float) -> list[float]:
        now = time.monotonic()
        arr = [t for t in self._gagal.get(key, []) if now - t < jendela]
        self._gagal[key] = arr
        return arr

    def terkunci(self, key: str) -> bool:
        s = get_settings()
        with self._lock:
            return len(self._bersihkan(key, s.login_window_minutes * 60)) >= s.login_max_attempts

    def catat_gagal(self, key: str) -> None:
        s = get_settings()
        with self._lock:
            self._bersihkan(key, s.login_window_minutes * 60).append(time.monotonic())

    def reset(self, key: str) -> None:
        with self._lock:
            self._gagal.pop(key, None)


pembatas_login = PembatasLogin()
