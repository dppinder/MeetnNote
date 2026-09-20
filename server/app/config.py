from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    auth_token: str = "change-me-to-a-long-random-string"

    db_path: str = "./data/meetings.db"

    whisper_model: str = "medium"
    whisper_device: str = "cuda"
    whisper_compute_type: str = "int8_float16"

    ollama_host: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_fallback_model: str = "mistral:7b-instruct"

    host: str = "0.0.0.0"
    port: int = 8000

    # Built client (`npm run build` in client/, then copy dist/ here) served
    # directly by this server so a phone can just browse to the server's URL.
    # Left alone (missing directory) if you only ever use the Tauri desktop app.
    static_dir: str = "./client-dist"


settings = Settings()
