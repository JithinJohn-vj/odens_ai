from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Body
from fastapi.responses import Response, JSONResponse, FileResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from quote_ai.core import schemas, models
from quote_ai.db.database import get_db
from quote_ai.services.ai_service import AIService
from quote_ai.services.pdf_service import PDFService
from quote_ai.services.file_service import FileService
from quote_ai.utils.config import get_settings
import os
import uuid
import logging
from datetime import datetime
from pydantic import BaseModel

# Define request body model for file processing
class FileProcessRequest(BaseModel):
    file_path: str

# Add a schema for the response
class FileProcessResponse(BaseModel):
    file_path: str
    extracted_context: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

router = APIRouter(
    prefix="/quotes",
    tags=["quotes"]
)

def get_ai_service():
    # Call get_settings() to get the actual Settings instance
    actual_settings = get_settings()
    return AIService(settings=actual_settings)

def get_pdf_service():
    return PDFService()

def get_file_service():
    # Ensure FileService is instantiated correctly, e.g., with settings
    # file_upload_dir = settings.file_upload_dir if hasattr(settings, 'file_upload_dir') else "uploads"
    # return FileService(upload_dir=file_upload_dir)
    # Assuming default "uploads" is fine for now
    return FileService()

@router.post("/", response_model=schemas.Quote)
def create_quote(
    quote: schemas.QuoteCreate,
    db: Session = Depends(get_db)
):
    # Create product specification
    db_product_spec = models.ProductSpecification(**quote.product_specs.model_dump())
    
    # Create communication context
    db_comm_context = models.CommunicationContext(**quote.communication_context.model_dump())
    
    # Create quote
    quote_data = quote.model_dump(exclude={'product_specs', 'communication_context'})
    db_quote = models.Quote(**quote_data)
    
    # Add relationships
    db.add(db_product_spec)
    db.add(db_comm_context)
    db.add(db_quote)
    
    # Commit to get IDs
    db.commit()
    
    # Set relationships
    db_product_spec.quote_id = db_quote.id
    db_comm_context.quote_id = db_quote.id
    
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.get("/", response_model=List[schemas.Quote])
def read_quotes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    quotes = db.query(models.Quote).offset(skip).limit(limit).all()
    return quotes

