from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Time Table Generator AI Microservice"
    API_V1_STR: str = "/api/v1"
    HF_API_KEY: str = "YOUR_HF_API_KEY"
    GEMINI_API_KEY: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
