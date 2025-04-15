from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from quote_ai.db.database import engine, Base
from .routers import customers, quotes
from .middleware import RateLimitMiddleware
from sqlalchemy.exc import OperationalError
from sqlalchemy import text
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_database_connection():
    """Verify database connection during application startup"""
    try:
        # Try to connect to the database
        with engine.connect() as conn:
            # Execute a simple query to verify connection
            conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful")
        return True
    except OperationalError as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        logger.error("\nPlease ensure:")
        logger.error("1. PostgreSQL is running")
        logger.error("2. Database credentials are correct")
        logger.error("3. Database exists and is accessible")
        return False

# Create FastAPI app
app = FastAPI(
    title="Quote AI System",
    description="AI-Assisted Quote Automation System",
    version="0.1.0"
)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware, max_requests=100, time_window=60)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(customers.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Check database connection and create tables during startup"""
    if not check_database_connection():
        raise Exception("Database connection failed. Application cannot start.")
    
    try:
        # Create database tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "Welcome to Quote AI System API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 