// Common interfaces used across the application
export interface Customer {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductSpecification {
  id?: string;
  quote_id: string;
  description: string;
  profile_type: string;
  alloy: '6060' | '6063' | '6082';
  weight_per_meter: number;
  total_length: number;
  surface_treatment: 'anodized' | 'painted' | 'raw';
  machining_complexity: 'low' | 'medium' | 'high';
}

export interface CommunicationContext {
  id?: string;
  quote_id?: string;
  context_text: string;
  extracted_urgency: string;
  custom_requests: string;
  past_agreements: string;
}

export interface Quote {
  id: string;
  title: string;
  status: string;
  final_price: number | null;
  predicted_price: number | null;
  created_at: string;
  updated_at: string;
  customer_id: number;
  reference_number: string;
  validity_date: string;
  product_specs: ProductSpecification[];
  communication_contexts: CommunicationContext[];
  customer?: Customer;
}

export interface QuoteDto {
  id: string;
  title: string;
  status: string;
  final_price: number | null;
  predicted_price: number | null;
  created_at: string;
  updated_at: string;
  customer_id: number;
  reference_number: string;
  validity_date: string;
  product_specs: ProductSpecification[];
  communication_contexts: CommunicationContext[];
}

// DTOs (Data Transfer Objects)
export interface CustomerDto {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface CreateCustomerDto extends CustomerDto {}

export interface UpdateCustomerDto extends Partial<CustomerDto> {}

export interface CreateQuoteDto {
  title: string;
  reference_number: string;
  validity_date: string;
  customer_id: number;
  predicted_price: number | null;
  final_price: number | null;
  status: string;
  product_specs: Omit<ProductSpecification, 'id' | 'quote_id'>;
  communication_context: Omit<CommunicationContext, 'id' | 'quote_id'>;
}

export interface UpdateQuoteDto extends Partial<CreateQuoteDto> {}

// Common utility types
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface ApiQuote {
  id: string;
  title: string;
  status: string;
  final_price: number | null;
  predicted_price: number | null;
  created_at: string;
  updated_at: string;
  customer_id: number;
  reference_number: string;
  validity_date: string;
  product_specs: ProductSpecification[];
  communication_contexts: CommunicationContext[];
} 