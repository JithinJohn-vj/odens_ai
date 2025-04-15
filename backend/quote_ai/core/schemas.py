from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List, Literal
from datetime import datetime

class CustomerBase(BaseModel):
    company_name: str
    contact_person: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductSpecificationBase(BaseModel):
    description: str
    profile_type: str
    alloy: Literal['6060', '6063', '6082']
    weight_per_meter: float
    total_length: float
    surface_treatment: Literal['anodized', 'painted', 'raw']
    machining_complexity: Literal['low', 'medium', 'high']

class ProductSpecificationCreate(ProductSpecificationBase):
    pass

class ProductSpecification(ProductSpecificationBase):
    id: int
    quote_id: int

    class Config:
        from_attributes = True

class CommunicationContextBase(BaseModel):
    context_text: str
    extracted_urgency: Optional[str] = None
    custom_requests: Optional[str] = None
    past_agreements: Optional[str] = None

class CommunicationContextCreate(CommunicationContextBase):
    pass

class CommunicationContext(CommunicationContextBase):
    id: int
    quote_id: int

    class Config:
        from_attributes = True

class QuoteBase(BaseModel):
    title: str
    reference_number: str
    validity_date: datetime
    customer_id: int
    predicted_price: Optional[float] = None
    final_price: Optional[float] = None
    status: str = "draft"

class QuoteCreate(QuoteBase):
    product_specs: ProductSpecificationCreate
    communication_context: CommunicationContextCreate

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    reference_number: Optional[str] = None
    validity_date: Optional[datetime] = None
    predicted_price: Optional[float] = None
    final_price: Optional[float] = None
    status: Optional[str] = None

class Quote(QuoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    product_specs: List[ProductSpecification] = []
    communication_contexts: List[CommunicationContext] = []
    customer: Optional[Customer] = None

    class Config:
        from_attributes = True

class PricePrediction(BaseModel):
    predicted_price: float
    confidence: float

class QuoteGenerationRequest(BaseModel):
    customer_id: int
    product_specs: ProductSpecificationCreate
    communication_context: CommunicationContextCreate

class QuoteGenerationResponse(BaseModel):
    status: str
    message: str
    quote_text: str

class FileUploadResponse(BaseModel):
    file_path: str

class FileValidationResponse(BaseModel):
    is_valid: bool
    message: str
    file_type: str
    file_size: int 