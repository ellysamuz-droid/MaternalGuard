import logging
import threading
import uuid
from collections.abc import Callable

from .base import SendRequest, SendResult

log = logging.getLogger("maternalguard.whatsapp.fake")


class FakeWhatsApp:
    """Provider untuk pengembangan dan demo: tidak mengirim apa pun ke luar.

    Bila simulate=True, meniru webhook dengan memanggil on_status('terkirim') lalu
    on_status('diterima') beberapa detik kemudian pada thread terpisah.
    """

    def __init__(
        self,
        on_status: Callable[[str, str], None] | None = None,
        simulate: bool = True,
        delays: tuple[float, float] = (2.0, 5.0),
    ):
        self.on_status = on_status
        self.simulate = simulate
        self.delays = delays
        self.terkirim: list[SendRequest] = []  # dipakai pengujian

    def send(self, req: SendRequest) -> SendResult:
        mid = f"fake.{uuid.uuid4().hex[:20]}"
        self.terkirim.append(req)
        # Tidak mencatat nomor maupun isi pesan (data pribadi/kesehatan).
        log.info("[FAKE] pesan %s ke ibu hamil (jenis=%s) dianggap terkirim", mid, req.jenis_pesan)
        if self.simulate and self.on_status:
            for status, delay in (("terkirim", self.delays[0]), ("diterima", self.delays[1])):
                t = threading.Timer(delay, self.on_status, args=(mid, status))
                t.daemon = True
                t.start()
        return SendResult(message_id=mid)
