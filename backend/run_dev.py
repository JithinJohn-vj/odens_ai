import uvicorn
import os
import sys
from quote_ai.utils.config_dev import dev_settings
from sqlalchemy import text

def check_database_connection():
    """Verify database connection before starting the application"""
    try:
        # Try to connect to the database
        with dev_settings.engine.connect() as conn:
            # Execute a simple query to verify connection
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("\nPlease ensure:")
        print("1. PostgreSQL is running")
        print("2. Database credentials are correct")
        print("3. Database exists and is accessible")
        return False

if __name__ == "__main__":
    # Set environment variables from dev_settings
    os.environ["ENVIRONMENT"] = dev_settings.environment
    os.environ["DATABASE_URL"] = dev_settings.database_url
    os.environ["OPENAI_API_KEY"] = dev_settings.openai_api_key
    os.environ["MODEL_PATH"] = dev_settings.model_path
    os.environ["UPLOAD_DIR"] = dev_settings.upload_dir
    os.environ["LOG_LEVEL"] = dev_settings.log_level
    os.environ["LOG_FILE"] = dev_settings.log_file

    # Print database connection info for verification
    print(f"Database URL: {dev_settings.database_url}")
    print(f"Database User: {dev_settings.db_user}")
    print(f"Database Name: {dev_settings.db_name}")

    # Check database connection before starting
    if not check_database_connection():
        sys.exit(1)

    # Run the development server
    uvicorn.run(
        "quote_ai.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 