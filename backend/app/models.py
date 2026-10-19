"""Model database mengikuti ERD (Gambar 2) pada dokumen Analisis Arsitektur v2.0.

Atribut tambahan yang disetujui: hasil_lab.id_bidan, jadwal_pesan.hari_kirim,
jadwal_pesan.kirim_berikutnya, riwayat_notifikasi.id_pesan_gateway, serta
template_pesan.nama_template (nama template terdaftar untuk WhatsApp Cloud API).
Atribut turunan (usia, proteinuria_positif) tidak disimpan.
"""

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

TZ_DT = DateTime(timezone=True)


class Bidan(Base):
    __tablename__ = "bidan"
    id_bidan: Mapped[int] = mapped_column(primary_key=True)
    nama: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(100))  # hash bcrypt, bukan kata sandi asli
    no_hp: Mapped[str] = mapped_column(String(20))
    dibuat_pada: Mapped[datetime] = mapped_column(TZ_DT, server_default=func.now())


class IbuHamil(Base):
    __tablename__ = "ibu_hamil"
    id_ibu: Mapped[int] = mapped_column(primary_key=True)
    id_bidan: Mapped[int] = mapped_column(ForeignKey("bidan.id_bidan"), index=True)
    nama: Mapped[str] = mapped_column(String(120))
    no_wa: Mapped[str] = mapped_column(String(20))
    tanggal_lahir: Mapped[date] = mapped_column(Date)
    alamat: Mapped[str] = mapped_column(Text)
    hpht: Mapped[date] = mapped_column(Date)
    riwayat_preeklamsia: Mapped[str] = mapped_column(Text, default="Tidak ada")
    riwayat_lain: Mapped[str] = mapped_column(Text, default="")
    status_risiko: Mapped[str | None] = mapped_column(String(20), nullable=True)
    persetujuan_wa: Mapped[bool] = mapped_column(Boolean, default=False)
    status_persalinan: Mapped[str] = mapped_column(String(20), default="belum lahir")
    tanggal_persalinan: Mapped[date | None] = mapped_column(Date, nullable=True)

    bidan: Mapped[Bidan] = relationship()


class LogPersetujuan(Base):
    """Catatan perubahan persetujuan WhatsApp (Bagian 10: perubahan persetujuan tercatat).
    Hanya bertambah. persetujuan_lama NULL berarti pencatatan awal saat ibu hamil didaftarkan."""

    __tablename__ = "log_persetujuan"
    id_log: Mapped[int] = mapped_column(primary_key=True)
    id_ibu: Mapped[int] = mapped_column(ForeignKey("ibu_hamil.id_ibu"), index=True)
    id_bidan: Mapped[int] = mapped_column(ForeignKey("bidan.id_bidan"))
    persetujuan_lama: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    persetujuan_baru: Mapped[bool] = mapped_column(Boolean)
    waktu: Mapped[datetime] = mapped_column(TZ_DT, server_default=func.now())


class JenisKeluhan(Base):
    __tablename__ = "jenis_keluhan"
    id_jenis_keluhan: Mapped[int] = mapped_column(primary_key=True)
    nama_keluhan: Mapped[str] = mapped_column(String(160), unique=True)
    tanda_bahaya: Mapped[bool] = mapped_column(Boolean, default=False)


class DetailKeluhan(Base):
    """Tabel penghubung M:N pemeriksaan - jenis_keluhan dengan kunci gabungan."""

    __tablename__ = "detail_keluhan"
    id_pemeriksaan: Mapped[int] = mapped_column(ForeignKey("pemeriksaan.id_pemeriksaan"), primary_key=True)
    id_jenis_keluhan: Mapped[int] = mapped_column(ForeignKey("jenis_keluhan.id_jenis_keluhan"), primary_key=True)


class Pemeriksaan(Base):
    __tablename__ = "pemeriksaan"
    id_pemeriksaan: Mapped[int] = mapped_column(primary_key=True)
    id_ibu: Mapped[int] = mapped_column(ForeignKey("ibu_hamil.id_ibu"), index=True)
    id_bidan: Mapped[int] = mapped_column(ForeignKey("bidan.id_bidan"))
    tanggal_pemeriksaan: Mapped[datetime] = mapped_column(TZ_DT, server_default=func.now())
    keluhan_lain: Mapped[str] = mapped_column(Text, default="")
    tanggal_kontrol_berikutnya: Mapped[date | None] = mapped_column(Date, nullable=True)

    vital: Mapped["Vital"] = relationship(back_populates="pemeriksaan", uselist=False, cascade="all, delete-orphan")
    keluhan: Mapped[list[JenisKeluhan]] = relationship(secondary="detail_keluhan", order_by="JenisKeluhan.id_jenis_keluhan")
    skor: Mapped["SkorRisiko | None"] = relationship(back_populates="pemeriksaan", uselist=False)


