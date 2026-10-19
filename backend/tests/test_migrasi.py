"""Menguji jalur migrasi pada database terpisah: 0001 -> 0002 dengan data yang sudah ada, lalu turun-naik."""

import os
import subprocess
import sys
import uuid

import psycopg
from sqlalchemy.engine import make_url

from app.config import get_settings


def _alembic(url: str, *args: str) -> None:
    env = dict(os.environ, DATABASE_URL=url)
    r = subprocess.run([sys.executable, "-m", "alembic", *args], env=env, capture_output=True, text=True, cwd=os.getcwd())
    assert r.returncode == 0, r.stderr[-800:]


def _psycopg_dsn(u) -> str:
    return u.set(drivername="postgresql").render_as_string(hide_password=False)


def test_migrasi_0002_mengisi_catatan_awal_dan_bisa_turun_naik():
    base = make_url(get_settings().database_url)
    nama = "mig_" + uuid.uuid4().hex[:8]
    with psycopg.connect(_psycopg_dsn(base), autocommit=True) as admin:
        admin.execute(f'CREATE DATABASE "{nama}"')
    try:
        url = base.set(database=nama)
        url_str = url.render_as_string(hide_password=False)
        _alembic(url_str, "upgrade", "0001")
        with psycopg.connect(_psycopg_dsn(url), autocommit=True) as c:
            c.execute("INSERT INTO bidan (nama,email,password,no_hp) VALUES ('B','b@x.id','h','0812')")
            for i, setuju in enumerate((True, False), start=1):
                c.execute(
                    "INSERT INTO ibu_hamil (id_bidan,nama,no_wa,tanggal_lahir,alamat,hpht,riwayat_preeklamsia,riwayat_lain,persetujuan_wa,status_persalinan) "
                    "VALUES (1,%s,'6281234500001','1997-04-12','alamat','2026-06-01','Tidak ada','',%s,'belum lahir')",
                    (f"Ibu {i}", setuju),
                )
        _alembic(url_str, "upgrade", "head")
        with psycopg.connect(_psycopg_dsn(url)) as c:
            rows = c.execute("SELECT id_ibu, persetujuan_lama, persetujuan_baru FROM log_persetujuan ORDER BY id_ibu").fetchall()
            assert rows == [(1, None, True), (2, None, False)]
        _alembic(url_str, "downgrade", "0001")
        with psycopg.connect(_psycopg_dsn(url)) as c:
            assert c.execute("SELECT to_regclass('log_persetujuan')").fetchone()[0] is None
            assert c.execute("SELECT count(*) FROM ibu_hamil").fetchone()[0] == 2  # data ibu aman
        _alembic(url_str, "upgrade", "head")
    finally:
        with psycopg.connect(_psycopg_dsn(base), autocommit=True) as admin:
            admin.execute(f'DROP DATABASE IF EXISTS "{nama}" WITH (FORCE)')
