"""
Application Configuration settings using pydantic-settings.
Loaded from environment variables or .env file.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    ALLOWED_ORIGINS: str = "*"
    RXNORM_BASE_URL: str = "https://rxnav.nlm.nih.gov/REST"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
