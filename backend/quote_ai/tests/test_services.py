import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from quote_ai.services.ai_service import AIService
from quote_ai.services.pdf_service import PDFService
from quote_ai.services.file_service import FileService
from quote_ai.services.model_training import ModelTrainingService
from quote_ai.services.quote_generation import QuoteGenerationService
import os
from fastapi import UploadFile
from unittest.mock import ANY
from quote_ai.utils.config import Settings

@pytest.fixture
def mock_openai():
    with patch("openai.OpenAI") as mock:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = "Mock quote text for testing"
        mock.return_value = mock_client
        yield mock

@pytest.fixture
def mock_joblib():
    with patch("joblib.load") as mock:
        mock_model = MagicMock()
        mock_model.predict.return_value = [1000.0]
        mock.return_value = mock_model
        yield mock

@pytest.fixture
def mock_reportlab():
    with patch("quote_ai.services.pdf_service.SimpleDocTemplate", autospec=True) as mock:
        mock_instance = MagicMock()
        mock.return_value = mock_instance
        mock_instance.build.return_value = None
        yield mock

@pytest.fixture
def ai_service(mock_openai, mock_joblib):
    settings = Settings(
        openai_api_key="test_key",
        model_path="test_models/price_predictor.joblib",
        database_url="sqlite:///./test.db",
        environment="test"
    )
    service = AIService(settings=settings)
    
    # Mock methods for testing
    async def mock_extract_context(text: str):
        return {
            "extracted_urgency": "medium",
            "custom_requests": "Test context",
            "past_agreements": "None"
        }
    
    async def mock_generate_quote_text(quote_data: dict):
        return "This is a test quote text"
    
    service.extract_context = mock_extract_context
    service.generate_quote_text = mock_generate_quote_text
    
    return service

def test_ai_service_price_prediction(ai_service):
    product_specs = {
        "weight_per_meter": 2.5,
        "total_length": 100.0,
        "machining_complexity": "medium",
        "surface_treatment": "anodized",
        "alloy": "6060"
    }
    result = ai_service.predict_price(product_specs)
    assert "predicted_price" in result
    assert "confidence" in result
    assert isinstance(result["predicted_price"], float)
    assert isinstance(result["confidence"], float)

@pytest.mark.asyncio
async def test_ai_service_quote_generation(ai_service):
    quote_data = {
        "customer": {"company_name": "Test Co"},
        "product_specs": {
            "description": "Test Product",
            "weight_per_meter": 2.5,
            "total_length": 100.0,
            "machining_complexity": "medium",
            "surface_treatment": "anodized",
            "alloy": "6060"
        },
        "communication_context": {"context_text": "Test context"},
        "predicted_price": 1000.0
    }
    quote_text = await ai_service.generate_quote_text(quote_data)
    assert isinstance(quote_text, str)
    assert len(quote_text) > 0

@pytest.mark.asyncio
async def test_ai_service_context_extraction(ai_service):
    text = "Customer needs 100 meters of aluminum profile with weight 1.5 kg/m"
    specs = await ai_service.extract_context(text)
    assert isinstance(specs, dict)
    assert "extracted_urgency" in specs
    assert "custom_requests" in specs
    assert "past_agreements" in specs

def test_pdf_service_generation(mock_reportlab):
    service = PDFService()
    quote_data = {
        "reference_number": "QT-001",
        "validity_date": datetime.utcnow(),
        "status": "draft",
        "customer": {
            "company_name": "Test Company",
            "contact_person": "John Doe",
            "email": "john@test.com"
        },
        "product_specs": {
            "description": "Test Product",
            "profile_type": "Standard",
            "alloy": "Steel",
            "weight_per_meter": 2.5,
            "total_length": 100.0,
            "surface_treatment": "Anodized",
            "machining_complexity": "medium"
        },
        "communication_context": {
            "context_text": "Test context"
        },
        "predicted_price": 1000.0,
        "final_price": 1200.0
    }
    service.generate_quote_pdf(quote_data, "test.pdf")
    mock_reportlab.assert_called_once()
    mock_reportlab.return_value.build.assert_called_once()

@pytest.fixture
def file_service():
    service = FileService("test_uploads")
    yield service
    # Cleanup test directory
    if os.path.exists("test_uploads"):
        import shutil
        shutil.rmtree("test_uploads")

@pytest.mark.asyncio
async def test_file_service_upload(file_service):
    file = MagicMock(spec=UploadFile)
    file.filename = "test.pdf"
    file.read.side_effect = [b"test content"]
    file.seek.return_value = None
    
    result = await file_service.save_uploaded_file(file, 1)
    assert result is not None
    assert os.path.normpath(result).startswith(os.path.normpath("test_uploads/quote_1_"))
    assert result.endswith(".pdf")

def test_file_service_download(file_service):
    # Create a test file
    os.makedirs("test_uploads", exist_ok=True)
    with open(os.path.join("test_uploads", "test.pdf"), "wb") as f:
        f.write(b"test content")
    
    result = file_service.get_file_path("test.pdf")
    assert result is not None
    file_path, content_type = result
    assert os.path.normpath(file_path) == os.path.normpath("test_uploads/test.pdf")
    assert content_type == "application/pdf"

def test_file_service_delete(file_service):
    # Create a test file
    os.makedirs("test_uploads", exist_ok=True)
    with open(os.path.join("test_uploads", "test.pdf"), "wb") as f:
        f.write(b"test content")
    
    result = file_service.delete_file("test.pdf")
    assert result is True 