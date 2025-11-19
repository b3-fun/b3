export interface ValidationResult {
  isValid: boolean;
  error?: string;
  cleaned?: string;
}

export interface StringValidationOptions {
  // Required/Optional
  required?: boolean;
  defaultValue?: () => string; // Generator for default (e.g., UUID)

  // Length constraints
  minLength?: number;
  maxLength?: number;

  // Character constraints
  pattern?: RegExp;
  patternErrorMessage?: string;

  // Pre-processing
  trim?: boolean; // Default: true
  toLowerCase?: boolean;
  toUpperCase?: boolean;

  // Custom validation
  customValidator?: (value: string) => { valid: boolean; error?: string };
}

/**
 * Generic string validator with configurable rules
 */
export function validateString(value: string | undefined, options: StringValidationOptions): ValidationResult {
  const {
    required = false,
    defaultValue,
    minLength,
    maxLength,
    pattern,
    patternErrorMessage,
    trim = true,
    toLowerCase = false,
    toUpperCase = false,
    customValidator,
  } = options;

  // Handle empty/undefined
  if (!value || (trim && value.trim() === "")) {
    if (required && !defaultValue) {
      return { isValid: false, error: "This field is required" };
    }
    if (defaultValue) {
      return { isValid: true, cleaned: defaultValue() };
    }
    return { isValid: true, cleaned: undefined };
  }

  // Pre-processing
  let cleaned = value;
  if (trim) cleaned = cleaned.trim();
  if (toLowerCase) cleaned = cleaned.toLowerCase();
  if (toUpperCase) cleaned = cleaned.toUpperCase();

  // Length validation
  if (minLength !== undefined && cleaned.length < minLength) {
    return {
      isValid: false,
      error: `Minimum length is ${minLength} characters`,
    };
  }

  if (maxLength !== undefined && cleaned.length > maxLength) {
    return {
      isValid: false,
      error: `Maximum length is ${maxLength} characters`,
    };
  }

  // Pattern validation
  if (pattern && !pattern.test(cleaned)) {
    return {
      isValid: false,
      error: patternErrorMessage || "Invalid format",
    };
  }

  // Custom validation
  if (customValidator) {
    const customResult = customValidator(cleaned);
    if (!customResult.valid) {
      return { isValid: false, error: customResult.error };
    }
  }

  return { isValid: true, cleaned };
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_DASH_UNDERSCORE: /^[a-zA-Z0-9_-]+$/,
  ALPHANUMERIC_WITH_SAFE_CHARS: /^[a-zA-Z0-9_.\-]+$/,
  SAFE_IDENTIFIER: /^[a-zA-Z0-9_.\-]+$/, // For IDs, references
  NO_CONTROL_CHARS: /^[^\x00-\x1F\x7F]+$/,
  URL_SAFE: /^[a-zA-Z0-9_.\-~]+$/,
  NUMERIC: /^\d+$/,
  HEX: /^[0-9a-fA-F]+$/,
} as const;

/**
 * Pre-configured validators for common use cases
 */
export const Validators = {
  /**
   * Validates client reference IDs (alphanumeric + safe chars)
   * Auto-generates UUID if not provided
   */
  clientReferenceId: (value?: string) =>
    validateString(value, {
      required: false,
      maxLength: 255,
      pattern: ValidationPatterns.SAFE_IDENTIFIER,
      patternErrorMessage: "Only letters, numbers, hyphens, underscores, and dots allowed",
      defaultValue: () => crypto.randomUUID(),
      trim: true,
      customValidator: val => {
        // Additional security checks
        const dangerous = /('|"|;|--|\/\*|\*\/|<|>|script)/i;
        if (dangerous.test(val)) {
          return {
            valid: false,
            error: "Contains potentially dangerous characters",
          };
        }
        return { valid: true };
      },
    }),

  /**
   * Validates alphanumeric strings (letters and numbers only)
   */
  alphanumeric: (value?: string, required = false) =>
    validateString(value, {
      required,
      pattern: ValidationPatterns.ALPHANUMERIC,
      patternErrorMessage: "Only letters and numbers allowed",
      trim: true,
    }),

  /**
   * Validates wallet addresses (hex format)
   */
  walletAddress: (value?: string, required = true) =>
    validateString(value, {
      required,
      minLength: 42,
      maxLength: 42,
      pattern: /^0x[a-fA-F0-9]{40}$/,
      patternErrorMessage: "Invalid wallet address format",
      trim: true,
      toLowerCase: true,
    }),

  /**
   * Validates order IDs (UUID format)
   */
  orderId: (value?: string) =>
    validateString(value, {
      required: false,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      patternErrorMessage: "Invalid order ID format",
      trim: true,
      toLowerCase: true,
    }),

  /**
   * Validates URL-safe strings
   */
  urlSafe: (value?: string, maxLength = 255) =>
    validateString(value, {
      maxLength,
      pattern: ValidationPatterns.URL_SAFE,
      patternErrorMessage: "Contains invalid URL characters",
      trim: true,
    }),

  /**
   * Validates safe identifiers (no injection risks)
   */
  safeIdentifier: (value?: string, required = false) =>
    validateString(value, {
      required,
      maxLength: 255,
      pattern: ValidationPatterns.SAFE_IDENTIFIER,
      patternErrorMessage: "Invalid identifier format",
      customValidator: val => {
        // Additional security checks
        const dangerous = /('|"|;|--|\/\*|\*\/|<|>|script)/i;
        if (dangerous.test(val)) {
          return {
            valid: false,
            error: "Contains potentially dangerous characters",
          };
        }
        return { valid: true };
      },
      trim: true,
    }),
};
