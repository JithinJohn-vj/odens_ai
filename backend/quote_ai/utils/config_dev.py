from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine

# Load environment variables first
load_dotenv(dotenv_path=".env.dev")

class DevSettings(BaseModel):
    """Development settings for the application"""
    model_config = ConfigDict(
        env_file=".env.dev",
        env_file_encoding="utf-8",
        env_prefix="",
        protected_namespaces=('settings_',)
    )

    openai_api_key: str = Field(default=os.getenv("OPENAI_API_KEY", ""), description="OpenAI API key")
    model_path: str = Field(default=os.getenv("MODEL_PATH", ""), description="Path to the model file")
    
    # Database Configuration
    db_host: str = Field(default=os.getenv("DB_HOST", "localhost"), description="Database host")
    db_port: int = Field(default=int(os.getenv("DB_PORT", "5432")), description="Database port")
    db_name: str = Field(default=os.getenv("DB_NAME", "quote_ai_dev"), description="Database name")
    db_user: str = Field(default=os.getenv("DB_USER", "postgres"), description="Database user")
    db_password: str = Field(default=os.getenv("DB_PASSWORD", "postgres"), description="Database password")
    db_sslmode: str = Field(default=os.getenv("DB_SSLMODE", "prefer"), description="Database SSL mode")
    
    @property
    def database_url(self) -> str:
        """Construct the database URL with proper authentication"""
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}?sslmode={self.db_sslmode}"
    
    @property
    def engine(self):
        """Create and return SQLAlchemy engine"""
        return create_engine(
            self.database_url,
            pool_pre_ping=True,  # Enable connection health checks
            pool_recycle=3600,   # Recycle connections after 1 hour
            echo=True,          # Enable SQL query logging
            pool_timeout=30     # Timeout for getting a connection from the pool
        )
    
    # Application Settings
    environment: str = Field(default=os.getenv("ENVIRONMENT", "dev"), description="Application environment")
    rate_limit_enabled: bool = Field(default=os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true", description="Enable rate limiting")
    
    @property
    def max_upload_size(self) -> int:
        """Get the maximum upload size in bytes"""
        max_size = os.getenv("MAX_UPLOAD_SIZE", "10485760")
        # Remove any comments or whitespace
        max_size = max_size.split("#")[0].strip()
        return int(max_size)
    
    upload_dir: str = Field(default=os.getenv("UPLOAD_DIR", "uploads"), description="Upload directory")
    model_dir: str = Field(default=os.getenv("MODEL_DIR", "models"), description="Model directory")
    log_dir: str = Field(default=os.getenv("LOG_DIR", "logs"), description="Log directory")
    log_level: str = Field(default=os.getenv("LOG_LEVEL", "INFO"), description="Log level")
    log_file: str = Field(default=os.getenv("LOG_FILE", "app.log"), description="Log file")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create required directories
        for dir_path in [self.upload_dir, self.model_dir, self.log_dir]:
            Path(dir_path).mkdir(parents=True, exist_ok=True)

# Initialize settings instance
_dev_settings = None

def get_dev_settings() -> DevSettings:
    """Get or create the development settings instance"""
    global _dev_settings
    if _dev_settings is None:
        # Create settings instance
        _dev_settings = DevSettings()
        
        # Create required directories
        os.makedirs(_dev_settings.upload_dir, exist_ok=True)
        os.makedirs(_dev_settings.model_dir, exist_ok=True)
        os.makedirs(_dev_settings.log_dir, exist_ok=True)
        
        # Set the full log file path
        _dev_settings.log_file = os.path.join(_dev_settings.log_dir, _dev_settings.log_file)
    
    return _dev_settings

# Create the settings instance
dev_settings = get_dev_settings() 