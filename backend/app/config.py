from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = (
        "postgresql://kavach:kavach@localhost:5432/kavach"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
