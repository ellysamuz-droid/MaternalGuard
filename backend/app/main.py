import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, health, hasil_lab, ibu_hamil, notifikasi, pemeriksaan, webhook
from .services.scoring import get_scorer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("maternalguard")


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_settings()  # gagal cepat bila konfigurasi produksi tidak aman
    get_scorer()  # muat model sekali ke memori; gagal cepat bila berkas model hilang
    log.info("MaternalGuard API siap")
    yield


def create_app() -> FastAPI:
    s = get_settings()
    app = FastAPI(
        title="MaternalGuard API",
        version="2.0.0",
        description="Backend pencatatan pemeriksaan ibu hamil, skoring risiko preeklamsia, dan notifikasi WhatsApp.",
        lifespan=lifespan,
        docs_url="/docs" if s.enable_docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if s.enable_docs else None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.origins,
        allow_methods=["GET", "POST", "PUT", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    for r in (auth, ibu_hamil, pemeriksaan, hasil_lab, notifikasi, webhook, health):
        app.include_router(r.router, prefix="/api/v1")

    @app.get("/", include_in_schema=False)
    def root():
        return {"nama": "MaternalGuard API", "versi": "2.0.0", "health": "/api/v1/health"}

    return app


app = create_app()
