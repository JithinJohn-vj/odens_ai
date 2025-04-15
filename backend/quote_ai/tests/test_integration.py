import pytest
import requests
from datetime import datetime
import json
import os
import random
import string
from quote_ai.utils.config_dev import dev_settings

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

def generate_unique_reference():
    """Generate a unique reference number with timestamp and random string"""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"QT-{timestamp}-{random_str}"

@pytest.fixture(scope="module")
def test_customer_data():
    """Sample customer data for testing"""
    return {
        "company_name": "Test Company",
        "contact_person": "John Doe",
        "email": "john@testcompany.com",
        "phone": "1234567890",
        "address": "123 Test St",
        "city": "Test City",
        "country": "Test Country"
    }

@pytest.fixture(scope="function")
def test_quote_data():
    """Sample quote data for testing"""
    return {
        "title": "Test Quote",
        "reference_number": generate_unique_reference(),
        "validity_date": datetime.utcnow().isoformat(),
        "predicted_price": 1000.0,
        "final_price": 1200.0,
        "status": "draft",
        "product_specs": {
            "description": "Test Product",
            "profile_type": "Standard",
            "alloy": "6060",
            "weight_per_meter": 2.5,
            "total_length": 100.0,
            "surface_treatment": "anodized",
            "machining_complexity": "medium"
        },
        "communication_context": {
            "context_text": "Test context",
            "extracted_urgency": "high",
            "custom_requests": "Fast delivery",
            "past_agreements": "Previous discounts"
        }
    }

def test_create_customer(test_customer_data):
    """Test creating a new customer"""
    response = requests.post(f"{BASE_URL}/customers/", json=test_customer_data)
    assert response.status_code == 200
    data = response.json()
    assert data["company_name"] == test_customer_data["company_name"]
    assert data["email"] == test_customer_data["email"]
    return data["id"]  # Return customer ID for use in other tests

def test_read_customers():
    """Test retrieving all customers"""
    response = requests.get(f"{BASE_URL}/customers/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_read_customer(test_customer_data):
    """Test retrieving a specific customer"""
    # First create a customer
    customer_id = test_create_customer(test_customer_data)
    
    # Then read it
    response = requests.get(f"{BASE_URL}/customers/{customer_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == customer_id
    assert data["company_name"] == test_customer_data["company_name"]

def test_create_quote(test_quote_data, test_customer_data):
    """Test creating a new quote"""
    # First create a customer
    customer_id = test_create_customer(test_customer_data)
    
    # Create a copy of the test data to avoid modifying the original
    quote_data = test_quote_data.copy()
    quote_data["customer_id"] = customer_id
    
    # Convert nested dictionaries to proper objects
    product_specs = quote_data.pop("product_specs")
    comm_context = quote_data.pop("communication_context")
    
    # Create the quote with proper structure
    quote_data = {
        **quote_data,
        "product_specs": product_specs,
        "communication_context": comm_context
    }
    
    response = requests.post(f"{BASE_URL}/quotes/", json=quote_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_quote_data["title"]
    assert data["reference_number"] == test_quote_data["reference_number"]
    return data["id"]  # Return quote ID for use in other tests

def test_read_quotes():
    """Test retrieving all quotes"""
    response = requests.get(f"{BASE_URL}/quotes/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_read_quote(test_quote_data, test_customer_data):
    """Test retrieving a specific quote"""
    # First create a quote
    quote_id = test_create_quote(test_quote_data, test_customer_data)
    
    # Then read it
    response = requests.get(f"{BASE_URL}/quotes/{quote_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == quote_id
    assert data["title"] == test_quote_data["title"]

def test_generate_pdf(test_quote_data, test_customer_data):
    """Test generating a PDF for a quote"""
    # First create a quote
    quote_id = test_create_quote(test_quote_data, test_customer_data)
    
    # Generate PDF
    response = requests.get(f"{BASE_URL}/quotes/{quote_id}/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    
    # Save the PDF for inspection
    os.makedirs("test_outputs", exist_ok=True)
    with open(f"test_outputs/quote_{quote_id}.pdf", "wb") as f:
        f.write(response.content)

def test_upload_file():
    """Test file upload functionality"""
    # Create a test file
    test_file_path = "test_outputs/test_upload.txt"
    os.makedirs("test_outputs", exist_ok=True)
    with open(test_file_path, "w") as f:
        f.write("Test file content")
    
    # Upload the file
    with open(test_file_path, "rb") as f:
        files = {"file": ("test_upload.txt", f, "text/plain")}
        response = requests.post(f"{BASE_URL}/quotes/files/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "file_path" in data
    return data["file_path"]

def test_download_file():
    """Test file download functionality"""
    # First upload a file
    file_path = test_upload_file()
    
    # Download the file
    response = requests.get(f"{BASE_URL}/quotes/files/download/{file_path}")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    
    # Save the downloaded file
    with open(f"test_outputs/downloaded_{os.path.basename(file_path)}", "wb") as f:
        f.write(response.content)

def test_delete_file():
    """Test file deletion"""
    # First upload a file
    file_path = test_upload_file()
    
    # Delete the file
    response = requests.delete(f"{BASE_URL}/quotes/files/{os.path.basename(file_path)}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "File deleted successfully" 