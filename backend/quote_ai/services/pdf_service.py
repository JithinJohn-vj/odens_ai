from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime
import PyPDF2
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

class PDFService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30
        ))
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=20
        ))

    def extract_text(self, file_path: str) -> Optional[str]:
        """Extract text content from a PDF file."""
        try:
            if not os.path.exists(file_path):
                logger.error(f"File not found for extraction: {file_path}")
                return None

            text = ""
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            logger.info(f"Successfully extracted text from PDF: {file_path}")
            return text

        except Exception as e:
            logger.error(f"Error during text extraction for {file_path}: {str(e)}")
            return None

    def generate_quote_pdf(self, quote_data: dict, output_path: str):
        """Generate a PDF quote document"""
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        story = []
        
        # Add title
        story.append(Paragraph("QUOTE", self.styles['CustomTitle']))
        story.append(Spacer(1, 20))

        # Add quote details
        quote_details = [
            ["Quote Reference:", quote_data['reference_number']],
            ["Date:", datetime.now().strftime("%Y-%m-%d")],
            ["Valid Until:", quote_data['validity_date'] or "Not specified"],
            ["Status:", quote_data['status'].upper()]
        ]
        
        quote_table = Table(quote_details, colWidths=[2*inch, 3*inch])
        quote_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(quote_table)
        story.append(Spacer(1, 20))

        # Add customer details
        story.append(Paragraph("Customer Details", self.styles['CustomSubtitle']))
        customer_details = [
            ["Company:", quote_data['customer']['company_name']],
            ["Contact Person:", quote_data['customer']['contact_person']],
            ["Email:", quote_data['customer']['email']]
        ]
        
        customer_table = Table(customer_details, colWidths=[2*inch, 3*inch])
        customer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(customer_table)
        story.append(Spacer(1, 20))

        # Add product specifications
        story.append(Paragraph("Product Specifications", self.styles['CustomSubtitle']))
        product_specs = [
            ["Description:", quote_data['product_specs'].get('description', 'Not specified')],
            ["Profile Type:", quote_data['product_specs'].get('profile_type', 'Not specified')],
            ["Alloy:", quote_data['product_specs'].get('alloy', 'Not specified')],
            ["Weight per meter:", f"{quote_data['product_specs'].get('weight_per_meter', 'Not specified')} kg"],
            ["Total Length:", f"{quote_data['product_specs'].get('total_length', 'Not specified')} m"],
            ["Surface Treatment:", quote_data['product_specs'].get('surface_treatment', 'Not specified')],
            ["Machining Complexity:", quote_data['product_specs'].get('machining_complexity', 'Not specified')]
        ]
        
        product_table = Table(product_specs, colWidths=[2*inch, 3*inch])
        product_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(product_table)
        story.append(Spacer(1, 20))

        # Add pricing
        story.append(Paragraph("Pricing", self.styles['CustomSubtitle']))
        pricing_data = [
            ["Predicted Price:", f"{quote_data.get('predicted_price', 'Not specified')} SEK"],
            ["Final Price:", f"{quote_data.get('final_price', 'Not specified')} SEK"]
        ]
        
        pricing_table = Table(pricing_data, colWidths=[2*inch, 3*inch])
        pricing_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(pricing_table)
        story.append(Spacer(1, 20))

        # Add communication context
        if quote_data.get('communication_context', {}).get('context_text'):
            story.append(Paragraph("Communication Context", self.styles['CustomSubtitle']))
            story.append(Paragraph(quote_data['communication_context']['context_text'], self.styles['Normal']))
            story.append(Spacer(1, 20))

        # Add terms and conditions
        story.append(Paragraph("Terms and Conditions", self.styles['CustomSubtitle']))
        terms = [
            "1. Prices are exclusive of VAT unless otherwise stated.",
            "2. Payment terms: 30 days from invoice date.",
            "3. Delivery time will be confirmed upon order.",
            "4. This quote is valid until the date specified above.",
            "5. All specifications are subject to our standard terms and conditions."
        ]
        
        for term in terms:
            story.append(Paragraph(term, self.styles['Normal']))
            story.append(Spacer(1, 8))

        # Build the PDF
        doc.build(story) 