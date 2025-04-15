from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str = ""
    
    # Ollama Configuration
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama2"
    
    # Database Configuration
    database_url: str = "sqlite:///./quotes.db"
    
    # Model Configuration
    model_path: str = "models/price_predictor.joblib"
    
    # Security Configuration
    secret_key: str = "your_secret_key_here"
    
    # Environment Configuration
    environment: str = "development"
    
    # AI Provider Configuration
    ai_provider: str = "openai"  # Can be "openai" or "ollama"
    
    # Rate Limiting Configuration
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    
    # File Upload Configuration
    upload_dir: str = "uploads"
    temp_dir: str = "temp"
    max_upload_size: int = 10485760  # 10MB in bytes
    
    # Logging Configuration
    log_level: str = "INFO"
    log_file: str = "logs/quote_ai.log"
    
    # Vector Database Configuration
    vector_dimension: int = 1536
    vector_index_type: str = "ivfflat"
    vector_index_lists: int = 100
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""

# Initialize settings as None
_settings = None

def get_settings() -> Settings:
    """Get the settings instance, loading environment variables if needed."""
    global _settings
    if _settings is None:
        if os.getenv("ENVIRONMENT") != "test":
            load_dotenv()
        _settings = Settings()
    return _settings

# Export settings as a property
settings = property(get_settings) 