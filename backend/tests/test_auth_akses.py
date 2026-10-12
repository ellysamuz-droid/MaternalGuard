from app.config import get_settings

from .conftest import buat_ibu, daftar_bidan

P = "/api/v1"


def test_health(client):
    r = client.get(f"{P}/health")
    assert r.status_code == 200 and r.json()["database"] == "ok"


def test_login_register_dan_token(client):
    h = daftar_bidan(client)
    import jwt

    tok = h["Authorization"].split()[1]
    payload = jwt.decode(tok, options={"verify_signature": False})
    assert payload["nama"] == "Bidan Siti Aminah" and payload["sub"] == "1" and payload["exp"] > payload["iat"]


def test_password_disimpan_sebagai_hash(client, sf):
    from app.models import Bidan

    daftar_bidan(client)
    with sf() as db:
        b = db.get(Bidan, 1)
        assert b.password.startswith("$2") and "rahasia123" not in b.password


def test_login_salah_dan_dibatasi(client):
    daftar_bidan(client)
    for _ in range(5):
        r = client.post(f"{P}/auth/login", json={"email": "bidan@uji.id", "password": "salah"})
        assert r.status_code == 401
    # percobaan ke-6 diblokir, bahkan dengan sandi benar
    r = client.post(f"{P}/auth/login", json={"email": "bidan@uji.id", "password": "rahasia123"})
    assert r.status_code == 429


def test_register_duplikat_dan_validasi(client):
    daftar_bidan(client)
    d = {"nama": "Lain", "email": "BIDAN@uji.id", "no_hp": "081200001111", "password": "rahasia123"}
    assert client.post(f"{P}/auth/register", json=d).status_code == 409
    r = client.post(f"{P}/auth/register", json={**d, "email": "baru@uji.id", "password": "pendek"})
    assert r.status_code == 422
    r = client.post(f"{P}/auth/register", json={**d, "email": "baru@uji.id", "password": "hurufsajaa"})
    assert r.status_code == 422


def test_register_bisa_dimatikan(client):
    get_settings().registration_enabled = False
    r = client.post(f"{P}/auth/register", json={"nama": "Bidan Uji", "email": "x@uji.id", "no_hp": "081200001111", "password": "rahasia123"})
    assert r.status_code == 403


def test_endpoint_wajib_token(client):
    assert client.get(f"{P}/ibu-hamil").status_code == 401
    assert client.get(f"{P}/ibu-hamil", headers={"Authorization": "Bearer palsu"}).status_code == 401
    assert client.get(f"{P}/jenis-keluhan").status_code == 401


def test_token_tanda_tangan_salah_ditolak(client):
    import jwt

    palsu = jwt.encode({"sub": "1", "exp": 9999999999}, "kunci-lain-yang-panjang-sekali-123456", algorithm="HS256")
    assert client.get(f"{P}/ibu-hamil", headers={"Authorization": f"Bearer {palsu}"}).status_code == 401


def test_bidan_hanya_melihat_ibu_miliknya(client):
    a = daftar_bidan(client, email="a@uji.id", nama="Bidan A")
    b = daftar_bidan(client, email="b@uji.id", nama="Bidan B")
    ibu = buat_ibu(client, a)
    assert [i["id_ibu"] for i in client.get(f"{P}/ibu-hamil", headers=a).json()] == [ibu["id_ibu"]]
    assert client.get(f"{P}/ibu-hamil", headers=b).json() == []
    pid = ibu["id_ibu"]
    # semua turunan endpoint ibu bidan lain = 404 (bukan 403, agar keberadaan tidak bocor)
    for path in ("", "/pemeriksaan", "/hasil-lab", "/notifikasi", "/jadwal-pesan"):
        assert client.get(f"{P}/ibu-hamil/{pid}{path}", headers=b).status_code == 404, path
    assert client.put(f"{P}/ibu-hamil/{pid}", json={}, headers=b).status_code in (404, 422)
    assert client.patch(f"{P}/ibu-hamil/{pid}/status-persalinan", json={"status_persalinan": "belum lahir"}, headers=b).status_code == 404
    assert client.post(f"{P}/ibu-hamil/{pid}/pemeriksaan", json={}, headers=b).status_code in (404, 422)


def test_riwayat_notifikasi_tidak_bisa_diubah_atau_dihapus(client, auth):
    ibu = buat_ibu(client, auth)
    for m in ("put", "delete", "post", "patch"):
        r = getattr(client, m)(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth)
        assert r.status_code == 405, m


def test_validasi_ibu_422_dengan_lokasi_field(client, auth):
    from .conftest import body_ibu

    r = client.post(f"{P}/ibu-hamil", json=body_ibu(no_wa="0812"), headers=auth)
    assert r.status_code == 422
    assert r.json()["detail"][0]["loc"][-1] == "no_wa"  # front end memakai elemen terakhir loc sebagai nama field
    assert client.post(f"{P}/ibu-hamil", json=body_ibu(tanggal_lahir="2020-01-01"), headers=auth).status_code == 422
    assert client.post(f"{P}/ibu-hamil", json=body_ibu(hpht="2999-01-01"), headers=auth).status_code == 422


def test_cari_dan_filter(client, auth):
    buat_ibu(client, auth, nama="Siti Rahma", no_wa="6281234500001")
    buat_ibu(client, auth, nama="Dewi Lestari", no_wa="6281234500002")
    q = lambda **p: [i["nama"] for i in client.get(f"{P}/ibu-hamil", params=p, headers=auth).json()]  # noqa: E731
    assert q(cari="siti") == ["Siti Rahma"]
    assert q(cari="500002") == ["Dewi Lestari"]
    assert q(status_persalinan="sudah lahir") == []
    assert client.get(f"{P}/ibu-hamil", params={"status_risiko": "bukan kategori"}, headers=auth).status_code == 422
