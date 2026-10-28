from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/maternalguard"
    jwt_secret: str = "dev-only-ganti-di-produksi"
    jwt_expire_minutes: int = 60
    allowed_origins: str = "http://localhost:3000"
    enable_docs: bool = True
    registration_enabled: bool = True
    login_max_attempts: int = 5
    login_window_minutes: int = 5
    model_path: str = "models/model_final.pkl"

    jadwal_hari: str = "selasa,jumat"
    jadwal_jam: str = "10:00"
    pesan_pertama_min_jeda_hari: int = 2

    protein_dipstik_min: str = "+1"
    protein_24jam_min_g: float = 0.3
    protein_rasio_min: float = 0.3

    whatsapp_provider: str = "fake"
    wa_max_retry: int = 3
    wa_retry_delay_seconds: float = 2
    wa_access_token: str = ""
    wa_phone_number_id: str = ""
    wa_app_secret: str = ""
    wa_verify_token: str = ""
    wa_api_version: str = "v21.0"
    wa_template_language: str = "id"
    fonnte_token: str = ""

    @field_validator("database_url")
    @classmethod
    def _driver(cls, v: str) -> str:
        # Railway memberi postgres:// atau postgresql://; SQLAlchemy butuh driver psycopg (v3).
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            v = "postgresql+psycopg://" + v[len("postgresql://") :]
        return v

    @property
    def origins(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.is_production and (s.jwt_secret.startswith("dev-only") or len(s.jwt_secret) < 32):
        raise RuntimeError("JWT_SECRET wajib diisi (acak, minimal 32 karakter) saat ENVIRONMENT=production.")
    if s.is_production and s.whatsapp_provider == "cloud" and not s.wa_app_secret:
        raise RuntimeError("WA_APP_SECRET wajib diisi untuk memverifikasi webhook saat memakai WhatsApp Cloud API.")
    return s
