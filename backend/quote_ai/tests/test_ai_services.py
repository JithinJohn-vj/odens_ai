import pytest
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np
from datetime import datetime
import os
from quote_ai.services.ai_service import AIService
from quote_ai.services.model_training import ModelTrainingService
from quote_ai.utils.config import Settings
from sklearn.ensemble import GradientBoostingRegressor

@pytest.fixture
def settings():
    return Settings(
        openai_api_key="test_key",
        model_path="test_models/price_predictor.joblib",
        database_url="sqlite:///./test.db"
    )

@pytest.fixture
def mock_openai():
    with patch('openai.AsyncOpenAI') as mock:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value.choices[0].message.content = "Test response"
        mock.return_value = mock_client
        yield mock

@pytest.fixture
def ai_service(settings, mock_openai):
    with patch('quote_ai.services.ai_service.OpenAI'), \
         patch('quote_ai.services.ai_service.AsyncOpenAI'):
        service = AIService(settings=settings)
        # Create a simple trained model for testing
        X = pd.DataFrame({
            'weight_per_meter': [2.5, 3.0],
            'total_length': [100.0, 150.0],
            'machining_complexity': [2, 3],
            'surface_treatment_anodized': [1, 0],
            'surface_treatment_painted': [0, 1],
            'surface_treatment_raw': [0, 0],
            'alloy_6060': [1, 0],
            'alloy_6063': [0, 1],
            'alloy_6082': [0, 0]
        })
        y = np.array([1000.0, 1500.0])
        service.model = GradientBoostingRegressor()
        service.model.fit(X, y)
        return service

@pytest.fixture
def model_training_service(settings):
    service = ModelTrainingService(settings=settings)
    return service

@pytest.fixture
def sample_training_data():
    return pd.DataFrame({
        'weight_per_meter': np.random.uniform(1.0, 5.0, 100),
        'total_length': np.random.uniform(50, 500, 100),
        'machining_complexity': np.random.randint(1, 4, 100),
        'surface_treatment': np.random.choice(['anodized', 'painted', 'raw'], 100),
        'alloy': np.random.choice(['6060', '6063', '6082'], 100),
        'price': np.random.uniform(1000, 10000, 100)
    })

@pytest.fixture
def sample_quotes():
    return [
        {
            'product_specs': [{
                'weight_per_meter': 2.5,
                'total_length': 100.0,
                'machining_complexity': 'medium',
                'surface_treatment': 'anodized',
                'alloy': '6060'
            }],
            'final_price': 1500.0
        },
        {
            'product_specs': [{
                'weight_per_meter': 3.0,
                'total_length': 150.0,
                'machining_complexity': 'high',
                'surface_treatment': 'painted',
                'alloy': '6063'
            }],
            'final_price': 2000.0
        }
    ]

def test_ai_service_initialization(ai_service):
    assert ai_service.settings is not None
    assert ai_service.client is not None
    assert ai_service.async_client is not None

def test_ai_service_predict_price(ai_service):
    product_specs = {
        'weight_per_meter': 2.5,
        'total_length': 100.0,
        'machining_complexity': 'medium',
        'surface_treatment': 'anodized',
        'alloy': '6060'
    }
    result = ai_service.predict_price(product_specs)
    assert 'predicted_price' in result
    assert 'confidence' in result
    assert isinstance(result['predicted_price'], float)
    assert isinstance(result['confidence'], float)

@pytest.mark.asyncio
async def test_ai_service_extract_context(ai_service, mock_openai):
    result = await ai_service.extract_context("Test text")
    assert 'extracted_urgency' in result
    assert 'custom_requests' in result
    assert 'past_agreements' in result

@pytest.mark.asyncio
async def test_ai_service_generate_quote_text(ai_service, mock_openai):
    quote_data = {
        'customer': {'company_name': 'Test Co'},
        'product_specs': {'description': 'Test Product'},
        'communication_context': {'context_text': 'Test context'},
        'predicted_price': 1000.0
    }
    
    result = await ai_service.generate_quote_text(quote_data)
    assert isinstance(result, str)
    assert len(result) > 0

def test_model_training_service_initialization(model_training_service):
    assert model_training_service.settings is not None
    assert model_training_service.model_path == "test_models/price_predictor.joblib"
    assert model_training_service.training_data_path == "data/training_data.csv"

def test_model_training_prepare_data(model_training_service, sample_quotes):
    df = model_training_service.prepare_training_data(sample_quotes)
    assert isinstance(df, pd.DataFrame)
    assert len(df) > 0
    assert os.path.exists(model_training_service.training_data_path)

def test_model_training_train_model(model_training_service, sample_training_data):
    result = model_training_service.train_model(sample_training_data)
    assert 'mse' in result
    assert 'r2' in result
    assert 'best_params' in result
    assert os.path.exists(model_training_service.model_path)

def test_model_training_evaluate_model(model_training_service, sample_training_data):
    # First train the model
    model_training_service.train_model(sample_training_data)
    
    # Then evaluate
    result = model_training_service.evaluate_model(sample_training_data)
    assert 'mse' in result
    assert 'r2' in result
    assert 'rmse' in result
    assert 'mae' in result

def test_model_training_get_model_info(model_training_service, sample_training_data):
    # First train the model
    model_training_service.train_model(sample_training_data)
    
    # Then get info
    result = model_training_service.get_model_info()
    assert 'model_type' in result
    assert 'n_features' in result
    assert 'n_estimators' in result
    assert 'last_trained' in result
    assert 'model_path' in result

def test_model_training_encode_complexity(model_training_service):
    assert model_training_service._encode_complexity('low') == 1
    assert model_training_service._encode_complexity('medium') == 2
    assert model_training_service._encode_complexity('high') == 3
    assert model_training_service._encode_complexity('unknown') == 2  # default value

def test_ai_service_error_handling(ai_service):
    # Test price prediction with invalid input
    with pytest.raises(Exception):
        ai_service.predict_price({})

    # Test model loading error
    with patch('joblib.load', side_effect=Exception("Load error")):
        with pytest.raises(Exception):
            ai_service.load_model()

def test_model_training_error_handling(model_training_service):
    # Test training with invalid data
    with pytest.raises(Exception):
        model_training_service.train_model(pd.DataFrame())

    # Test evaluation without trained model
    with pytest.raises(Exception):
        model_training_service.evaluate_model() 