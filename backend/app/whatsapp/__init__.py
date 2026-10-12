from ..config import get_settings
from .base import SendRequest, SendResult, WhatsAppError, WhatsAppProvider

__all__ = ["SendRequest", "SendResult", "WhatsAppError", "WhatsAppProvider", "get_provider", "set_provider"]

_provider: WhatsAppProvider | None = None


def get_provider() -> WhatsAppProvider:
    global _provider
    if _provider is None:
        s = get_settings()
        if s.whatsapp_provider == "cloud":
            from .cloud import CloudWhatsApp

            _provider = CloudWhatsApp(s)
        else:
            from ..services.notifikasi import terapkan_status_sesi
            from .fake import FakeWhatsApp

            _provider = FakeWhatsApp(on_status=terapkan_status_sesi)
    return _provider


def set_provider(p: WhatsAppProvider | None) -> None:
    """Dipakai pengujian untuk mengganti provider."""
    global _provider
    _provider = p
