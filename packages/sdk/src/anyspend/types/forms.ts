/**
 * Checkout form schema types
 *
 * Merchants define forms using a JSON schema to collect customer information
 * during checkout (email, shipping address, discount codes, arbitrary fields).
 */

export interface CheckoutFormField {
  /** Unique field identifier */
  id: string;
  /** Field type */
  type: "text" | "email" | "phone" | "textarea" | "select" | "number" | "checkbox" | "address";
  /** Display label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required. Default: false */
  required?: boolean;
  /** Default value */
  defaultValue?: string;
  /** Options for "select" type fields */
  options?: { label: string; value: string }[];
  /** Validation rules */
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface CheckoutFormSchema {
  fields: CheckoutFormField[];
}

export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  /** Amount in wei */
  amount: string;
  /** e.g. "5-7 business days" */
  estimated_days?: string;
}

export interface DiscountResult {
  valid: boolean;
  discount_type?: "percentage" | "fixed";
  discount_value?: string;
  /** Computed discount amount in wei */
  discount_amount?: string;
  /** Final amount after discount in wei */
  final_amount?: string;
  error?: string;
}

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/**
 * Props passed to custom form components or the checkoutForm slot
 */
export interface CheckoutFormComponentProps {
  /** Call this when the form is submitted / values change */
  onSubmit: (data: Record<string, unknown>) => void;
  /** Call to signal whether the form is currently valid */
  onValidationChange: (isValid: boolean) => void;
  /** Current form data */
  formData: Record<string, unknown>;
  /** Update form data */
  setFormData: (data: Record<string, unknown>) => void;
}

/**
 * Props for shipping selector slot
 */
export interface ShippingSelectorSlotProps {
  options: ShippingOption[];
  selectedId: string | null;
  onSelect: (option: ShippingOption) => void;
}

/**
 * Props for discount input slot
 */
export interface DiscountInputSlotProps {
  onApply: (code: string) => Promise<DiscountResult>;
  appliedDiscount: DiscountResult | null;
  onRemove: () => void;
  loading: boolean;
}
