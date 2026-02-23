"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import { useCallback, useMemo, useRef, useState } from "react";
import type {
  CheckoutFormSchema,
  CheckoutFormComponentProps,
  AddressData,
  ShippingOption,
  DiscountResult,
} from "../../../types/forms";
import { CheckoutFormFieldComponent } from "./CheckoutFormField";
import { AddressForm } from "./AddressForm";
import { ShippingSelector } from "./ShippingSelector";
import { DiscountCodeInput } from "./DiscountCodeInput";
import type { AnySpendCheckoutClasses } from "../types/classes";

interface CheckoutFormPanelProps {
  /** JSON form definition */
  formSchema?: CheckoutFormSchema | null;
  /** Custom React component to render instead of schema-based form */
  formComponent?: React.ComponentType<CheckoutFormComponentProps>;
  /** Shipping options */
  shippingOptions?: ShippingOption[] | null;
  /** Whether to collect a shipping address */
  collectShippingAddress?: boolean;
  /** Enable discount code input */
  enableDiscountCode?: boolean;
  /** Validate a discount code */
  validateDiscount?: (code: string) => Promise<DiscountResult>;
  /** Token info for display */
  tokenSymbol?: string;
  tokenDecimals?: number;
  /** CSS class overrides */
  classes?: AnySpendCheckoutClasses;
  /** Current form data (lifted state) */
  formData: Record<string, unknown>;
  /** Update form data */
  onFormDataChange: (data: Record<string, unknown>) => void;
  /** Shipping selection */
  selectedShipping: ShippingOption | null;
  onShippingChange: (option: ShippingOption) => void;
  /** Discount state */
  appliedDiscount: DiscountResult | null;
  onDiscountApplied: (result: DiscountResult) => void;
  onDiscountRemoved: () => void;
  /** Shipping address */
  shippingAddress: AddressData;
  onShippingAddressChange: (address: AddressData) => void;
  /** Slot overrides */
  checkoutFormSlot?: (props: CheckoutFormComponentProps) => React.ReactNode;
}

const emptyAddress: AddressData = { street: "", city: "", state: "", zip: "", country: "" };

export function CheckoutFormPanel({
  formSchema,
  formComponent: FormComponent,
  shippingOptions,
  collectShippingAddress,
  enableDiscountCode,
  validateDiscount,
  tokenSymbol,
  tokenDecimals,
  classes,
  formData,
  onFormDataChange,
  selectedShipping,
  onShippingChange,
  appliedDiscount,
  onDiscountApplied,
  onDiscountRemoved,
  shippingAddress,
  onShippingAddressChange,
  checkoutFormSlot,
}: CheckoutFormPanelProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasFormFields = formSchema && formSchema.fields.length > 0;
  const hasShipping = shippingOptions && shippingOptions.length > 0;
  const hasAnyContent =
    hasFormFields || FormComponent || checkoutFormSlot || hasShipping || collectShippingAddress || enableDiscountCode;

  // All hooks must be called before any early returns
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const handleFieldChange = useCallback(
    (id: string, value: unknown) => {
      onFormDataChange({ ...formDataRef.current, [id]: value });
      setErrors(prev => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [onFormDataChange],
  );

  const handleFormSubmit = useCallback(
    (data: Record<string, unknown>) => {
      onFormDataChange(data);
    },
    [onFormDataChange],
  );

  const handleValidationChange = useCallback((_isValid: boolean) => {
    // Validation is handled internally via errors state
  }, []);

  const handleDiscountApply = useCallback(
    async (code: string): Promise<DiscountResult> => {
      if (!validateDiscount) {
        return { valid: false, error: "Discount validation not available" };
      }
      const result = await validateDiscount(code);
      if (result.valid) {
        onDiscountApplied(result);
      }
      return result;
    },
    [validateDiscount, onDiscountApplied],
  );

  // Separate address fields from regular fields
  const { regularFields, addressFields } = useMemo(() => {
    if (!formSchema) return { regularFields: [], addressFields: [] };
    return {
      regularFields: formSchema.fields.filter(f => f.type !== "address"),
      addressFields: formSchema.fields.filter(f => f.type === "address"),
    };
  }, [formSchema]);

  if (!hasAnyContent) return null;

  // Shared shipping + discount section
  const shippingAndDiscount = (
    <>
      {hasShipping && shippingOptions && (
        <ShippingSelector
          options={shippingOptions}
          selectedId={selectedShipping?.id || null}
          onSelect={onShippingChange}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
        />
      )}
      {enableDiscountCode && validateDiscount && (
        <DiscountCodeInput
          onApply={handleDiscountApply}
          appliedDiscount={appliedDiscount}
          onRemove={onDiscountRemoved}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
        />
      )}
    </>
  );

  // Render custom form slot if provided
  if (checkoutFormSlot) {
    return (
      <div className={cn("anyspend-form-panel space-y-4", classes?.formPanel)}>
        <div className="anyspend-form-slot">
          {checkoutFormSlot({
            onSubmit: handleFormSubmit,
            onValidationChange: handleValidationChange,
            formData,
            setFormData: onFormDataChange,
          })}
        </div>
        {shippingAndDiscount}
      </div>
    );
  }

  // Render custom form component if provided
  if (FormComponent) {
    return (
      <div className={cn("anyspend-form-panel space-y-4", classes?.formPanel)}>
        <div className="anyspend-form-component">
          <FormComponent
            onSubmit={handleFormSubmit}
            onValidationChange={handleValidationChange}
            formData={formData}
            setFormData={onFormDataChange}
          />
        </div>
        {shippingAndDiscount}
      </div>
    );
  }

  // Schema-based form rendering
  return (
    <div className={cn("anyspend-form-panel space-y-4", classes?.formPanel)}>
      {/* Regular form fields */}
      {regularFields.length > 0 && (
        <div className="anyspend-form-fields space-y-3">
          {regularFields.map(field => (
            <CheckoutFormFieldComponent
              key={field.id}
              field={field}
              value={formData[field.id]}
              onChange={handleFieldChange}
              error={errors[field.id]}
            />
          ))}
        </div>
      )}

      {/* Address fields from schema */}
      {addressFields.map(field => (
        <div key={field.id} className="anyspend-form-address space-y-2">
          <h3 className="anyspend-form-address-title text-sm font-semibold text-gray-900 dark:text-gray-100">
            {field.label}
          </h3>
          <AddressForm
            value={(formData[field.id] as AddressData) || emptyAddress}
            onChange={addr => handleFieldChange(field.id, addr)}
            required={field.required}
          />
        </div>
      ))}

      {/* Shipping address (from collectShippingAddress prop, not schema) */}
      {collectShippingAddress && addressFields.length === 0 && (
        <div className="anyspend-shipping-address space-y-2">
          <h3 className="anyspend-shipping-address-title text-sm font-semibold text-gray-900 dark:text-gray-100">
            Shipping Address
          </h3>
          <AddressForm value={shippingAddress} onChange={onShippingAddressChange} required />
        </div>
      )}

      {/* Shipping options + Discount code */}
      {shippingAndDiscount}
    </div>
  );
}
