import { Validators } from "@b3dotfun/sdk/anyspend/utils/validation";
import { useB3Config } from "@b3dotfun/sdk/global-account/react";
import { useCallback } from "react";
import { CreateOnrampOrderParams } from "./useAnyspendCreateOnrampOrder";
import { CreateOrderParams } from "./useAnyspendCreateOrder";

/**
 * Hook that provides a validated client reference ID
 * Gets the createClientReferenceId function from B3 context and validates the result
 */
export function useValidatedClientReferenceId() {
  const { createClientReferenceId } = useB3Config();

  const createValidatedClientReferenceId = useCallback(
    async (params: CreateOrderParams | CreateOnrampOrderParams) => {
      // If no function provided, return undefined
      if (!createClientReferenceId) {
        return undefined;
      }

      try {
        // Call the function to generate the ID
        const generatedId = await createClientReferenceId(params);

        // Validate the generated ID
        const validation = Validators.clientReferenceId(generatedId);

        if (!validation.isValid) {
          console.error(
            `[AnySpend] Invalid clientReferenceId generated: ${validation.error || "Validation failed"}. Will be set to undefined.`,
          );
          return undefined;
        }

        return validation.cleaned;
      } catch (error) {
        console.error("[AnySpend] Error generating clientReferenceId:", error);
        return undefined;
      }
    },
    [createClientReferenceId],
  );

  return createValidatedClientReferenceId;
}