@router.get("/{quote_id}", response_model=schemas.Quote)
def read_quote(
    quote_id: str,
    db: Session = Depends(get_db)
):
    try:
        quote_id_int = int(quote_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quote ID format")
    
    # First, check if the customer exists
    db_quote = db.query(models.Quote).filter(models.Quote.id == quote_id_int).first()
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Log customer ID
    logging.info(f"Quote {quote_id} has customer_id: {db_quote.customer_id}")
    
    # Check if customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == db_quote.customer_id).first()
    logging.info(f"Customer lookup result: {customer is not None}")
    if customer:
        logging.info(f"Found customer: {customer.company_name}")
    
    # Now get the quote with all relationships
    db_quote = db.query(models.Quote)\
        .options(
            joinedload(models.Quote.product_specs),
            joinedload(models.Quote.communication_contexts),
            joinedload(models.Quote.customer)
        )\
        .filter(models.Quote.id == quote_id_int)\
        .first()
        
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Log the final quote data
    logging.info(f"Quote customer data: {db_quote.customer}")
    return db_quote

@router.put("/{quote_id}", response_model=schemas.Quote)
def update_quote(
    quote_id: str,
    quote: schemas.QuoteUpdate,
    db: Session = Depends(get_db)
):
    try:
        quote_id_int = int(quote_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quote ID format")
    db_quote = db.query(models.Quote).filter(models.Quote.id == quote_id_int).first()
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    update_data = quote.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_quote, key, value)
    
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.delete("/{quote_id}")
def delete_quote(
    quote_id: str,
    db: Session = Depends(get_db)
):
    try:
        quote_id_int = int(quote_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quote ID format")
    db_quote = db.query(models.Quote).filter(models.Quote.id == quote_id_int).first()
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    db.delete(db_quote)
    db.commit()
    return {"message": "Quote deleted successfully"}

@router.post("/predict-price", response_model=schemas.PricePrediction)
def predict_price(
    specs: schemas.ProductSpecificationBase
):
    ai_service = get_ai_service()
    prediction = ai_service.predict_price(specs.model_dump())
    return prediction

@router.get("/{quote_id}/pdf")
def generate_quote_pdf(quote_id: str, db: Session = Depends(get_db)):
    try:
        quote_id_int = int(quote_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quote ID format")
    
    # Get quote with all relationships
    db_quote = db.query(models.Quote)\
        .options(
            joinedload(models.Quote.product_specs),
            joinedload(models.Quote.communication_contexts),
            joinedload(models.Quote.customer)
        )\
        .filter(models.Quote.id == quote_id_int)\
        .first()
    
    if db_quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Get customer data if available
    customer_data = {}
    if db_quote.customer:
        customer_data = {
            "company_name": db_quote.customer.company_name,
            "contact_person": db_quote.customer.contact_person,
            "email": db_quote.customer.email
        }
    
    # Get product specifications (handle as list)
    product_specs = {}
    if db_quote.product_specs and len(db_quote.product_specs) > 0:
        spec = db_quote.product_specs[0]  # Get the first specification
        product_specs = {
            "description": spec.description,
            "profile_type": spec.profile_type,
            "alloy": spec.alloy,
            "weight_per_meter": spec.weight_per_meter,
            "total_length": spec.total_length,
            "surface_treatment": spec.surface_treatment,
            "machining_complexity": spec.machining_complexity
        }

    # Get communication context (handle as list)
    communication_context = {}
    if db_quote.communication_contexts and len(db_quote.communication_contexts) > 0:
        context = db_quote.communication_contexts[0]  # Get the first context
        communication_context = {
            "context_text": context.context_text
        }

    # Get AI service for price prediction
    ai_service = get_ai_service()
    
    # Predict price if we have product specifications
    predicted_price = None
    final_price = None
    if product_specs:
        try:
            price_prediction = ai_service.predict_price(product_specs)
            predicted_price = price_prediction['predicted_price']
            confidence = price_prediction['confidence']
            final_price = predicted_price * (1 + (1 - confidence) * 0.1)  # Add 10% margin for low confidence
        except Exception as e:
            logging.error(f"Error predicting price: {str(e)}")
    
    # Convert quote to dictionary
    quote_data = {
        "reference_number": db_quote.reference_number,
        "validity_date": db_quote.validity_date.isoformat() if db_quote.validity_date else None,
        "status": db_quote.status,
        "customer": customer_data,
        "product_specs": product_specs,
        "communication_context": communication_context,
        "predicted_price": predicted_price,
        "final_price": final_price
    }
    
    # Generate PDF
    pdf_service = get_pdf_service()
    output_path = f"temp/{quote_id}.pdf"
    os.makedirs("temp", exist_ok=True)  # Ensure temp directory exists
    pdf_service.generate_quote_pdf(quote_data, output_path)
    
    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename=f"quote_{quote_id}.pdf"
    )

@router.post("/generate", response_model=schemas.QuoteGenerationResponse)
async def generate_quote(
    quote_data: schemas.QuoteGenerationRequest,
    background_tasks: BackgroundTasks
):
    ai_service = get_ai_service()
    pdf_service = get_pdf_service()
    
    try:
        # Generate quote text
        quote_text = await ai_service.generate_quote_text(quote_data.dict())
        
        # Generate PDF in background
        background_tasks.add_task(
            pdf_service.generate_pdf,
            quote_data.dict(),
            quote_text
        )
        
        return {
            "status": "success",
            "message": "Quote generation started",
            "quote_text": quote_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/files/upload", response_model=dict)
async def upload_file(file: UploadFile = File(...), file_service: FileService = Depends(get_file_service)):
    # Keep the simple upload endpoint, maybe modify later if needed
    file_path = await file_service.save_uploaded_file(file)
    if not file_path:
        raise HTTPException(status_code=400, detail="File type not allowed or save failed.")
    return {"file_path": file_path, "status": "success"} # Return only path

@router.post("/files/process", response_model=FileProcessResponse)
async def process_uploaded_file(
    request_data: FileProcessRequest,
    file_service: FileService = Depends(get_file_service),
    ai_service: AIService = Depends(get_ai_service)
):
    """Process an uploaded file to extract text and AI context."""
    try:
        # Access file_path from the request_data model
        file_path = request_data.file_path
        
        # 1. Extract text using FileService
        extracted_text = file_service.extract_text_from_file(file_path)

        if extracted_text is None:
            if not os.path.exists(file_path):
                return FileProcessResponse(file_path=file_path, error="File not found at the specified path.")
            else:
                return FileProcessResponse(file_path=file_path, error="Failed to extract text or unsupported file type.")

        if not extracted_text.strip():
            return FileProcessResponse(file_path=file_path, error="No text content found in the file.")

        # 2. Extract context using AIService
        try:
            extracted_context = await ai_service.extract_context(extracted_text)
            return FileProcessResponse(file_path=file_path, extracted_context=extracted_context)
        except HTTPException as http_exc:
            logging.error(f"AI Service HTTPException during context extraction for {file_path}: {http_exc.detail}")
            return FileProcessResponse(file_path=file_path, error=f"AI processing error: {http_exc.detail}")
        except Exception as e:
            logging.error(f"Unexpected error during AI context extraction for {file_path}: {str(e)}")
            return FileProcessResponse(file_path=file_path, error="An unexpected error occurred during AI processing.")
    except Exception as e:
        logging.error(f"Error processing file {file_path}: {str(e)}")
        return FileProcessResponse(file_path=file_path, error=f"Error processing file: {str(e)}")

@router.get("/files/download/{file_path:path}") # Use path converter
def download_file(file_path: str):
    # Basic implementation - adjust path resolution if needed
    # WARNING: This allows downloading *any* path if not secured properly!
    # Consider adding validation/scoping to the upload directory
    if not os.path.exists(file_path):
         # Avoid exposing full path in error
         # Check if it's within the expected upload dir first
         # file_service = get_file_service()
         # expected_path = os.path.abspath(os.path.join(file_service.upload_dir, os.path.basename(file_path)))
         # if not os.path.exists(expected_path) or not expected_path.startswith(os.path.abspath(file_service.upload_dir)):
         #      raise HTTPException(status_code=404, detail="File not found")
         # Simplified check for now:
         raise HTTPException(status_code=404, detail="File not found")
         
    # Determine content type
    _, ext = os.path.splitext(file_path.lower())
    # Use a mapping for common types
    content_type_map = {
        '.txt': 'text/plain',
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
    }
    content_type = content_type_map.get(ext, 'application/octet-stream')

    return FileResponse(
        path=file_path,
        media_type=content_type,
        filename=os.path.basename(file_path)
    )

@router.get("/files/{quote_id}", response_model=List[schemas.FileUploadResponse])
def get_quote_files(quote_id: int):
    file_service = get_file_service()
    return file_service.get_quote_files(quote_id)

@router.delete("/files/{filename}")
def delete_file(filename: str):
    file_service = get_file_service()
    try:
        file_service.delete_file(filename)
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-file")
async def process_quote_file(
    file_path: str = Body(...),
    product_specs: dict = Body(...),
    db: Session = Depends(get_db)
):
    try:
        # Get AI service for context extraction
        ai_service = get_ai_service()
        
        # Extract text from PDF
        pdf_service = get_pdf_service()
        text = pdf_service.extract_text(file_path)
        
        if not text:
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Extract context using both PDF text and product specifications
        context = await ai_service.extract_context(text, product_specs)
        
        return {
            "file_path": file_path,
            "extracted_context": context
        }
    except Exception as e:
        logging.error(f"Error processing quote file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 