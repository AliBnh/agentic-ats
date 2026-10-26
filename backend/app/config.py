import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv, find_dotenv

# Search and load nearest .env
load_dotenv(find_dotenv(), override=False)

class Settings(BaseSettings):
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://ats_user:ats_password@postgres:5432/agentic_ats")
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "qdrant")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_agentic_ats_prod_2026_secure")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    MODEL_PROVIDER: str = os.getenv("MODEL_PROVIDER", "groq")
    MODEL_NAME: str = os.getenv("MODEL_NAME", "openai/gpt-oss-120b")
    PARSER_MODEL_NAME: str = os.getenv("PARSER_MODEL_NAME", "qwen/qwen3.8-27b")
    MODEL_TEMPERATURE: float = float(os.getenv("MODEL_TEMPERATURE", "0.0"))

    # LangSmith Observability & Tracing
    LANGSMITH_TRACING: str = os.getenv(
        "LANGSMITH_TRACING",
        os.getenv(
            "LANGSMITH_TRACING_V2",
            os.getenv("LANGCHAIN_TRACING_V2", "false"),
        ),
    )
    LANGSMITH_ENDPOINT: str = os.getenv(
        "LANGSMITH_ENDPOINT",
        os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com"),
    )
    LANGSMITH_API_KEY: str = os.getenv(
        "LANGSMITH_API_KEY",
        os.getenv("LANGCHAIN_API_KEY", ""),
    )
    LANGSMITH_PROJECT: str = os.getenv(
        "LANGSMITH_PROJECT",
        os.getenv("LANGCHAIN_PROJECT", "agentic-ats"),
    )

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
