import { useQueryB3 } from "@b3dotfun/sdk/global-account/react/hooks/useQueryB3";
import { FindByAddressParams, GenerateSigMintParams, IsMintEligibleParams } from "../../types/signature-mint";

/**
 * Hook to generate signature for minting
 */
export const useGenerateSigMintData = ({
  recipientAddress,
  contractAddress,
  chainId,
  quantity,
  prompt,
}: GenerateSigMintParams) => {
  return useQueryB3<"signature-minting-collections", "generateSignature">(
    "signature-minting-collections",
    "generateSignature",
    {
      recipientAddress,
      contractAddress,
      chainId,
      quantity,
      prompt,
    },
  );
};

/**
 * Hook to fetch a signature minting collection by address
 */
export const useSigMintCollection = ({ address, chainId }: FindByAddressParams) => {
  return useQueryB3<"signature-minting-collections", "findByAddress">(
    "signature-minting-collections",
    "findByAddress",
    {
      address,
      chainId,
    },
  );
};

/**
 * Hook to check if an address is eligible for minting
 */
export const useIsMintEligible = ({ contractAddress, chainId, recipientAddress, quantity }: IsMintEligibleParams) => {
  return useQueryB3<"signature-minting-collections", "isMintEligible">(
    "signature-minting-collections",
    "isMintEligible",
    {
      contractAddress,
      chainId,
      recipientAddress,
      quantity,
    },
  );
};
