"""Data awal (idempoten, hanya menambah yang belum ada):  python -m app.seed

Isi template adalah CONTOH. Template wajib ditinjau bidan atau tenaga medis (keputusan terbuka nomor 4),
dan untuk WhatsApp Cloud API harus didaftarkan serta disetujui Meta (isi kolom nama_template)."""

from sqlalchemy import select

from .db import session_factory
from .models import JenisKeluhan, TemplatePesan

PENUTUP = " Jika tidak ingin menerima pesan ini, beri tahu Bidan {bidan}."

KELUHAN = [
    ("Sakit kepala yang tidak hilang", True),
    ("Pandangan kabur", True),
    ("Nyeri ulu hati", True),
    ("Bengkak mendadak (wajah atau tangan)", True),
    ("Gerakan bayi berkurang", True),
    ("Sesak napas", True),
    ("Mual muntah berlebihan", False),
    ("Kaki bengkak ringan", False),
    ("Pusing ringan", False),
]

TEMPLATE = [
    ("pembuka", "Halo Bu {nama}, ini pesan dari Bidan {bidan}. Mohon Ibu datang ke tempat saya dalam waktu dekat untuk pemeriksaan kehamilan ya, Bu. Jika ada pertanyaan, hubungi saya di {no_hp_bidan}." + PENUTUP),
    ("kontrol", "Halo Bu {nama}, ini pesan dari Bidan {bidan}. Mohon tetap datang kontrol sesuai jadwal ya, Bu. Jika ada pertanyaan, hubungi saya di {no_hp_bidan}." + PENUTUP),
    ("istirahat dan pola hidup", "Halo Bu {nama}. Usahakan istirahat cukup, tidur miring ke kiri, makan teratur, dan minum air putih yang cukup. Jika tidak ada keluhan, lanjutkan aktivitas seperti biasa. Salam, Bidan {bidan}." + PENUTUP),
    ("kenali tanda", "Halo Bu {nama}. Jika Ibu merasakan sakit kepala yang tidak hilang, pandangan kabur, nyeri ulu hati, bengkak mendadak, atau gerakan bayi berkurang, segera hubungi Bidan {bidan} di {no_hp_bidan} atau datang ke fasilitas kesehatan. Jika tidak ada keluhan seperti itu, tidak perlu khawatir." + PENUTUP),
    ("tanya kabar", "Halo Bu {nama}, semoga Ibu dan si kecil sehat hari ini. Jika ada yang ingin ditanyakan, silakan hubungi Bidan {bidan} di {no_hp_bidan}." + PENUTUP),
]


def jalankan() -> tuple[int, int]:
    baru_k = baru_t = 0
    with session_factory()() as db:
        ada_k = set(db.scalars(select(JenisKeluhan.nama_keluhan)))
        for nama, bahaya in KELUHAN:
            if nama not in ada_k:
                db.add(JenisKeluhan(nama_keluhan=nama, tanda_bahaya=bahaya))
                baru_k += 1
        ada_t = set(db.scalars(select(TemplatePesan.jenis_pesan)))
        for jenis, isi in TEMPLATE:  # urutan tema bergilir mengikuti id (kontrol, istirahat, tanda, kabar)
            if jenis not in ada_t:
                db.add(TemplatePesan(jenis_pesan=jenis, isi_template=isi, kategori_risiko="high risk"))
                baru_t += 1
        db.commit()
    return baru_k, baru_t


if __name__ == "__main__":
    k, t = jalankan()
    print(f"Seed selesai: {k} jenis keluhan dan {t} template baru.")
