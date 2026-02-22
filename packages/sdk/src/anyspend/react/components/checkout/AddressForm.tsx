"use client";

import { cn } from "@b3dotfun/sdk/shared/utils/cn";
import type { AddressData } from "../../../types/forms";

interface AddressFormProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
  className?: string;
}

const inputBaseClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-400";

const labelClass = "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";

export function AddressForm({ value, onChange, required, className }: AddressFormProps) {
  const update = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className={cn("anyspend-address-form space-y-3", className)}>
      <div className="anyspend-address-street">
        <label className={cn("anyspend-form-label", labelClass)}>
          Street Address{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={value.street || ""}
          onChange={e => update("street", e.target.value)}
          placeholder="123 Main Street"
          required={required}
          className={cn("anyspend-form-input", inputBaseClass)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="anyspend-address-city">
          <label className={cn("anyspend-form-label", labelClass)}>
            City{required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={value.city || ""}
            onChange={e => update("city", e.target.value)}
            placeholder="City"
            required={required}
            className={cn("anyspend-form-input", inputBaseClass)}
          />
        </div>
        <div className="anyspend-address-state">
          <label className={cn("anyspend-form-label", labelClass)}>
            State / Province{required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={value.state || ""}
            onChange={e => update("state", e.target.value)}
            placeholder="State"
            required={required}
            className={cn("anyspend-form-input", inputBaseClass)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="anyspend-address-zip">
          <label className={cn("anyspend-form-label", labelClass)}>
            Zip / Postal Code{required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={value.zip || ""}
            onChange={e => update("zip", e.target.value)}
            placeholder="12345"
            required={required}
            className={cn("anyspend-form-input", inputBaseClass)}
          />
        </div>
        <div className="anyspend-address-country">
          <label className={cn("anyspend-form-label", labelClass)}>
            Country{required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={value.country || ""}
            onChange={e => update("country", e.target.value)}
            placeholder="Country"
            required={required}
            className={cn("anyspend-form-input", inputBaseClass)}
          />
        </div>
      </div>
    </div>
  );
}
