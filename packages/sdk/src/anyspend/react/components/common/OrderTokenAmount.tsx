"use client";

import { ChevronsUpDown } from "lucide-react";
import { useEffect, useRef } from "react";
import { NumericFormat } from "react-number-format";

import { ALL_CHAINS, RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { Button } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { TokenSelector } from "@reservoir0x/relay-kit-ui";
import { ChainTokenIcon } from "./ChainTokenIcon";

export function OrderTokenAmount({
  disabled,
  inputValue,
  onChangeInput,
  context,
  address,
  chainId,
  setChainId,
  token,
  setToken,
  hideTokenSelect = false,
  canEditAmount = true,
  className,
  innerClassName,
  amountClassName,
  tokenSelectClassName,
}: {
  disabled?: boolean;
  inputValue: string;
  onChangeInput: (value: string) => void;
  context: "from" | "to";
  address: string | undefined;
  token: components["schemas"]["Token"];
  setToken: (token: components["schemas"]["Token"]) => void;
  chainId: number;
  setChainId: (chainId: number) => void;
  hideTokenSelect?: boolean;
  canEditAmount?: boolean;
  className?: string;
  innerClassName?: string;
  amountClassName?: string;
  tokenSelectClassName?: string;
}) {
  // Track previous token to detect changes
  const prevTokenRef = useRef<string>(token.address);

  useEffect(() => {
    // Only trigger when token actually changes
    if (prevTokenRef.current !== token.address) {
      console.log(`Token changed from ${prevTokenRef.current} to ${token.address}`);

      // For "from" context, reset to default value when token changes
      if (context === "from") {
        // Reset input to default for new token
        onChangeInput("0.01");
      }

      // Update ref to current token
      prevTokenRef.current = token.address;
    }
  }, [token.address, chainId, context, onChangeInput]);

  const handleTokenSelect = (newToken: any) => {
    // Mark that we're about to change tokens
    prevTokenRef.current = "changing"; // Temporary value to force effect

    // Set the chain ID first
    setChainId(newToken.chainId);

    // Then set the new token
    setToken({
      address: newToken.address,
      chainId: newToken.chainId, // Use the new chain ID
      decimals: newToken.decimals,
      metadata: { logoURI: newToken.logoURI },
      name: newToken.name,
      symbol: newToken.symbol,
    });

    // If this is the source token, reset the amount immediately
    if (context === "from") {
      onChangeInput("0.01");
    }
  };

  return (
    <div
      className={cn("border-as-stroke flex w-full flex-col gap-2 rounded-xl", className)}
      key={`${context}-${token.address}-${chainId}`}
    >
      <div className={cn("flex items-center justify-between gap-3", innerClassName)}>
        {!canEditAmount ? (
          <h2 className={cn("text-3xl font-medium text-white", amountClassName)}>{inputValue || "--"}</h2>
        ) : (
          <NumericFormat
            key={`input-${token.address}-${chainId}`}
            decimalSeparator="."
            allowedDecimalSeparators={[","]}
            thousandSeparator
            inputMode="decimal"
            autoComplete="off"
            autoCorrect="off"
            type="text"
            placeholder="0.00"
            minLength={1}
            maxLength={30}
            spellCheck="false"
            className={cn(
              "placeholder:text-as-primary/70 disabled:text-as-primary/70 text-as-primary w-full bg-transparent text-4xl font-semibold leading-[42px] outline-none sm:text-[30px]",
              amountClassName,
            )}
            pattern="^[0-9]*[.,]?[0-9]*$"
            disabled={disabled}
            value={inputValue}
            allowNegative={false}
            onChange={e => onChangeInput(e.currentTarget.value)}
          />
        )}

        {!hideTokenSelect && (
          <TokenSelector
            address={address}
            chainIdsFilter={Object.values(ALL_CHAINS).map(chain => chain.id)}
            context={context}
            fromChainWalletVMSupported={true}
            isValidAddress={true}
            key={`selector-${context}-${token.address}-${chainId}`}
            lockedChainIds={Object.values(ALL_CHAINS).map(chain => chain.id)}
            multiWalletSupportEnabled={true}
            onAnalyticEvent={undefined}
            popularChainIds={[1, 8453, RELAY_SOLANA_MAINNET_CHAIN_ID]}
            setToken={handleTokenSelect}
            supportedWalletVMs={["evm", "svm"]}
            token={undefined}
            trigger={
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "token-selector-button bg-b3-react-background border-as-stroke flex h-auto w-fit shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-2 py-1 pr-2 text-center",
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
                  <div className="text-as-primary font-semibold">{token.symbol}</div>
                  <div className="text-as-primary/70 text-xs">{ALL_CHAINS[chainId].name}</div>
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
