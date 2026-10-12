from dataclasses import dataclass, field
from typing import Protocol


class WhatsAppError(Exception):
    """Pengiriman gagal. Pesan error TIDAK boleh memuat isi pesan atau data medis."""


@dataclass
class SendRequest:
    to: str  # format 62xxxxxxxxxx
    jenis_pesan: str
    nama_template: str | None  # nama template terdaftar (WhatsApp Cloud API)
    params: list[str] = field(default_factory=list)  # urutan: nama ibu, nama bidan, no_hp bidan
    teks: str = ""  # isi yang sudah dirender (dipakai provider fake/log)


@dataclass
class SendResult:
    message_id: str


class WhatsAppProvider(Protocol):
    """Adapter pengirim pesan. Penyedia dapat diganti tanpa mengubah logika bisnis (Bagian 5)."""

    def send(self, req: SendRequest) -> SendResult: ...
