import httpx
import pytest

from app.config import Settings
from app.whatsapp.base import SendRequest, WhatsAppError
from app.whatsapp.fonnte import FonnteWhatsApp


def _wa(handler):
    return FonnteWhatsApp(Settings(fonnte_token="TOKEN-RAHASIA"), httpx.Client(transport=httpx.MockTransport(handler)))


def _req(teks="isi rahasia"):
    return SendRequest(to="6281234500001", jenis_pesan="pembuka", nama_template=None, teks=teks)


def test_fonnte_mengirim_form_dan_mengembalikan_id():
    terlihat = {}

    def handler(request: httpx.Request) -> httpx.Response:
        terlihat["url"], terlihat["auth"], terlihat["body"] = str(request.url), request.headers["Authorization"], request.content.decode()
        return httpx.Response(200, json={"status": True, "id": ["80367170"], "process": "pending"})

    hasil = _wa(handler).send(_req("Halo Bu"))
    assert hasil.message_id == "fonnte.80367170"
    assert terlihat["url"] == "https://api.fonnte.com/send"
    assert terlihat["auth"] == "TOKEN-RAHASIA"
    assert "target=6281234500001" in terlihat["body"] and "countryCode=62" in terlihat["body"]


def test_fonnte_status_false_ditolak_tanpa_membocorkan_data():
    def handler(_r):
        return httpx.Response(200, json={"status": False, "reason": "device disconnected"})

    with pytest.raises(WhatsAppError) as e:
        _wa(handler).send(_req())
    msg = str(e.value)
    assert "device disconnected" in msg and "6281234500001" not in msg and "isi rahasia" not in msg and "TOKEN" not in msg


def test_fonnte_error_http_koneksi_dan_pesan_kosong():
    with pytest.raises(WhatsAppError, match="HTTP 500"):
        _wa(lambda r: httpx.Response(500, json={})).send(_req())

    def putus(_r):
        raise httpx.ConnectError("gagal")

    with pytest.raises(WhatsAppError, match="koneksi"):
        _wa(putus).send(_req())
    with pytest.raises(WhatsAppError, match="kosong"):
        _wa(lambda r: httpx.Response(200, json={"status": True, "id": ["1"]})).send(_req(teks=""))


def test_fonnte_butuh_token():
    with pytest.raises(RuntimeError):
        FonnteWhatsApp(Settings())