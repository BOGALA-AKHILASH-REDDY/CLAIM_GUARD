import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "CLAIMGUARD"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "claimguard-secret-super-key-healthcare-hackathon-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./claimguard.db"
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
    DATA_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    REPORTS_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "reports"))
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "jpg", "jpeg", "png"]
    
    # Configurable Business Rules (Defaults)
    DEFAULT_SURRENDER_REFUND_PERCENTAGE: float = 70.0
    DEFAULT_SURRENDER_PENALTY_PERCENTAGE: float = 30.0
    DEFAULT_INITIAL_WAITING_PERIOD_DAYS: int = 30
    DEFAULT_PRE_EXISTING_WAITING_PERIOD_MONTHS: int = 36
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
