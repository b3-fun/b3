import { Button, useClaim } from "@b3dotfun/sdk/global-account/react";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import type { JSX } from "react";
import { Chain } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { Account, smartWallet } from "thirdweb/wallets";

interface MintButtonProps {
  contractAddress: string;
  quantity?: number;
  chain: Chain;
  account: Account;
  to: `0x${string}`;
  tokenId?: number;
  className?: string;
  children?: string | JSX.Element;
  onSuccess?: (tx: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

export function MintButton({
  contractAddress,
  quantity = 1,
  chain,
  account,
  to,
  tokenId,
  className,
  children = "Mint",
  onSuccess,
  onError,
}: MintButtonProps) {
  const ecoSystemWallet = useActiveAccount();
  console.log("@@ecoSystemWallet", ecoSystemWallet);

  const { claim, isMinting } = useClaim({
    contractAddress,
    quantity,
    chain,
    to,
    tokenId,
  });

  const smartAccountWithSignerOverride = ecoSystemWallet?.address !== to;

  const handleMint = async () => {
    try {
      if (smartAccountWithSignerOverride) {
        const wallet = smartWallet({
          chain,
          sponsorGas: true,
          overrides: {
            accountAddress: ecoSystemWallet?.address,
          },
        });

        const smartAccountWithSigner = await wallet.connect({
          client,
          personalAccount: account,
        });

        const tx = await claim(smartAccountWithSigner);
        onSuccess?.(tx);
      } else {
        const tx = await claim(account);
        onSuccess?.(tx);
      }
    } catch (error) {
      console.error("Error minting:", error);
      onError?.(error as Error);
      throw error;
    }
  };

  const buttonText = isMinting ? "Minting..." : String(children);

  return (
    <Button onClick={handleMint} disabled={isMinting} className={className}>
      {buttonText}
    </Button>
  );
}
