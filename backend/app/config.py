from functools import lru_cache
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://neurologist:neurologist@localhost:55432/neurologist"
    jwt_secret: str = ""
    access_token_expire_minutes: int = 30
    cors_origins: list[str] = ["http://localhost:3000"]
    allowed_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
    main_manager_email: str = ""
    main_manager_password: str = ""
    main_manager_name: str = "Main manager"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origins", "allowed_hosts", mode="before")
    @classmethod
    def parse_list(cls, value):
        if isinstance(value, str) and not value.lstrip().startswith("["):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.environment.lower() != "production":
            return self
        if len(self.jwt_secret) < 32 or self.jwt_secret.startswith("replace-with"):
            raise ValueError("JWT_SECRET must contain at least 32 characters in production")
        if not self.main_manager_email or len(self.main_manager_password) < 12 or self.main_manager_password.startswith("replace-with"):
            raise ValueError("MAIN_MANAGER_EMAIL and a 12+ character MAIN_MANAGER_PASSWORD are required in production")
        if "localhost" in self.database_url or "127.0.0.1" in self.database_url or "replace-with" in self.database_url:
            raise ValueError("DATABASE_URL must use the Docker database service hostname in production")
        return self

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
