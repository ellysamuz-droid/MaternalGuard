import logging

import httpx

from ..config import Settings
from .base import SendRequest, SendResult, WhatsAppError

log = logging.getLogger("maternalguard.whatsapp.fonnte")


class FonnteWhatsApp:
    """Adapter Fonnte (gateway WhatsApp). Mengirim teks biasa (req.teks), tanpa template Meta.

    Fonnte tidak punya webhook berformat Meta, jadi pesan yang sudah diterima API Fonnte langsung
    ditandai 'terkirim' (lihat status_setelah_kirim). Status 'diterima' butuh webhook Fonnte.
    """

    URL = "https://api.fonnte.com/send"
    status_setelah_kirim = "terkirim"

    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        if not settings.fonnte_token:
            raise RuntimeError("FONNTE_TOKEN wajib diisi untuk WHATSAPP_PROVIDER=fonnte.")
        self.token = settings.fonnte_token
        self.client = client or httpx.Client(timeout=15)

    def send(self, req: SendRequest) -> SendResult:
        if not req.teks:
            raise WhatsAppError("isi pesan kosong")
        data = {"target": req.to, "message": req.teks, "countryCode": "62"}
        try:
            r = self.client.post(self.URL, data=data, headers={"Authorization": self.token})
        except httpx.HTTPError as e:
            raise WhatsAppError(f"koneksi ke Fonnte gagal ({type(e).__name__})") from e
        if r.status_code >= 400:
            raise WhatsAppError(f"Fonnte menolak permintaan (HTTP {r.status_code})")
        try:
            body = r.json()
        except ValueError as e:
            raise WhatsAppError("respons Fonnte bukan JSON") from e
        if not isinstance(body, dict) or not body.get("status"):
            alasan = str(body.get("reason", "")) if isinstance(body, dict) else ""
            raise WhatsAppError(f"Fonnte menolak pengiriman ({alasan[:60] or 'tanpa alasan'})")
        ids = body.get("id")
        mid = ids[0] if isinstance(ids, list) and ids else ids
        if not mid:
            raise WhatsAppError("respons Fonnte tidak berisi id pesan")
        return SendResult(message_id=f"fonnte.{mid}")