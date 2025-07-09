import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useCallback, useState } from "react";
import { Chain, getContract, sendTransaction } from "thirdweb";
import { claimTo as claimTo1155 } from "thirdweb/extensions/erc1155";
import { claimTo as claimTo721 } from "thirdweb/extensions/erc721";
import { Account } from "thirdweb/wallets";

interface UseClaimProps {
  contractAddress: string;
  quantity?: number;
  chain: Chain;
  to: string;
  tokenId?: number; // Optional - if provided, use ERC1155 claim
}

export function useClaim({ contractAddress, quantity = 1, chain, to, tokenId }: UseClaimProps) {
  const [isMinting, setIsMinting] = useState(false);

  const claim = useCallback(
    async (account: Account) => {
      if (!to) {
        throw new Error("No recipient address provided");
      }

      setIsMinting(true);
      try {
        const contract = getContract({
          client,
          chain,
          address: contractAddress,
        });

        // If tokenId is provided, use ERC1155 claim
        const transaction =
          tokenId !== undefined
            ? claimTo1155({
                contract,
                to,
                quantity: BigInt(quantity),
                tokenId: BigInt(tokenId),
              })
            : claimTo721({
                contract,
                to,
                quantity: BigInt(quantity),
              });

        const tx = await sendTransaction({
          transaction,
          account,
        });

        return tx.transactionHash;
      } finally {
        setIsMinting(false);
      }
    },
    [contractAddress, quantity, chain, to, tokenId],
  );

  return { claim, isMinting };
}

// Export both for backward compatibility
export const useClaim721 = useClaim;
export const useClaim1155 = useClaim;
