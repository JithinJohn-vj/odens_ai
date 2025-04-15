from datetime import datetime
import random
import string
import os
from fastapi import File, UploadFile, HTTPException
from fastapi.responses import FileResponse

def generate_reference_number():
    """Generate a unique reference number for quotes"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"QT-{timestamp}-{random_str}"

@router.post("/", response_model=QuoteResponse)
async def create_quote(quote: QuoteCreate, db: Session = Depends(get_db)):
    """Create a new quote"""
    # Generate a unique reference number
    quote.reference_number = generate_reference_number()
    
    # Create the quote
    db_quote = Quote(
        title=quote.title,
        reference_number=quote.reference_number,
        validity_date=quote.validity_date,
        customer_id=quote.customer_id,
        predicted_price=quote.predicted_price,
        final_price=quote.final_price,
        status=quote.status
    )
    db.add(db_quote)
    db.flush()  # Flush to get the quote ID
    
    # Create communication context
    if quote.communication_context:
        context = CommunicationContext(
            quote_id=db_quote.id,
            context_text=quote.communication_context.context_text,
            extracted_urgency=quote.communication_context.extracted_urgency,
            custom_requests=quote.communication_context.custom_requests,
            past_agreements=quote.communication_context.past_agreements
        )
        db.add(context)
    
    # Create product specifications
    if quote.product_specifications:
        specs = ProductSpecification(
            quote_id=db_quote.id,
            description=quote.product_specifications.description,
            profile_type=quote.product_specifications.profile_type,
            alloy=quote.product_specifications.alloy,
            weight_per_meter=quote.product_specifications.weight_per_meter,
            total_length=quote.product_specifications.total_length,
            surface_treatment=quote.product_specifications.surface_treatment,
            machining_complexity=quote.product_specifications.machining_complexity
        )
        db.add(specs)
    
    db.commit()
    db.refresh(db_quote)
    return db_quote

@router.get("/files/download/{file_path:path}")
async def download_file(file_path: str):
    """Download a file"""
    try:
        # Ensure the file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get the file extension to determine content type
        file_extension = os.path.splitext(file_path)[1].lower()
        content_type = {
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }.get(file_extension, 'application/octet-stream')
        
        return FileResponse(
            file_path,
            media_type=content_type,
            filename=os.path.basename(file_path)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 