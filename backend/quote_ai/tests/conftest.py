import pytest
from quote_ai.core.models import Customer, Quote, ProductSpecification, CommunicationContext, Base
from quote_ai.db.database import get_db
from quote_ai.utils.config import Settings
from quote_ai.services.ai_service import AIService
from quote_ai.api.routers.quotes import get_ai_service
from fastapi.testclient import TestClient
from datetime import datetime
from quote_ai.api.main import app
import uuid
import os
import pandas as pd
import numpy as np
import time
import shutil
from sklearn.ensemble import GradientBoostingRegressor
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Set test environment before loading any other modules
os.environ["ENVIRONMENT"] = "test"

# Load test environment variables
load_dotenv(dotenv_path="quote_ai/tests/.env.test")

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Setup test database at the start of the test session"""
    # Remove existing test database if it exists
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except PermissionError:
            # If file is locked, wait a bit and try again
            time.sleep(1)
            try:
                os.remove("test.db")
            except PermissionError:
                pass
    
    # Create engine and tables
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Cleanup after all tests
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except PermissionError:
            pass

@pytest.fixture(scope="function")
def db_session(setup_test_database):
    """Create a fresh database session for each test"""
    connection = setup_test_database.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    yield session
    
    # Cleanup after each test
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(autouse=True)
def clean_database(db_session):
    """Clean up the database before each test"""
    # Delete all records from all tables
    for table in reversed(Base.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()

@pytest.fixture
def client(db_session):
    """Create a test client with the test database session"""
    # Override the get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()

@pytest.fixture
def test_settings():
    """Test settings for the application"""
    return Settings(
        openai_api_key="test_key",
        model_path="test_models/price_predictor.joblib",
        database_url=TEST_DATABASE_URL,
        environment="test",
        rate_limit_enabled=False,
        max_upload_size=10485760,
        upload_dir="test_uploads",
        temp_dir="test_temp",
        log_level="INFO",
        log_file="logs/quote_ai_test.log"
    )

@pytest.fixture(scope="session")
def settings():
    """Session-wide test settings"""
    return Settings(
        openai_api_key="test_key",
        model_path="test_models/price_predictor.joblib",
        database_url=TEST_DATABASE_URL,
        environment="test",
        rate_limit_enabled=False,
        max_upload_size=10485760,
        upload_dir="test_uploads",
        temp_dir="test_temp",
        log_level="INFO",
        log_file="logs/quote_ai_test.log"
    )

@pytest.fixture(scope="session")
def ai_service(settings):
    """Session-wide AI service for testing"""
    service = AIService(settings=settings)
    return service

@pytest.fixture
def sample_customer(db_session):
    unique_id = str(uuid.uuid4())[:8]
    customer = Customer(
        company_name=f"Test Company {unique_id}",
        contact_person=f"John Doe {unique_id}",
        email=f"john{unique_id}@testcompany.com",
        phone="1234567890"
    )
    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)
    return customer

@pytest.fixture
def sample_product_spec():
    return {
        "description": "Test Product",
        "profile_type": "Standard",
        "alloy": "6060",
        "weight_per_meter": 1.5,
        "total_length": 100.0,
        "surface_treatment": "anodized",
        "machining_complexity": "medium"
    }

@pytest.fixture
def sample_communication_context():
    return {
        "context_text": "Test context",
        "extracted_urgency": "High",
        "custom_requests": "None",
        "past_agreements": "None"
    }

@pytest.fixture
def sample_quote(db_session, sample_customer, sample_product_spec, sample_communication_context):
    # Create product specification
    product_spec = ProductSpecification(**sample_product_spec)
    db_session.add(product_spec)
    
    # Create communication context
    comm_context = CommunicationContext(**sample_communication_context)
    db_session.add(comm_context)
    
    # Create quote
    quote = Quote(
        title="Test Quote",
        reference_number=f"QT-{uuid.uuid4().hex[:8]}",
        validity_date=datetime.utcnow(),
        customer_id=sample_customer.id,
        predicted_price=1000.0,
        final_price=None,
        status="draft"
    )
    quote.product_specs = [product_spec]
    quote.communication_contexts = [comm_context]
    
    db_session.add(quote)
    db_session.commit()
    db_session.refresh(quote)
    
    return quote 