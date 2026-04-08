from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "NotebrainAI"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5434/notebrainai"

    # Redis
    redis_url: str = "redis://localhost:6380/0"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "notebrainai_chunks"

    # Auth
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    cors_origins: list[str] = ["http://localhost:3002"]

    # AI APIs
    anthropic_api_key: str = ""
    cohere_api_key: str = ""
    deepseek_api_key: str = ""
    tavily_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # TTS
    fish_audio_api_key: str = ""
    elevenlabs_api_key: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
