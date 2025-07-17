"use client";

import { ALL_CHAINS, RELAY_ETH_ADDRESS, RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { Button, useAccountWallet, useTokenBalancesByChain } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { simpleHashChainToChainName } from "@b3dotfun/sdk/shared/utils/simplehash";
import { TokenSelector } from "@reservoir0x/relay-kit-ui";
import { CheckCircle2, ChevronsUpDown } from "lucide-react";
import { useMemo } from "react";
import { ChainTokenIcon } from "./ChainTokenIcon";
import { components } from "@b3dotfun/sdk/anyspend/types/api";

export function OrderToken({
  context,
  address,
  chainId,
  setChainId,
  token,
  setToken,
  requiredAmount,
  tokenSelectClassName,
}: {
  context: "from" | "to";
  address: string | undefined;
  token: components["schemas"]["Token"];
  setToken: (token: components["schemas"]["Token"]) => void;
  chainId: number;
  setChainId: (chainId: number) => void;
  requiredAmount: bigint | undefined;
  tokenSelectClassName?: string;
}) {
  const { wallet } = useAccountWallet();

  const chainName = useMemo(() => simpleHashChainToChainName(chainId), [chainId]);

  const { nativeTokens, fungibleTokens } = useTokenBalancesByChain({
    address: wallet?.address || "",
    chainsIds: [chainId],
    enabled: !!wallet?.address && !!chainName,
  });

  const { formattedBalance, hasEnoughBalance } = useMemo(() => {
    // Get balance for the selected token
    let balance: bigint | null = null;
    if (token && wallet?.address) {
      if (token.address === RELAY_ETH_ADDRESS) {
        // Native token
        const nativeToken = nativeTokens?.find(t => t.chainId === chainId);
        balance = nativeToken?.value ?? null;
      } else {
        // ERC20 token
        const fungibleToken = fungibleTokens?.find(t => t.token_address?.toLowerCase() === token.address.toLowerCase());
        balance = fungibleToken?.balance ? BigInt(fungibleToken.balance) : null;
      }
    }

    // Check if balance is sufficient for the required amount
    const hasEnoughBalance = balance && requiredAmount ? balance >= requiredAmount : false;

    const formattedBalance = balance ? formatTokenAmount(balance, token.decimals, 6, false) : null;

    return {
      formattedBalance,
      hasEnoughBalance,
    };
  }, [chainId, fungibleTokens, nativeTokens, requiredAmount, token, wallet?.address]);

  return (
    <TokenSelector
      address={address}
      chainIdsFilter={Object.values(ALL_CHAINS).map(chain => chain.id)}
      context={context}
      fromChainWalletVMSupported={true}
      isValidAddress={true}
      key={undefined}
      lockedChainIds={Object.values(ALL_CHAINS).map(chain => chain.id)}
      multiWalletSupportEnabled={true}
      onAnalyticEvent={undefined}
      popularChainIds={[1, 8453, RELAY_SOLANA_MAINNET_CHAIN_ID]}
      restrictedToken={undefined}
      setToken={token => {
        setChainId(token.chainId);
        setToken({
          address: token.address,
          chainId,
          decimals: token.decimals,
          metadata: { logoURI: token.logoURI },
          name: token.name,
          symbol: token.symbol,
        });
      }}
      supportedWalletVMs={["evm", "svm"]}
      token={undefined}
      trigger={
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "bg-b3-react-background border-as-stroke flex h-auto w-fit shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-2 py-1 pr-2 text-center",
            tokenSelectClassName,
          )}
        >
          {token.metadata.logoURI ? (
            <ChainTokenIcon
              chainUrl={ALL_CHAINS[chainId].logoUrl}
              tokenUrl={token.metadata.logoURI}
              className="h-8 min-h-8 w-8 min-w-8"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-700" />
          )}
          <div className="flex flex-col items-start gap-0">
            <div className="text-as-primary font-semibold">
              {token.symbol} on {ALL_CHAINS[chainId].name}
            </div>
            {formattedBalance && (
              <div className="flex items-center gap-1">
                <div className="text-as-primary/50 text-xs">
                  {formattedBalance || "--"} {token.symbol}
                </div>
                {hasEnoughBalance && <CheckCircle2 className="text-as-brand -mt-0.5 h-4 w-4" />}
              </div>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      }
    />
  );
}
