import os
from fastapi import UploadFile
from typing import Optional, Tuple
from datetime import datetime
import PyPDF2
import logging

logger = logging.getLogger(__name__)

class FileService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        self.allowed_types = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.txt': 'text/plain'  # Add text/plain for testing
        }
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        
        # Create upload directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)

    async def save_uploaded_file(self, file: UploadFile, quote_id: Optional[int] = None) -> Optional[str]:
        """Save an uploaded file and return its path. quote_id is optional initially."""
        try:
            _, ext = os.path.splitext(file.filename.lower())
            if ext not in self.allowed_types:
                logger.warning(f"File type {ext} not allowed for {file.filename}")
                return None
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # Use a temporary prefix or include quote_id if available
            prefix = f"quote_{quote_id}" if quote_id else "temp"
            filename = f"{prefix}_{timestamp}{ext}"
            file_path = os.path.join(self.upload_dir, filename)
            
            content = await file.read()
            if len(content) > self.max_file_size:
                 logger.warning(f"File {file.filename} exceeds max size {self.max_file_size} bytes")
                 return None
                 
            with open(file_path, "wb") as f:
                f.write(content)
            
            logger.info(f"Successfully saved file to {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Error saving file {file.filename}: {str(e)}")
            return None

    def extract_text_from_file(self, file_path: str) -> Optional[str]:
        """Extract text content from PDF or TXT files."""
        try:
            if not os.path.exists(file_path):
                logger.error(f"File not found for extraction: {file_path}")
                return None

            _, ext = os.path.splitext(file_path.lower())
            text = ""

            if ext == '.pdf':
                try:
                    with open(file_path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        for page in reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text += page_text + "\n"
                    logger.info(f"Extracted text from PDF: {file_path}")
                except Exception as pdf_error:
                    logger.error(f"Error reading PDF file {file_path}: {pdf_error}")
                    return None # Or return specific error message
            elif ext == '.txt':
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        text = f.read()
                    logger.info(f"Extracted text from TXT: {file_path}")
                except Exception as txt_error:
                     logger.error(f"Error reading TXT file {file_path}: {txt_error}")
                     return None
            else:
                logger.warning(f"Text extraction not supported for file type: {ext}")
                return None # Or indicate unsupported type
            
            return text

        except Exception as e:
            logger.error(f"Error during text extraction for {file_path}: {str(e)}")
            return None

    def get_file_path(self, filename: str) -> Optional[Tuple[str, str]]:
        """Get the full path and content type of a file"""
        file_path = os.path.join(self.upload_dir, filename)
        if os.path.exists(file_path):
            # Determine content type based on file extension
            _, ext = os.path.splitext(filename.lower())
            content_type = self.allowed_types.get(ext, 'application/octet-stream')
            return file_path, content_type
        return None

    def delete_file(self, filename: str) -> bool:
        """Delete a file"""
        try:
            file_path = os.path.join(self.upload_dir, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {str(e)}")
            return False

    def list_files(self, quote_id: int) -> list:
        """List all files associated with a quote"""
        try:
            files = []
            for filename in os.listdir(self.upload_dir):
                if filename.startswith(f"quote_{quote_id}_"):
                    files.append({
                        'filename': filename,
                        'path': os.path.join(self.upload_dir, filename),
                        'size': os.path.getsize(os.path.join(self.upload_dir, filename))
                    })
            return files
        except Exception as e:
            print(f"Error listing files: {str(e)}")
            return [] 