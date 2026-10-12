FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Versi Python dikunci 3.13 sesuai kontrak model (scikit-learn 1.6.1, pandas 2.2.3, numpy 2.1.3).
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY models ./models

# Jalankan sebagai pengguna biasa, bukan root.
RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
# Layanan API. Layanan worker memakai perintah lain (lihat railway.worker.toml).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
