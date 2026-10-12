"""Perintah pengelola sistem.

    python -m app.cli buat-bidan --nama "Bidan Siti" --email siti@contoh.id --no-hp 081234567890
    python -m app.cli atur-template --jenis kontrol --nama mg_kontrol_v1
    python -m app.cli daftar-template
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from .db import session_factory
from .models import Bidan, TemplatePesan
from .schemas import RegisterIn
from .security import hash_password


def buat_bidan(a) -> int:
    pw = a.password or getpass.getpass("Kata sandi: ")
    data = RegisterIn(nama=a.nama, email=a.email, no_hp=a.no_hp, password=pw)
    with session_factory()() as db:
        if db.scalar(select(Bidan.id_bidan).where(Bidan.email == data.email)):
            print("Email sudah terdaftar.", file=sys.stderr)
            return 1
        b = Bidan(nama=data.nama, email=data.email, no_hp=data.no_hp, password=hash_password(data.password))
        db.add(b)
        db.commit()
        print(f"Bidan dibuat dengan id {b.id_bidan}.")
    return 0


def atur_template(a) -> int:
    with session_factory()() as db:
        t = db.scalar(select(TemplatePesan).where(TemplatePesan.jenis_pesan == a.jenis))
        if not t:
            print("Template tidak ditemukan. Lihat: daftar-template", file=sys.stderr)
            return 1
        t.nama_template = a.nama
        db.commit()
        print(f"Template '{t.jenis_pesan}' memakai nama_template='{a.nama}'.")
    return 0


def daftar_template(_a) -> int:
    with session_factory()() as db:
        for t in db.scalars(select(TemplatePesan).order_by(TemplatePesan.id_template)):
            print(f"{t.id_template:>3}  {t.jenis_pesan:<26} nama_template={t.nama_template or '-'}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="app.cli")
    sub = p.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("buat-bidan")
    b.add_argument("--nama", required=True)
    b.add_argument("--email", required=True)
    b.add_argument("--no-hp", required=True, dest="no_hp")
    b.add_argument("--password")
    b.set_defaults(fn=buat_bidan)
    t = sub.add_parser("atur-template")
    t.add_argument("--jenis", required=True)
    t.add_argument("--nama", required=True)
    t.set_defaults(fn=atur_template)
    sub.add_parser("daftar-template").set_defaults(fn=daftar_template)
    a = p.parse_args()
    return a.fn(a)


if __name__ == "__main__":
    raise SystemExit(main())
