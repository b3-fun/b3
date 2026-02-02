"use client";

import { components, getHyperliquidUSDCToken, HYPERLIQUID_CHAIN_ID, isHyperliquidUSDC } from "@b3dotfun/sdk/anyspend";
import { AnySpendDeposit } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet, useSearchParamsSSR, useTokenData } from "@b3dotfun/sdk/global-account/react";
import { LogOut, User2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { useAutoConnect, useConnectModal, useDisconnect } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { isAddress, zeroAddress } from "viem";
import { PartnerConfig } from "./partner-config";

// Helper to truncate address
function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

const recommendWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("com.trustwallet.app"),
];

// Hyperliquid USDC uses a special 34-character address format (0x + 32 hex digits)
const HYPERLIQUID_USDC_ADDRESS = "0x00000000000000000000000000000000";

// Check if address is valid for the given chain
// Hyperliquid USDC uses a special 34-character address format
function isValidTokenAddress(chainId: number | undefined, address: string): boolean {
  // Standard EVM address validation
  if (isAddress(address)) return true;
  // Special case: Hyperliquid USDC uses 34-char address
  if (chainId !== undefined && isHyperliquidUSDC(chainId, address)) return true;
  return false;
}

// Auto-correct zero address to Hyperliquid USDC address when on Hyperliquid chain
function correctHyperliquidUSDCAddress(chainId: number | undefined, address: string | undefined): string | undefined {
  if (!address) return address;
  // If user input standard zero address on Hyperliquid, correct it to Hyperliquid USDC address
  if (chainId === HYPERLIQUID_CHAIN_ID && address.toLowerCase() === zeroAddress.toLowerCase()) {
    return HYPERLIQUID_USDC_ADDRESS;
  }
  return address;
}

const client = createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! });

const URL_EXAMPLE_HINT = "Example: /deposit?recipientAddress=0x123...&toChainId=8453&toCurrency=0x...";

interface ErrorDisplayProps {
  errorType: string;
  title: string;
  message: string;
}

function ErrorDisplay({ errorType, title, message }: ErrorDisplayProps) {
  return (
    <div
      className={`as-deposit-page as-deposit-error as-deposit-error-${errorType} flex min-h-screen items-center justify-center`}
    >
      <div className="as-deposit-error-content text-center">
        <div className="as-deposit-error-icon mb-4 text-6xl">⚠️</div>
        <h1 className="as-deposit-error-title mb-2 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="as-deposit-error-message text-gray-600 dark:text-gray-400">{message}</p>
        <p className="as-deposit-error-hint mt-2 text-sm text-gray-500">{URL_EXAMPLE_HINT}</p>
      </div>
    </div>
  );
}

interface DepositPageClientProps {
  partnerConfig?: PartnerConfig;
  redirectUrl?: string;
  redirectLabel?: string;
  /** Fixed destination token amount in wei/smallest unit. When provided, user cannot change the amount. */
  amount?: string;
}

