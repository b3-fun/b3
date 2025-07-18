import { isValidEvmAddress } from "./utils.js";

// Real-time validation for recipient address
export function setupAddressValidation() {
  const recipientInput = document.getElementById("recipientAddress");
  if (recipientInput) {
    recipientInput.addEventListener("input", function () {
      const address = this.value.trim();

      // Only validate if user has entered something
      if (address.length > 0) {
        if (isValidEvmAddress(address)) {
          // Valid address
          this.style.borderColor = "#28a745";
          this.style.boxShadow = "0 0 0 3px rgba(40, 167, 69, 0.1)";
        } else {
          // Invalid address
          this.style.borderColor = "#dc3545";
          this.style.boxShadow = "0 0 0 3px rgba(220, 53, 69, 0.1)";
        }
      } else {
        // Reset to default styling
        this.style.borderColor = "#e1e8ed";
        this.style.boxShadow = "";
      }
    });
  }
}

// Initialize address validation on page load
document.addEventListener("DOMContentLoaded", setupAddressValidation);
