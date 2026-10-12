"""Modul skoring risiko (Bagian 6.2). Memuat model_final.pkl dan menjaga kontrak input.

Satuan model: Age tahun, SystolicBP/DiastolicBP mmHg, BS mmol/L, BodyTemp FAHRENHEIT, HeartRate x/menit.
Satuan yang salah menghasilkan prediksi salah TANPA pesan error, jadi konversi dilakukan di sini.
"""

import logging
import math
from dataclasses import dataclass
from pathlib import Path

import joblib
import pandas as pd

log = logging.getLogger("maternalguard.scoring")

KOLOM = ["Age", "SystolicBP", "DiastolicBP", "BS", "BodyTemp", "HeartRate", "map", "pulse_pressure", "kelompok_usia"]
MGDL_PER_MMOLL = 18.0156


def kelompok_usia(usia: float) -> str:
    if usia <= 19:
        return "remaja"
    if usia <= 25:
        return "dewasa_muda"
    if usia <= 35:
        return "dewasa"
    if usia <= 45:
        return "paruh_baya"
    return "lansia"


@dataclass
class HasilSkor:
    kategori: str
    peluang: dict[str, float]


class Scorer:
    def __init__(self, paket: dict):
        self._model = paket["model"]
        self._kelas = list(paket["kelas"])

    @classmethod
    def load(cls, path: str) -> "Scorer":
        # PERINGATAN: berkas .pkl dapat mengeksekusi kode saat dimuat. Hanya muat dari server tepercaya.
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Berkas model tidak ditemukan: {p}")
        paket = joblib.load(p)
        for k in ("model", "kelas"):
            if k not in paket:
                raise ValueError(f"Berkas model tidak memiliki kunci '{k}'.")
        log.info("Model dimuat: %s (kelas=%s)", p.name, paket["kelas"])
        return cls(paket)

    def prediksi(
        self,
        usia: int,
        sistolik: float,
        diastolik: float,
        gula_mgdl: float,
        suhu_c: float,
        nadi: float | None,
    ) -> HasilSkor:
        data = {
            "Age": float(usia),
            "SystolicBP": float(sistolik),
            "DiastolicBP": float(diastolik),
            "BS": gula_mgdl / MGDL_PER_MMOLL,  # mg/dL -> mmol/L
            "BodyTemp": suhu_c * 9 / 5 + 32,  # Celsius -> Fahrenheit
            "HeartRate": float(nadi) if nadi is not None else math.nan,  # kosong diisi median oleh pipeline
            "map": (sistolik + 2 * diastolik) / 3,
            "pulse_pressure": sistolik - diastolik,
            "kelompok_usia": kelompok_usia(usia),
        }
        x = pd.DataFrame([data])[KOLOM]
        kategori = str(self._model.predict(x)[0])
        proba = self._model.predict_proba(x)[0]
        peluang = {str(k): round(float(p), 3) for k, p in zip(self._model.classes_, proba)}
        return HasilSkor(kategori=kategori, peluang=peluang)


_scorer: Scorer | None = None


def get_scorer() -> Scorer:
    """Dependency FastAPI. Dimuat sekali (lihat lifespan di main.py)."""
    global _scorer
    if _scorer is None:
        from ..config import get_settings

        _scorer = Scorer.load(get_settings().model_path)
    return _scorer
