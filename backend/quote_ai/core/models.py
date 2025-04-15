from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from quote_ai.db.database import Base

def get_current_time():
    return datetime.utcnow()

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    quotes = relationship("Quote", back_populates="customer")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.created_at = get_current_time()
        self.updated_at = self.created_at

class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    reference_number = Column(String, unique=True, index=True)
    validity_date = Column(DateTime(timezone=True))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    predicted_price = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    status = Column(String, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="quotes")
    product_specs = relationship("ProductSpecification", back_populates="quote")
    communication_contexts = relationship("CommunicationContext", back_populates="quote")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.created_at = get_current_time()
        self.updated_at = self.created_at

class ProductSpecification(Base):
    __tablename__ = "product_specifications"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    description = Column(String)
    profile_type = Column(String)
    alloy = Column(String)
    weight_per_meter = Column(Float)
    total_length = Column(Float)
    surface_treatment = Column(String)
    machining_complexity = Column(String)

    quote = relationship("Quote", back_populates="product_specs")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.created_at = get_current_time()
        self.updated_at = self.created_at

class CommunicationContext(Base):
    __tablename__ = "communication_contexts"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    context_text = Column(Text)
    extracted_urgency = Column(String, nullable=True)
    custom_requests = Column(String, nullable=True)
    past_agreements = Column(String, nullable=True)

    quote = relationship("Quote", back_populates="communication_contexts")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.created_at = get_current_time()
        self.updated_at = self.created_at 