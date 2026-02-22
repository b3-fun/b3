"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import type { CheckoutFormField as FormFieldType } from "../../../types/forms";

interface CheckoutFormFieldProps {
  field: FormFieldType;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
  error?: string;
  className?: string;
}

const inputBaseClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400";

const labelClass = "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";

export function CheckoutFormFieldComponent({ field, value, onChange, error, className }: CheckoutFormFieldProps) {
  const handleChange = (val: unknown) => {
    onChange(field.id, val);
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "number":
        return (
          <input
            type={field.type === "phone" ? "tel" : field.type}
            value={(value as string) || ""}
            onChange={e => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={cn(
              "anyspend-form-input",
              inputBaseClass,
              error && "border-red-400 focus:border-red-500 focus:ring-red-500",
            )}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
            min={field.validation?.min}
            max={field.validation?.max}
            pattern={field.validation?.pattern}
          />
        );

      case "textarea":
        return (
          <textarea
            value={(value as string) || ""}
            onChange={e => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className={cn(
              "anyspend-form-textarea",
              inputBaseClass,
              "resize-y",
              error && "border-red-400 focus:border-red-500 focus:ring-red-500",
            )}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
        );

      case "select":
        return (
          <select
            value={(value as string) || ""}
            onChange={e => handleChange(e.target.value)}
            required={field.required}
            className={cn("anyspend-form-select", inputBaseClass, "cursor-pointer", error && "border-red-400")}
          >
            <option value="">{field.placeholder || "Select..."}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <label className="anyspend-form-checkbox flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => handleChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.placeholder || field.label}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={(value as string) || ""}
            onChange={e => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={cn("anyspend-form-input", inputBaseClass, error && "border-red-400")}
          />
        );
    }
  };

  return (
    <div
      className={cn("anyspend-form-field space-y-1", className)}
      data-field-id={field.id}
      data-field-type={field.type}
    >
      {field.type !== "checkbox" && (
        <label className={cn("anyspend-form-label", labelClass)}>
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {renderField()}
      {error && <p className="anyspend-form-error text-xs text-red-500">{error}</p>}
    </div>
  );
}