class Vital(Base):
    """Satuan simpan: suhu dalam °C dan gula darah dalam mg/dL (konversi ke satuan model saat skoring)."""

    __tablename__ = "vital"
    id_vital: Mapped[int] = mapped_column(primary_key=True)
    id_pemeriksaan: Mapped[int] = mapped_column(ForeignKey("pemeriksaan.id_pemeriksaan"), unique=True)
    sistolik: Mapped[int] = mapped_column(Integer)
    diastolik: Mapped[int] = mapped_column(Integer)
    nadi: Mapped[int | None] = mapped_column(Integer, nullable=True)
    suhu: Mapped[float] = mapped_column(Float)
    gula_darah: Mapped[float] = mapped_column(Float)
    berat_badan: Mapped[float] = mapped_column(Float)

    pemeriksaan: Mapped[Pemeriksaan] = relationship(back_populates="vital")


class SkorRisiko(Base):
    __tablename__ = "skor_risiko"
    id_skor: Mapped[int] = mapped_column(primary_key=True)
    id_pemeriksaan: Mapped[int] = mapped_column(ForeignKey("pemeriksaan.id_pemeriksaan"), unique=True)
    kategori: Mapped[str] = mapped_column(String(20))
    tanggal_prediksi: Mapped[datetime] = mapped_column(TZ_DT, server_default=func.now())

    pemeriksaan: Mapped[Pemeriksaan] = relationship(back_populates="skor")


class HasilLab(Base):
    __tablename__ = "hasil_lab"
    id_lab: Mapped[int] = mapped_column(primary_key=True)
    id_ibu: Mapped[int] = mapped_column(ForeignKey("ibu_hamil.id_ibu"), index=True)
    id_bidan: Mapped[int] = mapped_column(ForeignKey("bidan.id_bidan"))
    tanggal_lab: Mapped[date] = mapped_column(Date)
    protein_dipstik: Mapped[str] = mapped_column(String(10))
    protein_24jam: Mapped[float | None] = mapped_column(Float, nullable=True)
    rasio_protein_kreatinin: Mapped[float | None] = mapped_column(Float, nullable=True)
    catatan: Mapped[str] = mapped_column(Text, default="")
    dibuat_pada: Mapped[datetime] = mapped_column(TZ_DT, server_default=func.now())


class TemplatePesan(Base):
    __tablename__ = "template_pesan"
    id_template: Mapped[int] = mapped_column(primary_key=True)
    jenis_pesan: Mapped[str] = mapped_column(String(60), unique=True)
    isi_template: Mapped[str] = mapped_column(Text)
    kategori_risiko: Mapped[str] = mapped_column(String(20), default="high risk")
    nama_template: Mapped[str | None] = mapped_column(String(100), nullable=True)


class JadwalPesan(Base):
    __tablename__ = "jadwal_pesan"
    id_jadwal: Mapped[int] = mapped_column(primary_key=True)
    id_ibu: Mapped[int] = mapped_column(ForeignKey("ibu_hamil.id_ibu"), index=True)
    id_skor: Mapped[int | None] = mapped_column(ForeignKey("skor_risiko.id_skor"), nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="aktif")  # aktif | dijeda | berhenti
    frekuensi: Mapped[str] = mapped_column(String(30), default="2x per minggu")
    hari_kirim: Mapped[str] = mapped_column(String(40))
    jam_kirim: Mapped[str] = mapped_column(String(5))
    tanggal_mulai: Mapped[date] = mapped_column(Date)
    tanggal_berhenti: Mapped[date | None] = mapped_column(Date, nullable=True)
    kirim_berikutnya: Mapped[datetime | None] = mapped_column(TZ_DT, nullable=True, index=True)

    ibu: Mapped[IbuHamil] = relationship()

    __table_args__ = (
        # Satu ibu hanya boleh punya satu jadwal yang belum berhenti (aktif atau dijeda).
        Index(
            "uq_jadwal_belum_berhenti_per_ibu",
            "id_ibu",
            unique=True,
            postgresql_where=(status != "berhenti"),
            sqlite_where=(status != "berhenti"),
        ),
    )


class RiwayatNotifikasi(Base):
    """Hanya bertambah: tiap upaya pengiriman satu baris. Yang boleh berubah hanya
    status_kirim dan id_pesan_gateway (dari hasil kirim dan webhook)."""

    __tablename__ = "riwayat_notifikasi"
    id_notifikasi: Mapped[int] = mapped_column(primary_key=True)
    id_jadwal: Mapped[int] = mapped_column(ForeignKey("jadwal_pesan.id_jadwal"), index=True)
    id_template: Mapped[int] = mapped_column(ForeignKey("template_pesan.id_template"))
    isi_pesan: Mapped[str] = mapped_column(Text)
    waktu_kirim: Mapped[datetime] = mapped_column(TZ_DT, server_default=func.now())
    status_kirim: Mapped[str] = mapped_column(String(10), default="menunggu")
    no_wa_tujuan: Mapped[str] = mapped_column(String(20))
    id_pesan_gateway: Mapped[str | None] = mapped_column(String(120), nullable=True, unique=True)

    jadwal: Mapped[JadwalPesan] = relationship()
    template: Mapped[TemplatePesan] = relationship()
