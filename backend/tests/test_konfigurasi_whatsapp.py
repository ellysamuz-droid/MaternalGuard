import json

import httpx
import pytest

from app.config import Settings, get_settings
from app.whatsapp.base import SendRequest, WhatsAppError
from app.whatsapp.cloud import CloudWhatsApp


def _settings(**kw):
    return Settings(wa_access_token="TOKEN-RAHASIA", wa_phone_number_id="1234567890", wa_api_version="v21.0", wa_template_language="id", **kw)


def _req(nama_template="mg_kontrol_v1"):
    return SendRequest(to="6281234500001", jenis_pesan="kontrol", nama_template=nama_template, params=["Siti Rahma", "Siti Aminah", "081234567890"], teks="isi rahasia")


def test_cloud_mengirim_template_dengan_variabel_berurutan():
    terlihat = {}

    def handler(request: httpx.Request) -> httpx.Response:
        terlihat["url"], terlihat["auth"], terlihat["body"] = str(request.url), request.headers["Authorization"], json.loads(request.content)
        return httpx.Response(200, json={"messages": [{"id": "wamid.ABC123"}]})

    wa = CloudWhatsApp(_settings(), httpx.Client(transport=httpx.MockTransport(handler)))
    hasil = wa.send(_req())
    assert hasil.message_id == "wamid.ABC123"
    assert terlihat["url"] == "https://graph.facebook.com/v21.0/1234567890/messages"
    assert terlihat["auth"] == "Bearer TOKEN-RAHASIA"
    b = terlihat["body"]
    assert b["to"] == "6281234500001" and b["type"] == "template" and b["template"]["name"] == "mg_kontrol_v1"
    assert b["template"]["language"]["code"] == "id"
    assert [p["text"] for p in b["template"]["components"][0]["parameters"]] == ["Siti Rahma", "Siti Aminah", "081234567890"]


def test_cloud_error_tidak_membocorkan_isi_atau_nomor():
    def handler(_r):
        return httpx.Response(400, json={"error": {"code": 131030, "message": "Recipient 6281234500001 not in allowed list"}})

    wa = CloudWhatsApp(_settings(), httpx.Client(transport=httpx.MockTransport(handler)))
    with pytest.raises(WhatsAppError) as e:
        wa.send(_req())
    msg = str(e.value)
    assert "131030" in msg and "6281234500001" not in msg and "isi rahasia" not in msg and "TOKEN" not in msg


def test_cloud_tanpa_nama_template_ditolak_dan_koneksi_putus():
    wa = CloudWhatsApp(_settings(), httpx.Client(transport=httpx.MockTransport(lambda r: httpx.Response(200, json={}))))
    with pytest.raises(WhatsAppError, match="nama_template"):
        wa.send(_req(nama_template=None))

    def putus(_r):
        raise httpx.ConnectError("gagal")

    with pytest.raises(WhatsAppError, match="koneksi"):
        CloudWhatsApp(_settings(), httpx.Client(transport=httpx.MockTransport(putus))).send(_req())


def test_cloud_butuh_kredensial():
    with pytest.raises(RuntimeError):
        CloudWhatsApp(Settings())


def test_produksi_menolak_konfigurasi_tidak_aman(monkeypatch):
    get_settings.cache_clear()
    try:
        monkeypatch.setenv("ENVIRONMENT", "production")
        monkeypatch.setenv("JWT_SECRET", "pendek")
        with pytest.raises(RuntimeError, match="JWT_SECRET"):
            get_settings()
        get_settings.cache_clear()
        monkeypatch.setenv("JWT_SECRET", "x" * 40)
        monkeypatch.setenv("WHATSAPP_PROVIDER", "cloud")
        monkeypatch.setenv("WA_APP_SECRET", "")
        with pytest.raises(RuntimeError, match="WA_APP_SECRET"):
            get_settings()
    finally:
        get_settings.cache_clear()


def test_database_url_dinormalisasi_untuk_driver_psycopg():
    assert Settings(database_url="postgres://u:p@h:5432/d").database_url == "postgresql+psycopg://u:p@h:5432/d"
    assert Settings(database_url="postgresql://u:p@h/d").database_url == "postgresql+psycopg://u:p@h/d"
