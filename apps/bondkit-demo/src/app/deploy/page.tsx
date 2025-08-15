"use client";

import { cn } from "@/utils/cn";
import { BondkitTokenFactory, type BondkitTokenConfig } from "@b3dotfun/sdk/bondkit";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { Input } from "@b3dotfun/sdk/global-account/react/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { parseEther } from "viem";
import { base } from "viem/chains";
import SignInWithB3OnBase from "../SignInWithB3OnBase";

export default function DeployPage() {
  const { address } = useAccountWallet();
  const isConnected = !!address;
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const isConfirming = false;
  const factoryRef = useRef<BondkitTokenFactory | null>(null);

  // Initialize SDK factory and connect to injected provider
  useEffect(() => {
    const init = async () => {
      try {
        const factory = new BondkitTokenFactory(base.id);
        factoryRef.current = factory;
        if (typeof window !== "undefined" && (window as any).ethereum) {
          await factory.connectWithProvider((window as any).ethereum);
        } else {
          factory.connect();
        }
      } catch (e) {
        console.error("Failed to init BondkitTokenFactory", e);
      }
    };
    init();
  }, []);

  const [activeTokenAddress, setActiveTokenAddress] = useState<`0x${string}` | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Keep track of raw input values for decimal fields
  const [rawInputs, setRawInputs] = useState({
    targetAmount: "0.0000001",
    finalTokenSupply: "100000000000",
  });

  const [config, setConfig] = useState<BondkitTokenConfig>({
    name: "My Demo Token",
    symbol: "MDT",
    feeRecipient: (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    finalTokenSupply: parseEther("100000000000"),
    aggressivenessFactor: 50,
    lpSplitRatioFeeRecipientBps: BigInt(1000),
    targetAmount: parseEther("0.0000001"),
    tradingToken: "0xB3B32F9f8827D4634fE7d973Fa1034Ec9fdDB3B3" as `0x${string}`,
    migrationAdminAddress: (address || "0x0000000000000000000000000000000000000000") as `0x${string}`,
    bondingPhaseSplitter: "0x867F8DE1e5723C8cb793f41e381305BD8ab75A7A" as `0x${string}`,
    v4PoolManager: "0x498581fF718922c3f8e6A244956aF099B2652b2b" as `0x${string}`,
    v4Hook: "0x0EAD1EA7e78B895069AF815AD187270408c0B0cC" as `0x${string}`,
    v4PoolFee: 30000,
    v4TickSpacing: 60,
  });

  // Update config when address changes
  useEffect(() => {
    if (address) {
      setConfig(prev => ({
        ...prev,
        feeRecipient: address as `0x${string}`,
        migrationAdminAddress: address as `0x${string}`,
      }));
    }
  }, [address]);

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryRef.current) return;
    setIsPending(true);
    try {
      const tokenAddress = await factoryRef.current.deployBondkitToken(config as any);
      if (tokenAddress) {
        setActiveTokenAddress(tokenAddress as `0x${string}`);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Deploy failed", err);
    } finally {
      setIsPending(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setActiveTokenAddress(null);
  };

  const handleInputChange = (field: keyof BondkitTokenConfig, value: string) => {
    setConfig(prev => {
      const newConfig = { ...prev };

      switch (field) {
        case "name":
        case "symbol":
          newConfig[field] = value;
          break;
        case "feeRecipient":
        case "migrationAdminAddress":
          // Ensure addresses are valid hex
          if (value.startsWith("0x") && value.length === 42) {
            newConfig[field] = value as `0x${string}`;
          }
          break;
        case "targetAmount":
          // Handle decimal input for ETH
          setRawInputs(prev => ({ ...prev, targetAmount: value }));
          if (value && !isNaN(Number(value))) {
            try {
              newConfig.targetAmount = parseEther(value);
            } catch {}
          }
          break;
        case "finalTokenSupply":
          // Handle decimal input for token supply
          setRawInputs(prev => ({ ...prev, finalTokenSupply: value }));
          if (value && !isNaN(Number(value))) {
            try {
              newConfig.finalTokenSupply = parseEther(value);
            } catch {}
          }
          break;
        case "aggressivenessFactor":
          const factor = Number(value);
          if (!isNaN(factor) && factor >= 1 && factor <= 100) {
            newConfig.aggressivenessFactor = factor;
          }
          break;
        case "lpSplitRatioFeeRecipientBps":
          const bps = Number(value);
          if (!isNaN(bps) && bps >= 0 && bps <= 10000) {
            newConfig.lpSplitRatioFeeRecipientBps = BigInt(bps);
          }
          break;
      }

      return newConfig;
    });
  };

  return (
    <div className="min-h-screen bg-b3-react-background">
      {/* Success Modal */}
      {showSuccessModal && activeTokenAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseSuccessModal} />
          
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Token Deployed!</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Your bonding curve token is now live and ready for trading</p>
            </div>
            
            <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Contract Address</p>
              <p className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all leading-relaxed">{activeTokenAddress}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/token/${activeTokenAddress}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm"
              >
                View Token Page
              </button>
              <button
                onClick={handleCloseSuccessModal}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Match Homepage */}
      <header className="border-b border-b3-react-border bg-b3-react-card">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-3xl font-bold text-b3-react-foreground">Bondkit</h1>
              <nav className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 rounded-lg text-b3-react-muted-foreground hover:text-b3-react-foreground hover:bg-b3-react-subtle text-sm font-medium transition-colors"
                >
                  Tokens
                </button>
                <div className="px-4 py-2 rounded-lg bg-b3-react-primary text-b3-react-primary-foreground text-sm font-medium">
                  Deploy Token
                </div>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="flex items-center space-x-2 text-b3-react-primary hover:text-b3-react-primary/80 transition-colors group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back to Tokens</span>
              </button>
              <SignInWithB3OnBase />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-b3-react-foreground">Deploy New Token</h2>
          <p className="text-b3-react-muted-foreground mt-1">Create your token with a customizable bonding curve</p>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="mb-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Wallet Connection Required</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Please connect your wallet to deploy a token</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Form */}
          <div className="xl:col-span-3 max-w-4xl">
            <form onSubmit={handleDeploy} className="space-y-8">
              
              {/* Basic Configuration */}
              <div className="rounded-xl bg-b3-react-card border border-b3-react-border p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-b3-react-foreground">Basic Configuration</h3>
                  <p className="text-sm text-b3-react-muted-foreground mt-1">Configure the basic properties of your token</p>
                </div>
                
                {/* Token Identity - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Token Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={config.name}
                      onChange={e => handleInputChange("name", e.target.value)}
                      placeholder="e.g., My Awesome Token"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Token Symbol <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={config.symbol}
                      onChange={e => handleInputChange("symbol", e.target.value)}
                      placeholder="e.g., MAT"
                      required
                    />
                  </div>
                </div>

                {/* Supply & Target - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Final Token Supply <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={rawInputs.finalTokenSupply}
                      onChange={e => handleInputChange("finalTokenSupply", e.target.value)}
                      placeholder="e.g., 100000000000"
                      required
                    />
                    <p className="text-xs text-b3-react-muted-foreground mt-1">Total number of tokens that will exist</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Target Amount
                    </label>
                    <Input
                      type="text"
                      value={rawInputs.targetAmount}
                      onChange={e => handleInputChange("targetAmount", e.target.value)}
                      placeholder="e.g., 0.0000001"
                    />
                    <p className="text-xs text-b3-react-muted-foreground mt-1">Trading token amount needed to complete bonding phase</p>
                  </div>
                </div>

                {/* Trading Token - Full width */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                    Trading Token Contract
                  </label>
                  <Input
                    type="text"
                    value={config.tradingToken}
                    disabled
                    className="font-mono text-sm bg-b3-react-subtle"
                  />
                  <p className="text-xs text-b3-react-muted-foreground mt-1">ERC20 token used for trading (currently using default token)</p>
                </div>

                {/* Curve Parameters - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Aggressiveness Factor (1-100) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={config.aggressivenessFactor}
                      onChange={e => handleInputChange("aggressivenessFactor", e.target.value)}
                      min="1"
                      max="100"
                      required
                    />
                    <p className="text-xs text-b3-react-muted-foreground mt-1">Higher values = steeper price curve</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      LP Split Ratio (BPS)
                    </label>
                    <Input
                      type="number"
                      value={config.lpSplitRatioFeeRecipientBps?.toString()}
                      onChange={e => handleInputChange("lpSplitRatioFeeRecipientBps", e.target.value)}
                      min="0"
                      max="10000"
                      placeholder="e.g., 1000"
                    />
                    <p className="text-xs text-b3-react-muted-foreground mt-1">Basis points (100 = 1%)</p>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="rounded-xl bg-b3-react-card border border-b3-react-border p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-b3-react-foreground">Advanced Settings</h3>
                  <p className="text-sm text-b3-react-muted-foreground mt-1">Configure administrative addresses</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Fee Recipient Address
                    </label>
                    <Input
                      type="text"
                      value={config.feeRecipient}
                      onChange={e => handleInputChange("feeRecipient", e.target.value)}
                      className="font-mono text-sm"
                      placeholder="0x..."
                    />
                    <p className="text-xs text-b3-react-muted-foreground mt-1">Address that will receive trading fees</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-b3-react-foreground mb-2">
                      Migration Admin Address
                    </label>
                    <Input
                      type="text"
                      value={config.migrationAdminAddress}
                      onChange={e => handleInputChange("migrationAdminAddress", e.target.value)}
                      className="font-mono text-sm"
                      placeholder="0x..."
                    />
                    <p className="text-xs text-b3-react-muted-foreground mt-1">Address that can manage token migration</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={!isConnected || isPending}
                  className={cn(
                    "flex-1 flex items-center justify-center space-x-2 rounded-lg px-8 py-4 font-semibold transition-all",
                    isConnected && !isPending
                      ? "bg-b3-react-primary text-b3-react-primary-foreground hover:bg-b3-react-primary/90 hover:shadow-lg"
                      : "cursor-not-allowed bg-b3-react-muted text-b3-react-muted-foreground",
                  )}
                >
                  {isPending && (
                    <div className="w-5 h-5 border-2 border-current border-r-transparent animate-spin rounded-full"></div>
                  )}
                  <span>
                    {isPending ? "Deploying Token..." : isConfirming ? "Confirming..." : "Deploy Token"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="sm:w-auto w-full rounded-lg bg-b3-react-subtle border border-b3-react-border px-8 py-4 font-semibold text-b3-react-foreground transition-colors hover:bg-b3-react-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Preview/Info */}
          <div className="xl:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Configuration Preview */}
              <div className="rounded-xl bg-b3-react-card border border-b3-react-border p-6">
                <h3 className="text-lg font-semibold text-b3-react-foreground mb-4">Configuration Preview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-b3-react-border">
                    <span className="text-sm text-b3-react-muted-foreground">Token Name</span>
                    <span className="font-medium text-b3-react-foreground text-sm">{config.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-b3-react-border">
                    <span className="text-sm text-b3-react-muted-foreground">Symbol</span>
                    <span className="font-medium text-b3-react-foreground text-sm">{config.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-b3-react-border">
                    <span className="text-sm text-b3-react-muted-foreground">Supply</span>
                    <span className="font-medium text-b3-react-foreground text-sm">{rawInputs.finalTokenSupply}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-b3-react-border">
                    <span className="text-sm text-b3-react-muted-foreground">Target</span>
                    <span className="font-medium text-b3-react-foreground text-sm">{rawInputs.targetAmount}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-b3-react-border">
                    <span className="text-sm text-b3-react-muted-foreground">Trading Token</span>
                    <span className="font-mono text-b3-react-foreground text-xs">{config.tradingToken.slice(0, 6)}...{config.tradingToken.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-b3-react-muted-foreground">Aggressiveness</span>
                    <span className="font-medium text-b3-react-foreground text-sm">{config.aggressivenessFactor}%</span>
                  </div>
                </div>
              </div>

              {/* Deployment Status */}
              {isPending && (
                <div className="rounded-xl bg-b3-react-card border border-b3-react-border p-6">
                  <h3 className="text-lg font-semibold text-b3-react-foreground mb-4">Deployment Status</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-b3-react-primary border-r-transparent animate-spin rounded-full"></div>
                    <span className="text-b3-react-muted-foreground">Deploying your token...</span>
                  </div>
                  <div className="mt-4 text-xs text-b3-react-muted-foreground">
                    This may take a few moments. Please don't close this page.
                  </div>
                </div>
              )}

              {/* Help & Info */}
              <div className="rounded-xl bg-b3-react-card border border-b3-react-border p-6">
                <h3 className="text-lg font-semibold text-b3-react-foreground mb-4">About Bonding Curves</h3>
                <div className="space-y-4 text-sm text-b3-react-muted-foreground">
                  <p>
                    Bonding curves create automatic price discovery through mathematical formulas. As more people buy your token, the price increases according to the curve.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <strong className="text-b3-react-foreground">Target Amount:</strong> The trading token threshold needed before your token migrates to a full DEX.
                    </div>
                    <div>
                      <strong className="text-b3-react-foreground">Trading Token:</strong> The ERC20 token used for buying/selling your bonding curve token.
                    </div>
                    <div>
                      <strong className="text-b3-react-foreground">Aggressiveness Factor:</strong> Controls how steep the price curve is. Higher values mean faster price increases.
                    </div>
                    <div>
                      <strong className="text-b3-react-foreground">LP Split Ratio:</strong> Percentage of fees that go to the fee recipient (in basis points).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Hash Display */}
        {hash && (
          <div className="mt-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Transaction Submitted</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Transaction Hash:</p>
                <p className="font-mono text-xs text-blue-600 dark:text-blue-400 mt-1 break-all">{hash}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
