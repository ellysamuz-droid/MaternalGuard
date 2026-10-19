import hashlib
import hmac
import json
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from app.models import JadwalPesan, RiwayatNotifikasi
from app.services import jadwal as svc_jadwal
from app.services.scoring import Scorer
from app.worker import jalankan_jadwal

from .conftest import ProviderGagal, buat_ibu, periksa
from app.services import notifikasi as svc_notif

P = "/api/v1"


# ---------------- pemeriksaan & skoring ----------------
def test_pemeriksaan_tersimpan_satu_transaksi_dengan_keluhan(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.kategori = "low risk"
    body = {"vital": {"sistolik": 118, "diastolik": 76, "nadi": None, "suhu": 36.6, "gula_darah": 92, "berat_badan": 61},
            "id_jenis_keluhan": [1, 2, 2], "keluhan_lain": "mual ringan", "tanggal_kontrol_berikutnya": None}
    r = client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/pemeriksaan", json=body, headers=auth)
    assert r.status_code == 201, r.text
    d = r.json()["pemeriksaan"]
    assert d["skor"]["kategori"] == "low risk" and d["vital"]["nadi"] is None
    assert [k["id_jenis_keluhan"] for k in d["keluhan"]] == [1, 2]  # duplikat dibuang
    assert client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}", headers=auth).json()["status_risiko"] == "low risk"


