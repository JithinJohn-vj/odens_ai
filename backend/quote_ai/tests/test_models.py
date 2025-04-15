import pytest
from datetime import datetime
from quote_ai.core.models import Customer, Quote, ProductSpecification, CommunicationContext
import uuid

def test_customer_model(db):
    unique_id = str(uuid.uuid4())[:8]
    customer = Customer(
        company_name=f"Test Company {unique_id}",
        contact_person=f"John Doe {unique_id}",
        email=f"john{unique_id}@testcompany.com",
        phone="1234567890"
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    assert customer.id is not None
    assert customer.company_name == f"Test Company {unique_id}"
    assert customer.contact_person == f"John Doe {unique_id}"
    assert customer.email == f"john{unique_id}@testcompany.com"
    assert isinstance(customer.created_at, datetime)
    assert isinstance(customer.updated_at, datetime)

def test_quote_model(db, sample_customer):
    unique_id = str(uuid.uuid4())[:8]
    
    # Create product specification
    product_spec = ProductSpecification(
        description="Test Product",
        profile_type="Standard",
        alloy="Steel",
        weight_per_meter=2.5,
        total_length=100.0,
        surface_treatment="Anodized",
        machining_complexity="Medium"
    )
    
    # Create communication context
    comm_context = CommunicationContext(
        context_text="Test context",
        extracted_urgency="high",
        custom_requests="Fast delivery",
        past_agreements="Previous discounts"
    )
    
    # Create quote
    quote = Quote(
        title=f"Test Quote {unique_id}",
        reference_number=f"QT-{unique_id}",
        validity_date=datetime.utcnow(),
        customer_id=sample_customer.id,
        predicted_price=1000.0,
        final_price=1200.0,
        status="draft"
    )
    
    # Add relationships
    quote.product_specs.append(product_spec)
    quote.communication_contexts.append(comm_context)
    
    db.add(quote)
    db.commit()
    db.refresh(quote)

    assert quote.id is not None
    assert quote.title == f"Test Quote {unique_id}"
    assert quote.reference_number == f"QT-{unique_id}"
    assert isinstance(quote.created_at, datetime)
    assert isinstance(quote.updated_at, datetime)
    assert len(quote.product_specs) == 1
    assert len(quote.communication_contexts) == 1

def test_product_specification_model(db):
    unique_id = str(uuid.uuid4())[:8]
    product_spec = ProductSpecification(
        description=f"Test Product {unique_id}",
        profile_type="Standard",
        alloy="Steel",
        weight_per_meter=2.5,
        total_length=100.0,
        surface_treatment="Anodized",
        machining_complexity="Medium"
    )
    db.add(product_spec)
    db.commit()
    db.refresh(product_spec)

    assert product_spec.id is not None
    assert product_spec.description == f"Test Product {unique_id}"
    assert isinstance(product_spec.created_at, datetime)
    assert isinstance(product_spec.updated_at, datetime)

def test_communication_context_model(db):
    unique_id = str(uuid.uuid4())[:8]
    comm_context = CommunicationContext(
        context_text=f"Test context {unique_id}",
        extracted_urgency="high",
        custom_requests="Fast delivery",
        past_agreements="Previous discounts"
    )
    db.add(comm_context)
    db.commit()
    db.refresh(comm_context)

    assert comm_context.id is not None
    assert comm_context.context_text == f"Test context {unique_id}"
    assert isinstance(comm_context.created_at, datetime)
    assert isinstance(comm_context.updated_at, datetime)

def test_customer_quotes_relationship(db, sample_customer, sample_quote):
    db.refresh(sample_customer)
    assert len(sample_customer.quotes) > 0
    assert sample_customer.quotes[0].id == sample_quote.id

def test_quote_product_specs_relationship(db, sample_quote, sample_product_spec):
    db.refresh(sample_quote)
    assert len(sample_quote.product_specs) > 0
    assert sample_quote.product_specs[0].description == sample_product_spec["description"]

def test_quote_communication_context_relationship(db, sample_quote, sample_communication_context):
    db.refresh(sample_quote)
    assert len(sample_quote.communication_contexts) > 0
    assert sample_quote.communication_contexts[0].context_text == sample_communication_context["context_text"] 