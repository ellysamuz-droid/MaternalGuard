import logging

import httpx

from ..config import Settings
from .base import SendRequest, SendResult, WhatsAppError

log = logging.getLogger("maternalguard.whatsapp.cloud")


class CloudWhatsApp:
    """WhatsApp Cloud API resmi (Meta). Pesan yang dimulai bisnis memakai TEMPLATE yang sudah
    disetujui, sehingga template_pesan.nama_template wajib terisi. Variabel template berurutan:
    {{1}} nama ibu, {{2}} nama bidan, {{3}} nomor HP bidan."""

    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        if not (settings.wa_access_token and settings.wa_phone_number_id):
            raise RuntimeError("WA_ACCESS_TOKEN dan WA_PHONE_NUMBER_ID wajib diisi untuk WHATSAPP_PROVIDER=cloud.")
        self.s = settings
        self.client = client or httpx.Client(timeout=15)
        self.url = f"https://graph.facebook.com/{settings.wa_api_version}/{settings.wa_phone_number_id}/messages"

    def send(self, req: SendRequest) -> SendResult:
        if not req.nama_template:
            raise WhatsAppError(f"template '{req.jenis_pesan}' belum punya nama_template terdaftar di Meta")
        body = {
            "messaging_product": "whatsapp",
            "to": req.to,
            "type": "template",
            "template": {
                "name": req.nama_template,
                "language": {"code": self.s.wa_template_language},
                "components": [
                    {"type": "body", "parameters": [{"type": "text", "text": p} for p in req.params]},
                ],
            },
        }
        try:
            r = self.client.post(self.url, json=body, headers={"Authorization": f"Bearer {self.s.wa_access_token}"})
        except httpx.HTTPError as e:
            raise WhatsAppError(f"koneksi ke WhatsApp gagal ({type(e).__name__})") from e
        if r.status_code >= 400:
            kode = ""
            try:
                kode = str(r.json().get("error", {}).get("code", ""))
            except ValueError:
                pass
            raise WhatsAppError(f"WhatsApp menolak permintaan (HTTP {r.status_code}, kode {kode})")
        try:
            mid = r.json()["messages"][0]["id"]
        except (ValueError, KeyError, IndexError) as e:
            raise WhatsAppError("respons WhatsApp tidak berisi id pesan") from e
        return SendResult(message_id=mid)
