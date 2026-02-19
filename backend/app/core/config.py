from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Time Table Generator Tool"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_THIS_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GROQ_API_KEY: str = "YOUR_GROQ_API_KEY"
    HF_API_KEY: str = "YOUR_HF_API_KEY"
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "timetable_db"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
