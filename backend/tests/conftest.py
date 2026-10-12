"""Pengujian berjalan di PostgreSQL ASLI (bukan SQLite) agar penguncian baris dan indeks parsial teruji.
Memakai TEST_DATABASE_URL bila ada, jika tidak memakai PostgreSQL tertanam dari paket `pgserver`.
Skema dibuat lewat migrasi Alembic sehingga migrasi ikut teruji."""

import os
import tempfile
from datetime import date, timedelta

# --- siapkan lingkungan SEBELUM modul aplikasi diimpor ---
_url = os.environ.get("TEST_DATABASE_URL")
_srv = None
if not _url:
    import pgserver

    _srv = pgserver.get_server(tempfile.mkdtemp(prefix="mgtest"), cleanup_mode="stop")
    _url = _srv.get_uri()
os.environ.update(
    DATABASE_URL=_url,
    JWT_SECRET="rahasia-uji-yang-cukup-panjang-1234567890",
    ENVIRONMENT="test",
    WA_RETRY_DELAY_SECONDS="0",
    WA_MAX_RETRY="3",
    WHATSAPP_PROVIDER="fake",
    WA_APP_SECRET="rahasia-webhook-uji",
    WA_VERIFY_TOKEN="token-verifikasi-uji",
    LOGIN_MAX_ATTEMPTS="5",
)

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import seed  # noqa: E402
from app.config import get_settings  # noqa: E402
from app.db import get_engine, session_factory  # noqa: E402
from app.main import app  # noqa: E402
from app.security import pembatas_login  # noqa: E402
from app.services.scoring import get_scorer  # noqa: E402
from app.whatsapp import set_provider  # noqa: E402
from app.whatsapp.base import SendRequest, SendResult, WhatsAppError  # noqa: E402
from app.whatsapp.fake import FakeWhatsApp  # noqa: E402

TABEL = "detail_keluhan, riwayat_notifikasi, jadwal_pesan, skor_risiko, vital, pemeriksaan, hasil_lab, ibu_hamil, template_pesan, jenis_keluhan, bidan"


@pytest.fixture(scope="session", autouse=True)
def _migrasi():
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    yield


class SkorTetap:
    """Pengganti model: kategori ditentukan pengujian agar deterministik."""

    def __init__(self):
        self.kategori = "low risk"
        self.error: Exception | None = None
        self.panggilan: list[tuple] = []

    def prediksi(self, usia, sistolik, diastolik, gula_mgdl, suhu_c, nadi):
        self.panggilan.append((usia, sistolik, diastolik, gula_mgdl, suhu_c, nadi))
        if self.error:
            raise self.error
        from app.services.scoring import HasilSkor

        return HasilSkor(self.kategori, {self.kategori: 1.0})


class ProviderGagal:
    """Menolak `gagal_dulu` kali pertama, lalu berhasil."""

    def __init__(self, gagal_dulu: int):
        self.gagal_dulu = gagal_dulu
        self.panggilan = 0
        self.terkirim: list[SendRequest] = []

    def send(self, req: SendRequest) -> SendResult:
        self.panggilan += 1
        if self.panggilan <= self.gagal_dulu:
            raise WhatsAppError("ditolak (uji)")
        self.terkirim.append(req)
        return SendResult(message_id=f"uji.{self.panggilan}")


@pytest.fixture(autouse=True)
def bersih():
    with get_engine().begin() as c:
        c.execute(text(f"TRUNCATE {TABEL} RESTART IDENTITY CASCADE"))
    seed.jalankan()
    pembatas_login._gagal.clear()
    get_settings().registration_enabled = True
    yield


@pytest.fixture
def skor():
    s = SkorTetap()
    from app.services.scoring import get_scorer as dep

    app.dependency_overrides[dep] = lambda: s
    yield s
    app.dependency_overrides.clear()


@pytest.fixture
def wa():
    p = FakeWhatsApp(simulate=False)
    set_provider(p)
    yield p
    set_provider(None)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sf():
    return session_factory()


def daftar_bidan(client, email="bidan@uji.id", nama="Bidan Siti Aminah", hp="081234567890", pw="rahasia123"):
    r = client.post("/api/v1/auth/register", json={"nama": nama, "email": email, "no_hp": hp, "password": pw})
    assert r.status_code == 201, r.text
    t = client.post("/api/v1/auth/login", json={"email": email, "password": pw})
    assert t.status_code == 200, t.text
    return {"Authorization": f"Bearer {t.json()['access_token']}"}


@pytest.fixture
def auth(client):
    return daftar_bidan(client)


def body_ibu(**kw):
    d = dict(
        nama="Siti Rahma",
        no_wa="6281234500001",
        tanggal_lahir="1997-04-12",
        alamat="Jl. Melati No. 4, Tegal",
        hpht=(date.today() - timedelta(days=100)).isoformat(),
        riwayat_preeklamsia="Tidak ada",
        riwayat_lain="",
        persetujuan_wa=True,
    )
    d.update(kw)
    return d


def buat_ibu(client, auth, **kw):
    r = client.post("/api/v1/ibu-hamil", json=body_ibu(**kw), headers=auth)
    assert r.status_code == 201, r.text
    return r.json()


def body_periksa(sis=150, dia=98, **kw):
    v = dict(sistolik=sis, diastolik=dia, nadi=80, suhu=36.7, gula_darah=95, berat_badan=64)
    v.update(kw)
    return {"vital": v, "id_jenis_keluhan": [], "keluhan_lain": "", "tanggal_kontrol_berikutnya": None}


def periksa(client, auth, id_ibu, **kw):
    return client.post(f"/api/v1/ibu-hamil/{id_ibu}/pemeriksaan", json=body_periksa(**kw), headers=auth)