def test_konversi_satuan_disimpan_celsius_dan_mgdl(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    r = periksa(client, auth, ibu["id_ibu"], suhu=98.6, suhu_satuan="F", gula_darah=5.0, gula_darah_satuan="mmol/L")
    assert r.status_code == 201, r.text
    v = r.json()["pemeriksaan"]["vital"]
    assert v["suhu"] == 37.0 and abs(v["gula_darah"] - 90.1) < 0.2
    # model menerima BodyTemp dalam Fahrenheit dan BS dalam mmol/L; pengujian ini memeriksa nilai yang dikirim ke skor
    usia, sis, dia, gula_mgdl, suhu_c, nadi = skor.panggilan[-1]
    assert suhu_c == 37.0 and abs(gula_mgdl - 90.1) < 0.2


def test_model_asli_mengikuti_contoh_kontrak():
    """Contoh pada KONTRAK.md: usia 12, 120/95, BS 7.8 mmol/L, 98 F, nadi 60 -> low risk (peluang ~0,473)."""
    s = Scorer.load("models/model_final.pkl")
    h = s.prediksi(12, 120, 95, 7.8 * 18.0156, (98 - 32) * 5 / 9, 60)
    assert h.kategori == "low risk"
    assert abs(h.peluang["low risk"] - 0.473) < 0.01 and abs(h.peluang["high risk"] - 0.188) < 0.01


def test_model_asli_menangani_nadi_kosong():
    s = Scorer.load("models/model_final.pkl")
    h = s.prediksi(25, 140, 90, 100, 37.0, None)
    assert h.kategori in ("low risk", "mid risk", "high risk")


def test_end_to_end_dengan_model_asli(client, auth, wa):
    ibu = buat_ibu(client, auth)
    r = periksa(client, auth, ibu["id_ibu"], sis=170, dia=115, gula_darah=140, suhu=38.0, nadi=100)
    assert r.status_code == 201, r.text
    assert r.json()["pemeriksaan"]["skor"]["kategori"] in ("low risk", "mid risk", "high risk")


def test_skoring_gagal_tidak_membatalkan_pencatatan(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.error = RuntimeError("model rusak")
    r = periksa(client, auth, ibu["id_ibu"])
    assert r.status_code == 201
    d = r.json()
    assert d["pemeriksaan"]["skor"] is None and d["pesan_whatsapp"]["dikirim"] is False and d["jadwal"] is None
    riwayat = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/pemeriksaan", headers=auth).json()
    assert len(riwayat) == 1 and riwayat[0]["vital"]["sistolik"] == 150  # tetap tersimpan
    assert wa.terkirim == []


def test_validasi_pemeriksaan(client, auth, skor):
    ibu = buat_ibu(client, auth)
    r = periksa(client, auth, ibu["id_ibu"], sis=100, dia=100)
    assert r.status_code == 422 and r.json()["detail"][0]["loc"][-1] == "diastolik"
    assert periksa(client, auth, ibu["id_ibu"], suhu=50).status_code == 422
    assert periksa(client, auth, ibu["id_ibu"], gula_darah=5000).status_code == 422
    b = {"vital": {"sistolik": 120, "diastolik": 80, "suhu": 36.5, "gula_darah": 90, "berat_badan": 60}, "id_jenis_keluhan": [999]}
    assert client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/pemeriksaan", json=b, headers=auth).status_code == 422
    assert client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/pemeriksaan", headers=auth).json() == []  # tidak ada yang tersimpan


# ---------------- high risk -> jadwal + pesan pertama ----------------
def test_high_risk_buat_jadwal_dan_kirim_pesan_pembuka(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    t0 = datetime.now(UTC)
    r = periksa(client, auth, ibu["id_ibu"])
    d = r.json()
    assert d["pesan_whatsapp"] == {"dikirim": True, "alasan": None}
    j = d["jadwal"]
    assert j["status"] == "aktif" and j["frekuensi"] == "2x per minggu" and j["hari_kirim"] == "Selasa, Jumat" and j["jam_kirim"] == "10:00"
    kb = datetime.fromisoformat(j["kirim_berikutnya"])
    assert kb - t0 >= timedelta(days=2)  # pesan terjadwal pertama minimal 2 hari setelah pesan langsung
    wib = kb.astimezone(svc_jadwal.WIB)
    assert wib.weekday() in (1, 4) and (wib.hour, wib.minute) == (10, 0)

    notif = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()
    assert len(notif) == 1 and notif[0]["status_kirim"] == "menunggu"
    assert notif[0]["id_pesan_gateway"].startswith("fake.")  # dikirim di latar belakang
    assert "Siti Rahma" in notif[0]["isi_pesan"] and "{" not in notif[0]["isi_pesan"]
    assert len(wa.terkirim) == 1 and wa.terkirim[0].jenis_pesan == "pembuka" and wa.terkirim[0].to == "6281234500001"
    assert wa.terkirim[0].params == ["Siti Rahma", "Siti Aminah", "081234567890"]  # {{1}} ibu, {{2}} bidan, {{3}} no HP bidan


def test_high_risk_berulang_tetap_satu_jadwal(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    j1 = periksa(client, auth, ibu["id_ibu"]).json()["jadwal"]
    j2 = periksa(client, auth, ibu["id_ibu"]).json()["jadwal"]
    assert j1["id_jadwal"] == j2["id_jadwal"] and j2["id_skor"] != j1["id_skor"]
    assert len(client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/jadwal-pesan", headers=auth).json()) == 1
    assert len(client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()) == 2  # tiap upaya = satu baris


def test_alasan_tidak_kirim(client, auth, skor, wa):
    skor.kategori = "high risk"
    tanpa = buat_ibu(client, auth, persetujuan_wa=False, nama="Tanpa Persetujuan")
    r = periksa(client, auth, tanpa["id_ibu"]).json()
    assert r["pesan_whatsapp"]["dikirim"] is False and "Persetujuan" in r["pesan_whatsapp"]["alasan"] and r["jadwal"] is None

    lahir = buat_ibu(client, auth, nama="Sudah Lahir", no_wa="6281234500009")
    client.patch(f"{P}/ibu-hamil/{lahir['id_ibu']}/status-persalinan", json={"status_persalinan": "sudah lahir", "tanggal_persalinan": "2026-10-01"}, headers=auth)
    r = periksa(client, auth, lahir["id_ibu"]).json()
    assert r["pesan_whatsapp"]["dikirim"] is False and "melahirkan" in r["pesan_whatsapp"]["alasan"] and r["jadwal"] is None
    assert wa.terkirim == []


def test_kategori_turun_menghentikan_jadwal(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    periksa(client, auth, ibu["id_ibu"])
    for kat in ("mid risk", "low risk"):
        skor.kategori = "high risk"
        periksa(client, auth, ibu["id_ibu"])
        skor.kategori = kat
        r = periksa(client, auth, ibu["id_ibu"]).json()
        assert r["pesan_whatsapp"]["dikirim"] is False
        js = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/jadwal-pesan", headers=auth).json()
        assert all(j["status"] == "berhenti" and j["kirim_berikutnya"] is None and j["tanggal_berhenti"] for j in js)


def test_jeda_aktifkan_dan_pesan_tidak_dikirim_saat_dijeda(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    jid = periksa(client, auth, ibu["id_ibu"]).json()["jadwal"]["id_jadwal"]
    assert client.patch(f"{P}/jadwal-pesan/{jid}", json={"status": "dijeda"}, headers=auth).json()["status"] == "dijeda"
    wa.terkirim.clear()
    r = periksa(client, auth, ibu["id_ibu"]).json()
    assert r["pesan_whatsapp"]["dikirim"] is False and "dijeda" in r["pesan_whatsapp"]["alasan"] and wa.terkirim == []
    assert client.patch(f"{P}/jadwal-pesan/{jid}", json={"status": "aktif"}, headers=auth).json()["status"] == "aktif"


def test_jadwal_berhenti_tidak_bisa_diaktifkan_dan_aturan_409(client, auth, skor, wa):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    jid = periksa(client, auth, ibu["id_ibu"]).json()["jadwal"]["id_jadwal"]
    skor.kategori = "low risk"
    periksa(client, auth, ibu["id_ibu"])
    assert client.patch(f"{P}/jadwal-pesan/{jid}", json={"status": "aktif"}, headers=auth).status_code == 409
    assert client.patch(f"{P}/jadwal-pesan/9999", json={"status": "aktif"}, headers=auth).status_code == 404
    assert client.patch(f"{P}/jadwal-pesan/{jid}", json={"status": "berhenti"}, headers=auth).status_code == 422


def test_persetujuan_dicabut_dan_sudah_lahir_menghentikan_jadwal(client, auth, skor, wa):
    skor.kategori = "high risk"
    a = buat_ibu(client, auth, nama="Cabut Setuju", no_wa="6281234500011")
    periksa(client, auth, a["id_ibu"])
    from .conftest import body_ibu

    r = client.put(f"{P}/ibu-hamil/{a['id_ibu']}", json=body_ibu(nama="Cabut Setuju", no_wa="6281234500011", persetujuan_wa=False), headers=auth)
    assert r.status_code == 200 and r.json()["persetujuan_wa"] is False
    assert [j["status"] for j in client.get(f"{P}/ibu-hamil/{a['id_ibu']}/jadwal-pesan", headers=auth).json()] == ["berhenti"]

    b = buat_ibu(client, auth, nama="Sudah Melahirkan", no_wa="6281234500012")
    periksa(client, auth, b["id_ibu"])
    assert client.patch(f"{P}/ibu-hamil/{b['id_ibu']}/status-persalinan", json={"status_persalinan": "sudah lahir"}, headers=auth).status_code == 422  # tanggal wajib
    r = client.patch(f"{P}/ibu-hamil/{b['id_ibu']}/status-persalinan", json={"status_persalinan": "sudah lahir", "tanggal_persalinan": "2026-10-01"}, headers=auth)
    assert r.json()["status_persalinan"] == "sudah lahir"
    assert [j["status"] for j in client.get(f"{P}/ibu-hamil/{b['id_ibu']}/jadwal-pesan", headers=auth).json()] == ["berhenti"]


def test_indeks_parsial_mencegah_dua_jadwal_aktif(client, auth, skor, wa, sf):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    periksa(client, auth, ibu["id_ibu"])
    with sf() as db:
        db.add(JadwalPesan(id_ibu=ibu["id_ibu"], status="aktif", hari_kirim="x", jam_kirim="10:00", tanggal_mulai=datetime.now().date()))
        try:
            db.commit()
            raise AssertionError("seharusnya ditolak database")
        except IntegrityError:
            db.rollback()


# ---------------- pengiriman & ulang terbatas ----------------
def _buat_jadwal_high(client, auth, skor):
    ibu = buat_ibu(client, auth)
    skor.kategori = "high risk"
    return ibu, periksa(client, auth, ibu["id_ibu"]).json()


def test_ulang_terbatas_lalu_berhasil(client, auth, skor, sf):
    from app.whatsapp import set_provider

    p = ProviderGagal(gagal_dulu=2)
    set_provider(p)
    try:
        ibu, _ = _buat_jadwal_high(client, auth, skor)
    finally:
        set_provider(None)
    rows = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()
    assert sorted(r["status_kirim"] for r in rows) == ["gagal", "gagal", "menunggu"]  # tiap upaya satu baris
    assert p.panggilan == 3 and len(p.terkirim) == 1


def test_ulang_dibatasi_maksimal(client, auth, skor, sf):
    from app.whatsapp import set_provider

    p = ProviderGagal(gagal_dulu=99)
    set_provider(p)
    try:
        ibu, _ = _buat_jadwal_high(client, auth, skor)
    finally:
        set_provider(None)
    rows = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()
    assert [r["status_kirim"] for r in rows] == ["gagal", "gagal", "gagal"] and p.panggilan == 3


# ---------------- webhook ----------------
def _ttd(raw: bytes, secret="rahasia-webhook-uji"):
    return "sha256=" + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()


def _kirim_webhook(client, mid, status, ttd=True):
    raw = json.dumps({"entry": [{"changes": [{"value": {"statuses": [{"id": mid, "status": status}]}}]}]}).encode()
    h = {"X-Hub-Signature-256": _ttd(raw)} if ttd else {"X-Hub-Signature-256": "sha256=salah"}
    return client.post(f"{P}/webhook/whatsapp", content=raw, headers={**h, "Content-Type": "application/json"})


def test_webhook_memperbarui_status_tidak_menurun(client, auth, skor, wa):
    ibu, _ = _buat_jadwal_high(client, auth, skor)
    mid = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()[0]["id_pesan_gateway"]
    status = lambda: client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()[0]["status_kirim"]  # noqa: E731
    assert _kirim_webhook(client, mid, "delivered").json() == {"diperbarui": 1} and status() == "diterima"
    # "sent" tiba terlambat: tidak boleh menurunkan status
    assert _kirim_webhook(client, mid, "sent").json() == {"diperbarui": 0} and status() == "diterima"
    assert _kirim_webhook(client, mid, "failed").json() == {"diperbarui": 0} and status() == "diterima"
    assert _kirim_webhook(client, "id-tak-dikenal", "sent").json() == {"diperbarui": 0}


def test_webhook_gagal_dari_menunggu(client, auth, skor, wa):
    ibu, _ = _buat_jadwal_high(client, auth, skor)
    mid = client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()[0]["id_pesan_gateway"]
    _kirim_webhook(client, mid, "failed")
    assert client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/notifikasi", headers=auth).json()[0]["status_kirim"] == "gagal"


def test_webhook_tanda_tangan_dan_verifikasi(client):
    assert _kirim_webhook(client, "x", "sent", ttd=False).status_code == 403
    assert client.post(f"{P}/webhook/whatsapp", json={}).status_code == 403  # tanpa tanda tangan
    ok = client.get(f"{P}/webhook/whatsapp", params={"hub.mode": "subscribe", "hub.verify_token": "token-verifikasi-uji", "hub.challenge": "12345"})
    assert ok.status_code == 200 and ok.text == "12345"
    assert client.get(f"{P}/webhook/whatsapp", params={"hub.mode": "subscribe", "hub.verify_token": "salah", "hub.challenge": "1"}).status_code == 403


# ---------------- worker ----------------
def _mundurkan(sf, id_jadwal, menit=5):
    with sf() as db:
        j = db.get(JadwalPesan, id_jadwal)
        j.kirim_berikutnya = datetime.now(UTC) - timedelta(minutes=menit)
        db.commit()


def test_worker_kirim_tema_bergilir_dan_majukan_jadwal(client, auth, skor, wa, sf):
    ibu, d = _buat_jadwal_high(client, auth, skor)
    jid = d["jadwal"]["id_jadwal"]
    assert jalankan_jadwal(sf, wa) == 0  # belum jatuh tempo
    tema = []
    for _ in range(5):
        _mundurkan(sf, jid)
        assert jalankan_jadwal(sf, wa) == 1
        tema.append(wa.terkirim[-1].jenis_pesan)
    assert tema == ["kontrol", "istirahat dan pola hidup", "kenali tanda", "tanya kabar", "kontrol"]
    with sf() as db:
        j = db.get(JadwalPesan, jid)
        wib = j.kirim_berikutnya.astimezone(svc_jadwal.WIB)
        assert j.kirim_berikutnya > datetime.now(UTC) and wib.weekday() in (1, 4) and wib.hour == 10
        n = db.scalar(text("select count(*) from riwayat_notifikasi where id_jadwal=:j"), {"j": jid})
        assert n == 6  # 1 pembuka + 5 terjadwal
    assert jalankan_jadwal(sf, wa) == 0  # tidak mengirim ganda


def test_worker_melewati_jadwal_dijeda(client, auth, skor, wa, sf):
    ibu, d = _buat_jadwal_high(client, auth, skor)
    jid = d["jadwal"]["id_jadwal"]
    client.patch(f"{P}/jadwal-pesan/{jid}", json={"status": "dijeda"}, headers=auth)
    _mundurkan(sf, jid)
    n = len(wa.terkirim)
    assert jalankan_jadwal(sf, wa) == 0 and len(wa.terkirim) == n


def test_worker_menghentikan_jadwal_bila_syarat_tidak_terpenuhi(client, auth, skor, wa, sf):
    from app.models import IbuHamil

    ibu, d = _buat_jadwal_high(client, auth, skor)
    jid = d["jadwal"]["id_jadwal"]
    with sf() as db:  # simulasi perubahan langsung di database
        db.get(IbuHamil, ibu["id_ibu"]).persetujuan_wa = False
        db.commit()
    _mundurkan(sf, jid)
    n = len(wa.terkirim)
    assert jalankan_jadwal(sf, wa) == 0 and len(wa.terkirim) == n
    with sf() as db:
        assert db.get(JadwalPesan, jid).status == "berhenti"


def test_worker_penguncian_baris_mencegah_kirim_ganda(client, auth, skor, wa, sf):
    """Pada PostgreSQL asli: baris yang sedang dikunci proses lain dilewati (SKIP LOCKED)."""
    ibu, d = _buat_jadwal_high(client, auth, skor)
    jid = d["jadwal"]["id_jadwal"]
    _mundurkan(sf, jid)
    with sf() as penahan:
        penahan.execute(select(JadwalPesan).where(JadwalPesan.id_jadwal == jid).with_for_update())
        n0 = len(wa.terkirim)
        assert jalankan_jadwal(sf, wa) == 0  # dikunci proses lain: dilewati, tidak menunggu dan tidak ganda
        assert len(wa.terkirim) == n0
    assert jalankan_jadwal(sf, wa) == 1  # setelah kunci dilepas, diproses tepat sekali


def test_worker_gagal_kirim_dicatat_per_upaya(client, auth, skor, wa, sf):
    ibu, d = _buat_jadwal_high(client, auth, skor)
    jid = d["jadwal"]["id_jadwal"]
    _mundurkan(sf, jid)
    p = ProviderGagal(gagal_dulu=99)
    assert jalankan_jadwal(sf, p) == 1 and p.panggilan == 3
    with sf() as db:
        st = list(db.scalars(select(RiwayatNotifikasi.status_kirim).where(RiwayatNotifikasi.id_jadwal == jid).order_by(RiwayatNotifikasi.id_notifikasi)))
    assert st == ["menunggu", "gagal", "gagal", "gagal"]  # pembuka masih menunggu webhook + 3 upaya gagal


# ---------------- hasil lab ----------------
def test_hasil_lab_proteinuria_dan_pencatat(client, auth):
    ibu = buat_ibu(client, auth)
    base = {"tanggal_lab": "2026-10-01", "protein_24jam": None, "rasio_protein_kreatinin": None, "catatan": ""}
    pos = client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/hasil-lab", json={**base, "protein_dipstik": "+2"}, headers=auth)
    assert pos.status_code == 201 and pos.json()["proteinuria_positif"] is True and pos.json()["id_bidan"] == 1
    neg = client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/hasil-lab", json={**base, "protein_dipstik": "negatif"}, headers=auth).json()
    assert neg["proteinuria_positif"] is False
    p24 = client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/hasil-lab", json={**base, "protein_dipstik": "trace", "protein_24jam": 0.4}, headers=auth).json()
    assert p24["proteinuria_positif"] is True
    assert len(client.get(f"{P}/ibu-hamil/{ibu['id_ibu']}/hasil-lab", headers=auth).json()) == 3
    assert client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/hasil-lab", json={**base, "protein_dipstik": "+9"}, headers=auth).status_code == 422
    assert client.post(f"{P}/ibu-hamil/{ibu['id_ibu']}/hasil-lab", json={**base, "protein_dipstik": "+1", "tanggal_lab": "2999-01-01"}, headers=auth).status_code == 422


# ---------------- jadwal & template ----------------
def test_slot_berikutnya_selasa_jumat_pukul_10_wib():
    senin = datetime(2026, 10, 12, 8, 0, tzinfo=UTC)  # Senin 15.00 WIB
    s = svc_jadwal.slot_berikutnya(senin).astimezone(svc_jadwal.WIB)
    assert (s.weekday(), s.hour, s.day) == (1, 10, 13)  # Selasa 13 Okt 10.00 WIB
    jumat_siang = datetime(2026, 10, 16, 5, 0, tzinfo=UTC)  # Jumat 12.00 WIB (lewat jam 10)
    s = svc_jadwal.slot_berikutnya(jumat_siang).astimezone(svc_jadwal.WIB)
    assert (s.weekday(), s.day) == (1, 20)  # berikutnya Selasa 20 Okt


def test_render_template_dan_tidak_ada_placeholder_tersisa(client, auth, skor, wa, sf):
    from app.models import TemplatePesan

    with sf() as db:
        ts = list(db.scalars(select(TemplatePesan)))
    assert {t.jenis_pesan for t in ts} == {"pembuka", "kontrol", "istirahat dan pola hidup", "kenali tanda", "tanya kabar"}
    assert all("{bidan}" in t.isi_template for t in ts)  # tiap template memuat kalimat penutup berhenti menerima pesan


def test_daftar_jenis_keluhan(client, auth):
    r = client.get(f"{P}/jenis-keluhan", headers=auth).json()
    assert len(r) == 9 and sum(k["tanda_bahaya"] for k in r) == 6


def test_seed_idempoten():
    from app import seed

    assert seed.jalankan() == (0, 0)


# ---------------- pemulihan pesan tertunda & pengaman persetujuan ----------------
def _riwayat_tertunda(sf, id_ibu, umur_menit):
    from app.models import TemplatePesan

    with sf() as db:
        j = db.scalar(select(JadwalPesan).where(JadwalPesan.id_ibu == id_ibu))
        t = db.scalar(select(TemplatePesan).where(TemplatePesan.jenis_pesan == "pembuka"))
        r = RiwayatNotifikasi(id_jadwal=j.id_jadwal, id_template=t.id_template, isi_pesan="isi", no_wa_tujuan="6281234500001", status_kirim="menunggu", waktu_kirim=datetime.now(UTC) - timedelta(minutes=umur_menit))
        db.add(r)
        db.commit()
        return r.id_notifikasi


def test_worker_memulihkan_pesan_yang_menggantung(client, auth, skor, wa, sf):
    ibu, _ = _buat_jadwal_high(client, auth, skor)
    n0 = len(wa.terkirim)
    baru = _riwayat_tertunda(sf, ibu["id_ibu"], umur_menit=1)  # masih wajar, jangan disentuh
    jalankan_jadwal(sf, wa)
    assert len(wa.terkirim) == n0
    lama = _riwayat_tertunda(sf, ibu["id_ibu"], umur_menit=10)  # menggantung
    jalankan_jadwal(sf, wa)
    assert len(wa.terkirim) == n0 + 1
    with sf() as db:
        assert db.get(RiwayatNotifikasi, lama).id_pesan_gateway is not None
        assert db.get(RiwayatNotifikasi, baru).id_pesan_gateway is None
    jalankan_jadwal(sf, wa)
    assert len(wa.terkirim) == n0 + 1  # tidak terkirim dua kali


def test_pesan_tidak_dikirim_bila_persetujuan_dicabut_sebelum_kirim(client, auth, skor, wa, sf):
    from app.models import IbuHamil

    ibu, _ = _buat_jadwal_high(client, auth, skor)
    lama = _riwayat_tertunda(sf, ibu["id_ibu"], umur_menit=10)
    with sf() as db:
        db.get(IbuHamil, ibu["id_ibu"]).persetujuan_wa = False
        db.commit()
    n0 = len(wa.terkirim)
    jalankan_jadwal(sf, wa)
    assert len(wa.terkirim) == n0
    with sf() as db:
        assert db.get(RiwayatNotifikasi, lama).status_kirim == "gagal"


def test_variabel_template_whatsapp_mengikuti_isi_template(client, auth, skor, wa, sf):
    """Jumlah dan urutan variabel harus cocok dengan template terdaftar di Meta: 'istirahat' hanya 2 variabel."""
    ibu, d = _buat_jadwal_high(client, auth, skor)
    jid = d["jadwal"]["id_jadwal"]
    for _ in range(2):  # kontrol lalu istirahat
        _mundurkan(sf, jid)
        jalankan_jadwal(sf, wa)
    per_jenis = {r.jenis_pesan: r.params for r in wa.terkirim}
    assert per_jenis["pembuka"] == ["Siti Rahma", "Siti Aminah", "081234567890"]
    assert per_jenis["kontrol"] == ["Siti Rahma", "Siti Aminah", "081234567890"]
    assert per_jenis["istirahat dan pola hidup"] == ["Siti Rahma", "Siti Aminah"]


# ---------------- log_persetujuan ----------------
def _log(sf, id_ibu):
    from app.models import LogPersetujuan

    with sf() as db:
        rows = db.scalars(select(LogPersetujuan).where(LogPersetujuan.id_ibu == id_ibu).order_by(LogPersetujuan.id_log)).all()
        return [(r.persetujuan_lama, r.persetujuan_baru, r.id_bidan, r.waktu) for r in rows]


def test_log_persetujuan_dicatat_saat_daftar_dan_saat_berubah(client, auth, sf):
    from .conftest import body_ibu

    ibu = buat_ibu(client, auth, persetujuan_wa=True)
    pid = ibu["id_ibu"]
    awal = _log(sf, pid)
    assert [(a, b, c) for a, b, c, _ in awal] == [(None, True, 1)]  # pencatatan awal, lama = NULL
    assert awal[0][3] is not None  # waktu terisi

    # ubah data lain tanpa mengubah persetujuan: tidak ada baris baru
    client.put(f"{P}/ibu-hamil/{pid}", json=body_ibu(alamat="Alamat baru 12"), headers=auth)
    assert len(_log(sf, pid)) == 1
    # cabut, lalu aktifkan kembali: dua baris baru, urut waktu
    client.put(f"{P}/ibu-hamil/{pid}", json=body_ibu(persetujuan_wa=False), headers=auth)
    client.put(f"{P}/ibu-hamil/{pid}", json=body_ibu(persetujuan_wa=True), headers=auth)
    assert [(a, b) for a, b, _, _ in _log(sf, pid)] == [(None, True), (True, False), (False, True)]


def test_log_persetujuan_mencatat_bidan_yang_mengubah_dan_untuk_persetujuan_awal_false(client, auth, sf):
    ibu = buat_ibu(client, auth, persetujuan_wa=False)
    assert [(a, b) for a, b, _, _ in _log(sf, ibu["id_ibu"])] == [(None, False)]


def test_log_persetujuan_tidak_tercatat_bila_perubahan_ditolak(client, auth, sf):
    from .conftest import body_ibu

    ibu = buat_ibu(client, auth, persetujuan_wa=True)
    r = client.put(f"{P}/ibu-hamil/{ibu['id_ibu']}", json=body_ibu(persetujuan_wa=False, no_wa="0812"), headers=auth)
    assert r.status_code == 422
    assert [(a, b) for a, b, _, _ in _log(sf, ibu["id_ibu"])] == [(None, True)]  # tidak ada perubahan yang tercatat
