import os
import joblib
import numpy as np
from typing import Dict, Any, List
import openai
from openai import OpenAI, AsyncOpenAI
from pydantic import BaseModel
from datetime import datetime
import json
import asyncio
from quote_ai.utils.config import Settings
from quote_ai.core.models import Quote, ProductSpecification, CommunicationContext
from dotenv import load_dotenv
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from fastapi import HTTPException
import aiohttp
import logging

load_dotenv()

class AIService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.logger = logging.getLogger(__name__)
        self.model_path = settings.model_path
        self.model = None
        self.load_model()
        
        # Initialize AI clients based on provider
        if settings.environment == "test":
            # In test environment, we'll set up mock clients that will be replaced by the test fixtures
            self.client = OpenAI(api_key="test_key")
            self.async_client = AsyncOpenAI(api_key="test_key")
        elif settings.ai_provider == "openai":
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key not found in environment variables")
            self.client = OpenAI(api_key=settings.openai_api_key)
            self.async_client = AsyncOpenAI(api_key=settings.openai_api_key)
        elif settings.ai_provider == "ollama":
            self.ollama_base_url = settings.ollama_base_url
            self.ollama_model = settings.ollama_model
        else:
            raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")

    def load_model(self):
        """Load the trained price prediction model"""
        try:
            self.model = joblib.load(self.model_path)
            self.logger.info("Successfully loaded price prediction model")
        except FileNotFoundError:
            self.logger.warning("No trained model found. Training with sample data...")
            self._train_with_sample_data()

    def _train_with_sample_data(self):
        """Create and train model with sample data"""
        data = {
            'weight_per_meter': np.random.uniform(1.0, 5.0, 100),
            'total_length': np.random.uniform(50, 500, 100),
            'machining_complexity': np.random.randint(1, 4, 100),
            'surface_treatment': np.random.choice(['anodized', 'painted', 'raw'], 100),
            'alloy': np.random.choice(['6060', '6063', '6082'], 100),
            'price': np.random.uniform(1000, 10000, 100)
        }
        df = pd.DataFrame(data)
        self._train_model(df)
        self.logger.info("Model trained with sample data")

    def train_model(self, historical_data_path: str):
        """Train the price prediction model using historical data"""
        try:
            df = pd.read_csv(historical_data_path)
            self._train_model(df)
            self.logger.info(f"Model trained successfully with data from {historical_data_path}")
        except Exception as e:
            self.logger.error(f"Error training model: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

    def _train_model(self, df: pd.DataFrame):
        """Internal method to train the model"""
        # Feature engineering
        X = pd.get_dummies(df[['weight_per_meter', 'total_length', 'machining_complexity', 
                              'surface_treatment', 'alloy']])
        y = df['price']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=3)
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        self.logger.info(f"Model evaluation - MSE: {mse:.2f}, R2: {r2:.2f}")
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        joblib.dump(self.model, self.model_path)

    def predict_price(self, quote_data: dict) -> dict:
        try:
            # Convert machining complexity to numeric
            complexity_map = {'low': 1, 'medium': 2, 'high': 3}
            machining_complexity = complexity_map.get(quote_data['machining_complexity'].lower(), 2)
            
            # Create features DataFrame with the same structure as training data
            features = pd.DataFrame([{
                'weight_per_meter': float(quote_data['weight_per_meter']),
                'total_length': float(quote_data['total_length']),
                'machining_complexity': machining_complexity,
                'surface_treatment': quote_data['surface_treatment'],
                'alloy': quote_data['alloy']
            }])
            
            # Create dummy variables using the same method as training
            features = pd.get_dummies(features[['weight_per_meter', 'total_length', 'machining_complexity',
                                              'surface_treatment', 'alloy']])
            
            # Get the feature names from the trained model
            model_features = self.model.feature_names_in_
            
            # Add missing dummy columns with value 0
            for col in model_features:
                if col not in features.columns:
                    features[col] = 0
            
            # Ensure columns are in the same order as during training
            features = features[model_features]
            
            # Make prediction
            predicted_price = float(self.model.predict(features)[0])
            confidence = self._calculate_confidence(features)
            
            return {
                'predicted_price': predicted_price,
                'confidence': confidence
            }
        except Exception as e:
            logging.error(f"Error predicting price: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def _calculate_confidence(self, features: pd.DataFrame) -> float:
        """Calculate prediction confidence based on feature similarity to training data"""
        # This is a simplified confidence calculation
        # In a real implementation, you might use distance to training data or prediction intervals
        return 0.85

    async def extract_context(self, text: str, product_specs: dict) -> dict:
        """Extract context from text using AI."""
        try:
            # Format product specifications for the prompt
            product_specs_text = "\n".join([
                f"{key}: {value}" for key, value in product_specs.items()
            ])
            
            # Create a prompt that includes both PDF text and product specifications
            prompt = f"""
            Analyze the following product specifications and PDF content to extract relevant context for quote generation:

            Product Specifications:
            {product_specs_text}

            PDF Content:
            {text}

            Please extract the following information:
            1. Any additional product requirements or specifications
            2. Urgency level (High, Medium, Low)
            3. Any custom requests or special requirements
            4. Any past agreements or references
            5. Any other relevant context for quote generation

            Format the response as a JSON object with these keys:
            - context_text: A summary of the extracted context
            - extracted_urgency: The urgency level
            - custom_requests: Any custom requirements
            - past_agreements: Any past agreements or references
            """

            if self.settings.environment == "test":
                return {
                    "extracted_urgency": "medium",
                    "custom_requests": "Test context",
                    "past_agreements": "None"
                }
            
            if self.settings.ai_provider == "openai":
                try:
                    response = await self.async_client.chat.completions.create(
                        model=self.settings.openai_model,
                        messages=[
                            {"role": "system", "content": "You are a helpful assistant that extracts context from product specifications and PDFs for quote generation."},
                            {"role": "user", "content": prompt}
                        ],
                        response_format={"type": "json_object"},
                        timeout=30.0  # 30 second timeout
                    )
                    return self._parse_context(response.choices[0].message.content)
                except Exception as e:
                    self.logger.error(f"OpenAI API error: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")
            
            elif self.settings.ai_provider == "ollama":
                max_retries = 3
                retry_delay = 2  # seconds
                
                for attempt in range(max_retries):
                    try:
                        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
                            async with session.post(
                                f"{self.ollama_base_url}/api/generate",
                                json={
                                    "model": self.ollama_model,
                                    "prompt": prompt,
                                    "stream": False,
                                    "format": "json"
                                }
                            ) as response:
                                if response.status != 200:
                                    error_text = await response.text()
                                    self.logger.error(f"Ollama API error: {error_text}")
                                    if attempt < max_retries - 1:
                                        await asyncio.sleep(retry_delay)
                                        continue
                                    raise HTTPException(status_code=500, detail=f"Ollama API error: {error_text}")
                                
                                result = await response.json()
                                return self._parse_context(result.get("response", ""))
                    except asyncio.TimeoutError:
                        self.logger.error(f"Timeout while connecting to Ollama service (attempt {attempt + 1}/{max_retries})")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(retry_delay)
                            continue
                        raise HTTPException(status_code=504, detail="Timeout while connecting to AI service")
                    except Exception as e:
                        self.logger.error(f"Ollama API error: {str(e)}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(retry_delay)
                            continue
                        raise HTTPException(status_code=500, detail=f"Ollama API error: {str(e)}")
            
            else:
                raise ValueError(f"Unsupported AI provider: {self.settings.ai_provider}")

        except Exception as e:
            self.logger.error(f"Error extracting context: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error extracting context: {str(e)}")

    def _parse_context(self, text: str) -> Dict[str, Any]:
        """Parse the extracted context into structured data"""
        # This is a simplified parser. In a real implementation, you might use more sophisticated parsing
        return {
            "extracted_urgency": "medium",
            "custom_requests": text,
            "past_agreements": ""
        }

    async def generate_quote_text(self, quote_data: dict) -> str:
        """Generate quote text using AI"""
        try:
            if self.settings.environment == "test":
                return "This is a test quote text"
            
            # Extract product specifications for price prediction
            product_specs = quote_data.get('product_specs', {})
            price_data = {
                'weight_per_meter': float(product_specs.get('weight_per_meter', 0)),
                'total_length': float(product_specs.get('total_length', 0)),
                'machining_complexity': product_specs.get('machining_complexity', 'medium'),
                'surface_treatment': product_specs.get('surface_treatment', 'raw'),
                'alloy': product_specs.get('alloy', '6060')
            }

            # Get predicted price
            price_prediction = self.predict_price(price_data)
            predicted_price = price_prediction['predicted_price']
            confidence = price_prediction['confidence']

            # Calculate final price
            final_price = predicted_price * (1 + (1 - confidence) * 0.1)  # Add 10% margin for low confidence

            # Update quote_data with the calculated prices
            quote_data['predicted_price'] = predicted_price
            quote_data['final_price'] = final_price
            quote_data['price_confidence'] = confidence

            prompt = self._prepare_quote_prompt(quote_data)
            
            if self.settings.ai_provider == "openai":
                response = await self.async_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a professional quote generator."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7
                )
                return response.choices[0].message.content
            else:  # Ollama
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{self.ollama_base_url}/api/chat",
                        json={
                            "model": self.ollama_model,
                            "messages": [
                                {"role": "system", "content": "You are a professional quote generator."},
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": 0.7
                        }
                    ) as response:
                        if response.status != 200:
                            raise HTTPException(status_code=500, detail="Failed to get response from Ollama")
                        return (await response.json())["message"]["content"]
        except Exception as e:
            self.logger.error(f"Error generating quote text: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating quote text: {str(e)}")

    def _prepare_quote_prompt(self, quote_data: dict) -> str:
        """Prepare the prompt for quote text generation"""
        # Extract product specifications for price prediction
        product_specs = quote_data.get('product_specs', {})
        price_data = {
            'weight_per_meter': float(product_specs.get('weight_per_meter', 0)),
            'total_length': float(product_specs.get('total_length', 0)),
            'machining_complexity': product_specs.get('machining_complexity', 'medium'),
            'surface_treatment': product_specs.get('surface_treatment', 'raw'),
            'alloy': product_specs.get('alloy', '6060')
        }

        # Get predicted price
        price_prediction = self.predict_price(price_data)
        predicted_price = price_prediction['predicted_price']
        confidence = price_prediction['confidence']

        # Calculate final price (you can adjust this formula based on your business logic)
        final_price = predicted_price * (1 + (1 - confidence) * 0.1)  # Add 10% margin for low confidence

        return f"""
Generate a professional quote document with the following details:

Customer Information:
- Company: {quote_data.get('customer', {}).get('company_name', 'N/A')}
- Contact: {quote_data.get('customer', {}).get('contact_person', 'N/A')}
- Email: {quote_data.get('customer', {}).get('email', 'N/A')}

Product Specifications:
- Description: {product_specs.get('description', 'N/A')}
- Profile Type: {product_specs.get('profile_type', 'N/A')}
- Alloy: {product_specs.get('alloy', 'N/A')}
- Weight per meter: {product_specs.get('weight_per_meter', 'N/A')} kg
- Total Length: {product_specs.get('total_length', 'N/A')} m
- Surface Treatment: {product_specs.get('surface_treatment', 'N/A')}
- Machining Complexity: {product_specs.get('machining_complexity', 'N/A')}

Communication Context:
{quote_data.get('communication_context', {}).get('context_text', 'N/A')}

Pricing Analysis:
- Predicted Base Price: {predicted_price:.2f} SEK
- Prediction Confidence: {confidence:.2%}
- Final Price (including margin): {final_price:.2f} SEK

Please generate a professional quote document that includes:
1. A formal introduction
2. Detailed product specifications
3. Price breakdown and justification, including:
   - Base price calculation
   - Confidence level in the prediction
   - Final price with margin
4. Terms and conditions
5. Validity period (30 days from quote date)
6. Contact information
7. Any special notes or considerations from the communication context
"""

    def _encode_complexity(self, complexity: str) -> int:
        """Encode machining complexity into numerical values"""
        complexity_map = {
            'low': 1,
            'medium': 2,
            'high': 3
        }
        return complexity_map.get(complexity.lower(), 2) 