export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export const rules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      return emailRegex.test(value);
    },
    message,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    test: (value) => {
      const phoneRegex = /^\+?[\d\s-()]{10,}$/;
      return phoneRegex.test(value);
    },
    message,
  }),

  minLength: (length: number, message = `Must be at least ${length} characters`): ValidationRule => ({
    test: (value) => String(value).length >= length,
    message,
  }),

  maxLength: (length: number, message = `Must be no more than ${length} characters`): ValidationRule => ({
    test: (value) => String(value).length <= length,
    message,
  }),

  number: (message = 'Must be a valid number'): ValidationRule => ({
    test: (value) => !isNaN(Number(value)),
    message,
  }),

  positive: (message = 'Must be a positive number'): ValidationRule => ({
    test: (value) => Number(value) > 0,
    message,
  }),
};

export const validateField = (value: any, fieldRules: ValidationRule[]): string => {
  for (const rule of fieldRules) {
    if (!rule.test(value)) {
      return rule.message;
    }
  }
  return '';
};

export const validateForm = (values: Record<string, any>, validationRules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(validationRules).forEach((field) => {
    const fieldRules = validationRules[field];
    const error = validateField(values[field], fieldRules);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}; 