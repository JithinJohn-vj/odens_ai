import pytest
from fastapi.testclient import TestClient
from quote_ai.api.main import app
from quote_ai.core.models import Customer, Quote, ProductSpecification, CommunicationContext
from datetime import datetime
from quote_ai.api.routers.quotes import get_ai_service
from quote_ai.tests.conftest import client, ai_service
from unittest.mock import patch
from unittest.mock import MagicMock

@pytest.fixture(autouse=True)
def override_dependencies(ai_service):
    app.dependency_overrides[get_ai_service] = lambda: ai_service
    yield
    app.dependency_overrides.clear()

def test_create_customer(client):
    response = client.post(
        "/api/customers/",
        json={
            "company_name": "Test Company",
            "contact_person": "John Doe",
            "email": "john@testcompany.com",
            "phone": "1234567890"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Test Company"
    assert data["contact_person"] == "John Doe"
    assert data["email"] == "john@testcompany.com"

def test_get_customer(client, sample_customer):
    response = client.get(f"/api/customers/{sample_customer.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_customer.id
    assert data["company_name"] == sample_customer.company_name

def test_update_customer(client, sample_customer):
    response = client.put(
        f"/api/customers/{sample_customer.id}",
        json={
            "company_name": "Updated Company",
            "contact_person": "Jane Doe",
            "email": "jane@updatedcompany.com",
            "phone": "9876543210"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == "Updated Company"
    assert data["contact_person"] == "Jane Doe"
    assert data["email"] == "jane@updatedcompany.com"

def test_delete_customer(client, sample_customer):
    response = client.delete(f"/api/customers/{sample_customer.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Customer deleted successfully"

def test_create_quote(client, sample_customer, sample_product_spec, sample_communication_context):
    response = client.post(
        "/api/quotes/",
        json={
            "title": "Test Quote",
            "reference_number": "QT-001",
            "validity_date": datetime.utcnow().isoformat(),
            "customer_id": sample_customer.id,
            "predicted_price": 1000.0,
            "product_specs": {
                "description": "Test Product",
                "profile_type": "Standard",
                "alloy": "6060",
                "weight_per_meter": 1.5,
                "total_length": 100.0,
                "surface_treatment": "anodized",
                "machining_complexity": "medium"
            },
            "communication_context": {
                "context_text": "Test context",
                "extracted_urgency": "High",
                "custom_requests": "None",
                "past_agreements": "None"
            }
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Quote"
    assert data["reference_number"] == "QT-001"
    assert data["customer_id"] == sample_customer.id

def test_get_quote(client, sample_quote):
    response = client.get(f"/api/quotes/{sample_quote.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_quote.id
    assert data["title"] == sample_quote.title
    assert data["reference_number"] == sample_quote.reference_number

def test_update_quote(client, sample_quote):
    response = client.put(
        f"/api/quotes/{sample_quote.id}",
        json={
            "title": "Updated Quote",
            "status": "approved",
            "final_price": 1500.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Quote"
    assert data["status"] == "approved"
    assert data["final_price"] == 1500.0

def test_delete_quote(client, sample_quote):
    response = client.delete(f"/api/quotes/{sample_quote.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Quote deleted successfully"

def test_predict_price(client, sample_product_spec):
    # Create a properly formatted request body
    request_body = {
        "description": sample_product_spec["description"],
        "profile_type": sample_product_spec["profile_type"],
        "alloy": sample_product_spec["alloy"],
        "weight_per_meter": sample_product_spec["weight_per_meter"],
        "total_length": sample_product_spec["total_length"],
        "surface_treatment": sample_product_spec["surface_treatment"],
        "machining_complexity": sample_product_spec["machining_complexity"]
    }
    
    response = client.post(
        "/api/quotes/predict-price",
        json=request_body
    )
    if response.status_code != 200:
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert "predicted_price" in data
    assert "confidence" in data

def test_generate_quote_pdf(client, sample_quote):
    response = client.get(f"/api/quotes/{sample_quote.id}/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_upload_file(client):
    test_file = ("test.pdf", b"test content", "application/pdf")
    response = client.post(
        "/api/quotes/files/upload",
        files={"file": test_file}
    )
    assert response.status_code == 200
    data = response.json()
    assert "file_path" in data
    assert "quote_id" in data
    assert "status" in data

def test_download_file(client):
    # Create a test file first
    test_file = ("test.pdf", b"test content", "application/pdf")
    upload_response = client.post(
        "/api/quotes/files/upload",
        files={"file": test_file}
    )
    assert upload_response.status_code == 200
    file_path = upload_response.json()["file_path"]
    
    response = client.get(f"/api/quotes/files/download/{file_path}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/octet-stream"
    assert response.content == b"test content"

def test_delete_file(client):
    # Create a test file first
    test_file = ("test.pdf", b"test content", "application/pdf")
    upload_response = client.post(
        "/api/quotes/files/upload",
        files={"file": test_file}
    )
    file_path = upload_response.json()["file_path"]
    
    response = client.delete(f"/api/quotes/files/{file_path}")
    assert response.status_code == 200
    assert response.json()["message"] == "File deleted successfully" 