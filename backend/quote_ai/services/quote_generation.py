from typing import Dict, Any
from quote_ai.core.models import ProductSpecification, Quote
from quote_ai.services.ai_service import AIService

class QuoteGenerationService:
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service

    async def generate_quote(self, product_spec: ProductSpecification, context: Dict[str, Any]) -> Quote:
        # Use AI service to predict price
        predicted_price = await self.ai_service.predict_price(product_spec)
        
        # Create quote with predicted price
        quote = Quote(
            title=f"Quote for {product_spec.description}",
            reference_number="QT-001",  # This should be generated uniquely
            validity_date=None,  # This should be set based on business rules
            customer_id=None,  # This should be provided by the caller
            predicted_price=predicted_price,
            final_price=None,
            status="draft"
        )
        
        return quote 