export default function DepositPageClient({
  partnerConfig,
  redirectUrl,
  redirectLabel,
  amount,
}: DepositPageClientProps) {
  const searchParams = useSearchParamsSSR();
  const [isLoaded, setIsLoaded] = useState(false);
  useAutoConnect({
    client,
    wallets: recommendWallets,
  });
  const { connectedEOAWallet } = useAccountWallet();
  const walletAddress = connectedEOAWallet?.getAccount()?.address;

  const { connect } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleConnectClick = () => {
    connect({
      client,
      wallets: recommendWallets,
      size: "compact",
      showThirdwebBranding: false,
      theme: "light",
      setActive: false,
    });
  };

  const handleDisconnect = () => {
    if (connectedEOAWallet) {
      disconnect(connectedEOAWallet);
    }
    setIsPopoverOpen(false);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recipientAddress = searchParams.get("recipientAddress") || "";
  // Use SDK-compatible params: toChainId and toCurrency
  const chainIdParam = searchParams.get("toChainId");
  const parsedChainId = Number(chainIdParam);
  const chainId = chainIdParam && !isNaN(parsedChainId) ? parsedChainId : undefined;
  const rawTokenAddress = searchParams.get("toCurrency") || undefined;
  // Auto-correct zero address to Hyperliquid USDC address when on Hyperliquid chain
  const tokenContractAddress = correctHyperliquidUSDCAddress(chainId, rawTokenAddress);

  // Use SDK hook to fetch token data
  const { data: tokenData, isLoading: isTokenLoading } = useTokenData(chainId, tokenContractAddress);

  // Build destination token from hook data or Hyperliquid default
  const destinationToken: components["schemas"]["Token"] | null = useMemo(() => {
    // Special case for Hyperliquid without token address
    if (chainId === HYPERLIQUID_CHAIN_ID && !tokenContractAddress) {
      return getHyperliquidUSDCToken();
    }

    if (!chainId || !tokenContractAddress || !tokenData) {
      return null;
    }

    return {
      chainId,
      address: tokenContractAddress,
      symbol: tokenData.symbol ?? "",
      name: tokenData.name ?? "",
      decimals: tokenData.decimals ?? 18,
      metadata: {
        logoURI: tokenData.logoURI,
      },
    };
  }, [chainId, tokenContractAddress, tokenData]);

  // Wait for component to mount on the client before checking for errors
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Show loading state while component initializes
  if (!isLoaded) {
    return (
      <div className="as-deposit-page as-deposit-loading flex min-h-screen items-center justify-center">
        <div className="as-deposit-spinner h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Validate recipient address
  if (!recipientAddress || !isAddress(recipientAddress)) {
    return (
      <ErrorDisplay
        errorType="invalid-recipient"
        title="Invalid Recipient Address"
        message="Please provide a valid wallet address in the URL parameters."
      />
    );
  }

  // Validate token address is provided
  if (!rawTokenAddress && chainId !== HYPERLIQUID_CHAIN_ID) {
    return (
      <ErrorDisplay
        errorType="missing-token"
        title="Missing Token Address"
        message="Please provide a token address in the URL parameters."
      />
    );
  }

  // Validate token contract address format
  if (tokenContractAddress && !isValidTokenAddress(chainId, tokenContractAddress)) {
    return (
      <ErrorDisplay
        errorType="invalid-token"
        title="Invalid Token Address"
        message="Please provide a valid token address in the URL parameters."
      />
    );
  }

  // Show loading while fetching token info
  if (isTokenLoading || !destinationToken) {
    return (
      <div className="as-deposit-page as-deposit-loading as-deposit-loading-token flex min-h-screen items-center justify-center">
        <div className="as-deposit-spinner h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="as-deposit-page as-deposit-main relative flex min-h-screen flex-col p-4 pt-16">
      <div className="as-deposit-wallet-container absolute right-4 top-4 z-10" ref={popoverRef}>
        {walletAddress ? (
          <div className="as-deposit-wallet-connected relative">
            <button
              className="as-deposit-wallet-button as-deposit-wallet-button-connected bg-on-surface-btn border-border-secondary group flex h-10 items-center gap-2 rounded-xl border px-3.5 shadow"
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
            >
              <div className="as-deposit-wallet-address text-body-1m text-content-secondary text-sm font-semibold">
                {truncateAddress(walletAddress)}
              </div>
            </button>
            {isPopoverOpen && (
              <div className="as-deposit-wallet-popover absolute right-0 top-12 z-50 min-w-[160px] rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                <button
                  className="as-deposit-disconnect-button flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={handleDisconnect}
                >
                  <LogOut className="as-deposit-disconnect-icon size-4" />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="as-deposit-wallet-button as-deposit-connect-button bg-on-surface-btn border-border-secondary group flex h-10 items-center gap-2 rounded-xl border px-3.5 shadow"
            onClick={handleConnectClick}
          >
            <User2 className="as-deposit-connect-icon text-content-secondary size-4" />
            <div className="as-deposit-connect-label text-body-1m text-content-secondary text-sm font-semibold">
              Connect Wallet
            </div>
          </button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="as-deposit-widget-container bg-theme-surface-pure border-theme-stroke w-[460px] max-w-full overflow-hidden rounded-2xl border">
          <AnySpendDeposit
            mode="modal"
            recipientAddress={recipientAddress}
            destinationTokenAddress={destinationToken.address}
            destinationTokenChainId={destinationToken.chainId}
            returnToHomeUrl={redirectUrl || partnerConfig?.returnToHomeUrl}
            customRecipientLabel={partnerConfig?.customRecipientLabel}
            returnHomeLabel={redirectLabel || partnerConfig?.returnHomeLabel}
            destinationTokenAmount={amount}
          />
        </div>
      </div>
    </div>
  );
}
