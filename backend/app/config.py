from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://neurologist:neurologist@localhost:55432/neurologist"
    jwt_secret: str = "development-only-change-this-secret"
    access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:3000"]
    main_manager_email: str = "drmehrdadbakhtiari@gmail.com"
    main_manager_password: str = "Dr@Mehrdad@Bakhtiari@1352"
    main_manager_name: str = "دکتر مهرداد بختیاری"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_origins(cls, value):
        return value.split(",") if isinstance(value, str) else value

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
