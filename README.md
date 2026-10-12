# MaternalGuard

Sistem pencatatan pemeriksaan ibu hamil untuk bidan: kategori risiko preeklamsia otomatis dan pesan WhatsApp
untuk ibu berisiko tinggi. Kategori risiko adalah **peringatan dini, bukan diagnosis**.

| Folder | Isi | Teknologi |
|---|---|---|
| [`frontend/`](frontend/README.md) | Web bidan dan landing page | Next.js 14, Bootstrap |
| [`backend/`](backend/README.md) | API, skoring model, worker jadwal pesan | FastAPI, PostgreSQL, APScheduler |
| [`docs/`](docs/) | Panduan deploy, catatan backend, dokumen arsitektur dan diagram | |

## Jalankan keduanya di komputer sendiri

Terminal 1, backend (butuh PostgreSQL dan Python 3.13; detail di `backend/README.md`):
```bash
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && cp .env.example .env     # isi DATABASE_URL dan JWT_SECRET
alembic upgrade head && python -m app.seed
uvicorn app.main:app --port 8000
```
Terminal 2, worker pesan terjadwal: `cd backend && python -m app.worker`

Terminal 3, front end:
```bash
cd frontend && npm install
echo "API_MODE=live" > .env.local && echo "API_BASE_URL=http://127.0.0.1:8000" >> .env.local
npm run dev        # http://localhost:3000
```
Tanpa backend, front end tetap bisa dicoba dengan data tiruan: hapus `.env.local` (mode `mock`).

## Deploy
Backend di Railway, front end di Vercel: lihat [`docs/PANDUAN_DEPLOY.md`](docs/PANDUAN_DEPLOY.md).
