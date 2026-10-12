"""Skema request/response. Nama field mengikuti ERD dan kontrak yang dipakai front end."""

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator

from .config import get_settings

KategoriRisiko = Literal["low risk", "mid risk", "high risk"]
RE_WA = re.compile(r"^62\d{8,13}$")
RE_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth ----------
class LoginIn(BaseModel):
    email: str
    password: str


class BidanRingkas(BaseModel):
    id_bidan: int
    nama: str


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    bidan: BidanRingkas


class RegisterIn(BaseModel):
    nama: str = Field(min_length=3, max_length=120)
    email: str = Field(max_length=160)
    no_hp: str
    password: str = Field(min_length=8)

    @field_validator("nama")
    @classmethod
    def _nama(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Nama minimal 3 karakter.")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if not RE_EMAIL.match(v):
            raise ValueError("Format email tidak valid.")
        return v

    @field_validator("no_hp")
    @classmethod
    def _hp(cls, v: str) -> str:
        d = re.sub(r"\D", "", v)
        if not re.match(r"^(62|0)8\d{8,12}$", d):
            raise ValueError("Nomor HP tidak valid.")
        return d

    @field_validator("password")
    @classmethod
    def _pw(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Kata sandi maksimal 72 byte.")
        if not (re.search(r"[A-Za-z]", v) and re.search(r"\d", v)):
            raise ValueError("Gunakan kombinasi huruf dan angka.")
        return v


class BidanOut(ORM):
    id_bidan: int
    nama: str
    email: str
    no_hp: str


# ---------- Ibu hamil ----------
from .utils import hitung_usia as _hitung_usia


class IbuIn(BaseModel):
    nama: str = Field(min_length=3, max_length=120)
    no_wa: str
    tanggal_lahir: date
    alamat: str = Field(min_length=3)
    hpht: date
    riwayat_preeklamsia: str = Field(default="Tidak ada", max_length=300)
    riwayat_lain: str = Field(default="", max_length=500)
    persetujuan_wa: bool = False

    @field_validator("nama", "alamat")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @field_validator("no_wa")
    @classmethod
    def _wa(cls, v: str) -> str:
        if not RE_WA.match(v):
            raise ValueError("Nomor WhatsApp harus berformat 62xxxxxxxxxx.")
        return v

    @field_validator("tanggal_lahir")
    @classmethod
    def _lahir(cls, v: date) -> date:
        usia = _hitung_usia(v, date.today())
        if usia < 12 or usia > 55:
            raise ValueError("Usia harus antara 12 dan 55 tahun.")
        return v

    @field_validator("hpht")
    @classmethod
    def _hpht(cls, v: date) -> date:
        hari = (date.today() - v).days
        if hari < 0:
            raise ValueError("HPHT tidak boleh di masa depan.")
        if hari > 300:
            raise ValueError("HPHT lebih dari 300 hari lalu, periksa kembali.")
        return v


class IbuOut(ORM):
    id_ibu: int
    id_bidan: int
    nama: str
    no_wa: str
    tanggal_lahir: date
    alamat: str
    hpht: date
    riwayat_preeklamsia: str
    riwayat_lain: str
    status_risiko: KategoriRisiko | None
    persetujuan_wa: bool
    status_persalinan: Literal["belum lahir", "sudah lahir"]
    tanggal_persalinan: date | None


class StatusPersalinanIn(BaseModel):
    status_persalinan: Literal["belum lahir", "sudah lahir"]
    tanggal_persalinan: date | None = None

    @field_validator("tanggal_persalinan")
    @classmethod
    def _tgl(cls, v: date | None) -> date | None:
        if v and v > date.today():
            raise ValueError("Tanggal persalinan tidak boleh di masa depan.")
        return v


# ---------- Pemeriksaan ----------
def suhu_ke_celsius(nilai: float, satuan: str) -> float:
    return round((nilai - 32) * 5 / 9, 1) if satuan == "F" else nilai


def gula_ke_mgdl(nilai: float, satuan: str) -> float:
    return round(nilai * 18.0156, 1) if satuan == "mmol/L" else nilai


class VitalIn(BaseModel):
    sistolik: int = Field(ge=60, le=260)
    diastolik: int = Field(ge=30, le=180)
    nadi: int | None = Field(default=None, ge=30, le=220)
    suhu_satuan: Literal["C", "F"] = "C"
    suhu: float
    gula_darah_satuan: Literal["mg/dL", "mmol/L"] = "mg/dL"
    gula_darah: float
    berat_badan: float = Field(ge=30, le=200)

    @field_validator("diastolik")
    @classmethod
    def _dia(cls, v: int, info: ValidationInfo) -> int:
        sis = info.data.get("sistolik")
        if sis is not None and v >= sis:
            raise ValueError("Diastolik harus lebih kecil dari sistolik.")
        return v

    @field_validator("suhu")
    @classmethod
    def _suhu(cls, v: float, info: ValidationInfo) -> float:
        c = suhu_ke_celsius(v, info.data.get("suhu_satuan", "C"))
        if not 33 <= c <= 43:
            raise ValueError("Suhu di luar rentang wajar (33-43 °C).")
        return v

    @field_validator("gula_darah")
    @classmethod
    def _gd(cls, v: float, info: ValidationInfo) -> float:
        mg = gula_ke_mgdl(v, info.data.get("gula_darah_satuan", "mg/dL"))
        if not 20 <= mg <= 600:
            raise ValueError("Gula darah di luar rentang wajar (20-600 mg/dL).")
        return v

    @property
    def suhu_c(self) -> float:
        return suhu_ke_celsius(self.suhu, self.suhu_satuan)

    @property
    def gula_mgdl(self) -> float:
        return gula_ke_mgdl(self.gula_darah, self.gula_darah_satuan)


class PemeriksaanIn(BaseModel):
    vital: VitalIn
    id_jenis_keluhan: list[int] = Field(default_factory=list)
    keluhan_lain: str = Field(default="", max_length=500)
    tanggal_kontrol_berikutnya: date | None = None

    @field_validator("tanggal_kontrol_berikutnya")
    @classmethod
    def _kontrol(cls, v: date | None) -> date | None:
        if v and v < date.today():
            raise ValueError("Tanggal kontrol tidak boleh sebelum hari ini.")
        return v


class JenisKeluhanOut(ORM):
    id_jenis_keluhan: int
    nama_keluhan: str
    tanda_bahaya: bool


class VitalOut(ORM):
    id_vital: int
    sistolik: int
    diastolik: int
    nadi: int | None
    suhu: float
    gula_darah: float
    berat_badan: float


class SkorOut(ORM):
    id_skor: int
    id_pemeriksaan: int
    kategori: KategoriRisiko
    tanggal_prediksi: datetime


class PemeriksaanOut(ORM):
    id_pemeriksaan: int
    id_ibu: int
    id_bidan: int
    tanggal_pemeriksaan: datetime
    keluhan_lain: str
    tanggal_kontrol_berikutnya: date | None
    vital: VitalOut
    keluhan: list[JenisKeluhanOut]
    skor: SkorOut | None


# ---------- Hasil lab ----------
class HasilLabIn(BaseModel):
    tanggal_lab: date
    protein_dipstik: Literal["negatif", "trace", "+1", "+2", "+3", "+4"]
    protein_24jam: float | None = Field(default=None, ge=0, le=50)
    rasio_protein_kreatinin: float | None = Field(default=None, ge=0, le=50)
    catatan: str = Field(default="", max_length=500)

    @field_validator("tanggal_lab")
    @classmethod
    def _tgl(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Tanggal lab tidak boleh di masa depan.")
        return v


class HasilLabOut(BaseModel):
    id_lab: int
    id_ibu: int
    id_bidan: int
    tanggal_lab: date
    protein_dipstik: str
    protein_24jam: float | None
    rasio_protein_kreatinin: float | None
    catatan: str
    proteinuria_positif: bool  # atribut turunan, dihitung saat dibaca


# ---------- Jadwal & notifikasi ----------
class JadwalOut(ORM):
    id_jadwal: int
    id_ibu: int
    id_skor: int | None
    status: Literal["aktif", "dijeda", "berhenti"]
    frekuensi: str
    hari_kirim: str
    jam_kirim: str
    tanggal_mulai: date
    tanggal_berhenti: date | None
    kirim_berikutnya: datetime | None


class JadwalPatch(BaseModel):
    status: Literal["aktif", "dijeda"]


class NotifikasiOut(ORM):
    id_notifikasi: int
    id_jadwal: int
    id_template: int
    isi_pesan: str
    waktu_kirim: datetime
    status_kirim: Literal["menunggu", "terkirim", "diterima", "gagal"]
    no_wa_tujuan: str
    id_pesan_gateway: str | None


class PesanWhatsappOut(BaseModel):
    dikirim: bool
    alasan: str | None = None


class HasilPencatatanOut(BaseModel):
    pemeriksaan: PemeriksaanOut
    pesan_whatsapp: PesanWhatsappOut
    jadwal: JadwalOut | None = None


def proteinuria_positif(dipstik: str, p24: float | None, rasio: float | None) -> bool:
    """Atribut turunan hasil_lab.proteinuria_positif; ambang dapat dikonfigurasi (Bagian 6.3 butir 8).
    Nilai default HARUS dikonfirmasi tenaga medis."""
    s = get_settings()
    urutan = ["negatif", "trace", "+1", "+2", "+3", "+4"]
    min_rank = urutan.index(s.protein_dipstik_min) if s.protein_dipstik_min in urutan else 2
    return (
        urutan.index(dipstik) >= min_rank
        or (p24 is not None and p24 >= s.protein_24jam_min_g)
        or (rasio is not None and rasio >= s.protein_rasio_min)
    )
