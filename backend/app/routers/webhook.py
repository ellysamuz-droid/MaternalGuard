import hashlib
import hmac
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_db
from ..services.notifikasi import STATUS_WEBHOOK, terapkan_status

log = logging.getLogger("maternalguard.webhook")
router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.get("/whatsapp")
def verifikasi(
    mode: str | None = Query(default=None, alias="hub.mode"),
    token: str | None = Query(default=None, alias="hub.verify_token"),
    challenge: str | None = Query(default=None, alias="hub.challenge"),
):
    """Verifikasi langganan webhook oleh Meta."""
    s = get_settings()
    if mode == "subscribe" and s.wa_verify_token and hmac.compare_digest(token or "", s.wa_verify_token):
        return Response(content=challenge or "", media_type="text/plain")
    raise HTTPException(403, "Verifikasi webhook ditolak.")


@router.post("/whatsapp")
async def terima_status(request: Request, db: Session = Depends(get_db)):
    """FR-09: status pengiriman dari WhatsApp. Diverifikasi dengan tanda tangan HMAC (X-Hub-Signature-256)."""
    s = get_settings()
    raw = await request.body()
    if s.wa_app_secret:
        ttd = request.headers.get("X-Hub-Signature-256", "")
        harapan = "sha256=" + hmac.new(s.wa_app_secret.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(ttd, harapan):
            raise HTTPException(403, "Tanda tangan webhook tidak valid.")
    elif s.is_production:
        # Di produksi tanpa secret, webhook tidak boleh menerima apa pun.
        raise HTTPException(403, "WA_APP_SECRET belum diatur.")

    try:
        payload = json.loads(raw or b"{}")
    except ValueError:
        raise HTTPException(400, "Payload bukan JSON.") from None

    berubah = 0
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            for st in change.get("value", {}).get("statuses", []):
                baru = STATUS_WEBHOOK.get(str(st.get("status", "")).lower())
                mid = st.get("id")
                if baru and mid and terapkan_status(db, str(mid), baru):
                    berubah += 1
    db.commit()
    log.info("Webhook diproses, %s status diperbarui", berubah)
    return {"diperbarui": berubah}
