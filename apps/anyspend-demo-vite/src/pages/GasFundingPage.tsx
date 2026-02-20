import { SignInWithB3, useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useCallback, useRef, useState } from "react";
import { defineChain } from "thirdweb";

const PARTNER_ID = String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID || "");
const BASE_CHAIN = defineChain(8453);

const GAS_FUNDING_WORKFLOW_ID = "wf_d6bq9lais14c73c4d4b0";
const GAS_FUNDING_ORG_ID = "org_d5hf3bo877as73cct70g";
const GAS_FUNDING_RECIPIENT_ADDRESS = "0x5b9e8C148256F757518E0D181E64D9B815eA5420";

// USDC on Base (payment always goes through Base)
const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const MAX_WALLETS = 10;
const MAX_TOTAL_USDC = 20;

interface Chain {
  slug: string;
  chainId: number;
  symbol: string;
  name: string;
}

const CHAINS: Chain[] = [
  { slug: "ethereum", chainId: 1, symbol: "ETH", name: "Ethereum" },
  { slug: "arbitrum", chainId: 42161, symbol: "ETH", name: "Arbitrum" },
  { slug: "base", chainId: 8453, symbol: "ETH", name: "Base" },
  { slug: "optimism", chainId: 10, symbol: "ETH", name: "Optimism" },
  { slug: "polygon", chainId: 137, symbol: "MATIC", name: "Polygon" },
  { slug: "bsc", chainId: 56, symbol: "BNB", name: "BSC" },
  { slug: "avalanche", chainId: 43114, symbol: "AVAX", name: "Avalanche" },
  { slug: "zksync", chainId: 324, symbol: "ETH", name: "zkSync" },
];

type AddressMode = "single" | "bulk";

const USDC_DECIMALS = 6;

interface DistributionEntry {
  address: string;
  /** Amount in USDC base units (6 decimals). e.g. "1000000" = 1 USDC */
  amount: string;
  delayMs: number;
}

function buildDistributionPlan(
  addresses: string[],
  baseAmount: number,
  randomizeAmounts: boolean,
  randomizeTiming: boolean,
  maxDelayMs: number,
): DistributionEntry[] {
  return addresses.map(address => {
    let amt = baseAmount;
    if (randomizeAmounts) {
      const variance = baseAmount * 0.2;
      amt = baseAmount + (Math.random() * 2 - 1) * variance;
      amt = Math.max(0.1, parseFloat(amt.toFixed(2)));
    }

    let delayMs = 0;
    if (randomizeTiming) {
      delayMs = Math.floor(Math.random() * maxDelayMs);
    }

    const amount = Math.ceil(amt * 10 ** USDC_DECIMALS).toString();
    return { address, amount, delayMs };
  });
}

export default function GasFundingPage() {
  const [selectedChain, setSelectedChain] = useState(CHAINS[2]); // Base default
  const [recipientAddress, setRecipientAddress] = useState("");
  const [addressMode, setAddressMode] = useState<AddressMode>("single");
  const [bulkAddresses, setBulkAddresses] = useState("");
  const [amount, setAmount] = useState(1);
  const [randomizeTiming, setRandomizeTiming] = useState(false);
  const [randomizeAmounts, setRandomizeAmounts] = useState(false);
  const [maxDelayMinutes, setMaxDelayMinutes] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { address: walletAddress } = useAccountWallet();
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const extractAddresses = useCallback((text: string): string[] => {
    const regex = /0x[a-fA-F0-9]{40}/g;
    return text.match(regex) || [];
  }, []);

  const allAddresses =
    addressMode === "single"
      ? recipientAddress && /^0x[a-fA-F0-9]{40}$/i.test(recipientAddress)
        ? [recipientAddress]
        : []
      : extractAddresses(bulkAddresses);

  const currentAddresses = allAddresses.slice(0, MAX_WALLETS);
  const addressCount = currentAddresses.length;
  const totalUsdc = addressCount * amount;
  const exceedsLimit = totalUsdc > MAX_TOTAL_USDC;
  const exceedsWalletLimit = allAddresses.length > MAX_WALLETS;

  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setBulkAddresses(text);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const handleFundClick = useCallback(() => {
    if (addressCount === 0 || exceedsLimit) return;

    const plan = buildDistributionPlan(currentAddresses, amount, randomizeAmounts, randomizeTiming, maxDelayMinutes * 60_000);
    const amountInBaseUnits = plan
      .reduce((sum, entry) => sum + BigInt(entry.amount), BigInt(0))
      .toString();

    setB3ModalContentType({
      type: "anySpendCheckoutTrigger",
      recipientAddress: GAS_FUNDING_RECIPIENT_ADDRESS,
      destinationTokenAddress: USDC_BASE_ADDRESS,
      destinationTokenChainId: 8453,
      totalAmount: amountInBaseUnits,
      organizationName: "B3OS",
      workflowId: GAS_FUNDING_WORKFLOW_ID,
      orgId: GAS_FUNDING_ORG_ID,
      buttonText: `Fund ${addressCount} Wallet${addressCount !== 1 ? "s" : ""} with Gas`,
      callbackMetadata: {
        inputs: {
          plan,
          chainId: selectedChain.chainId,
        },
      },
    });
    setB3ModalOpen(true);
  }, [
    addressCount,
    exceedsLimit,
    selectedChain,
    amount,
    currentAddresses,
    randomizeAmounts,
    randomizeTiming,
    maxDelayMinutes,
    setB3ModalOpen,
    setB3ModalContentType,
  ]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Fund Wallets with Gas</h1>
          <p className="mb-10 text-center text-sm text-gray-500">No sign-up required. Pay with crypto.</p>

          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Network selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Target Network</label>
              <div className="grid grid-cols-4 gap-2">
                {CHAINS.map(chain => (
                  <button
                    key={chain.slug}
                    type="button"
                    onClick={() => setSelectedChain(chain)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      selectedChain.slug === chain.slug
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {chain.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient addresses */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Recipient Address{addressMode === "bulk" ? "es" : ""}
                </label>
                {addressCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {addressCount} address{addressCount !== 1 ? "es" : ""}
                    {exceedsWalletLimit && ` (max ${MAX_WALLETS})`}
                  </span>
                )}
              </div>

              {/* Mode tabs */}
              <div className="mb-2 flex gap-1 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setAddressMode("single")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    addressMode === "single" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setAddressMode("bulk")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    addressMode === "bulk" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Bulk
                </button>
              </div>

              {addressMode === "single" ? (
                <input
                  type="text"
                  placeholder="0xABC...123"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <>
                  <textarea
                    placeholder="Paste addresses — one per line or comma-separated..."
                    value={bulkAddresses}
                    onChange={e => setBulkAddresses(e.target.value)}
                    className="min-h-[96px] w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {exceedsWalletLimit
                        ? `${allAddresses.length} detected — only first ${MAX_WALLETS} will be used`
                        : addressCount > 0
                          ? `${addressCount} address${addressCount !== 1 ? "es" : ""} detected`
                          : "Paste addresses above"}
                    </span>
                    <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      Upload CSV
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={handleCSVUpload}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Amount slider */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Amount per wallet</label>
                <span className="font-mono text-sm font-semibold text-gray-900">{amount.toFixed(1)} USDC</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>0.1</span>
                <span>0.5</span>
                <span>1.0</span>
                <span>2.0</span>
              </div>
              {addressCount > 0 && (
                <p className={`mt-2 text-xs ${exceedsLimit ? "font-medium text-red-500" : "text-gray-500"}`}>
                  Total: {totalUsdc.toFixed(1)} USDC
                  {exceedsLimit && ` (max ${MAX_TOTAL_USDC} USDC)`}
                </p>
              )}
            </div>

            {/* Privacy toggles */}
            <div className="space-y-0 divide-y divide-gray-100 rounded-lg border border-gray-200">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Randomize Timing</p>
                    <p className="text-xs text-gray-400">
                      Spread deliveries randomly over {maxDelayMinutes} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRandomizeTiming(!randomizeTiming)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      randomizeTiming ? "bg-blue-600" : "bg-gray-200"
                    }`}
                    aria-label="Toggle random timing"
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                        randomizeTiming ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                {randomizeTiming && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Max delay</span>
                      <span className="font-mono text-xs font-semibold text-gray-700">{maxDelayMinutes} min</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={maxDelayMinutes}
                      onChange={e => setMaxDelayMinutes(parseInt(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
                    />
                    <div className="mt-0.5 flex justify-between text-[10px] text-gray-400">
                      <span>1m</span>
                      <span>2m</span>
                      <span>3m</span>
                      <span>4m</span>
                      <span>5m</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Randomize Amounts</p>
                  <p className="text-xs text-gray-400">Vary amounts within ±20% of target</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRandomizeAmounts(!randomizeAmounts)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    randomizeAmounts ? "bg-blue-600" : "bg-gray-200"
                  }`}
                  aria-label="Toggle random amounts"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      randomizeAmounts ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Fund button */}
            <div>
              {!walletAddress ? (
                <div className="flex justify-center">
                  <SignInWithB3
                    chain={BASE_CHAIN}
                    partnerId={PARTNER_ID}
                    closeAfterLogin={true}
                    buttonText="Connect Wallet"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFundClick}
                  disabled={addressCount === 0 || exceedsLimit}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addressCount === 0
                    ? "Enter Address"
                    : exceedsLimit
                      ? `Exceeds ${MAX_TOTAL_USDC} USDC limit`
                      : `Fund ${addressCount} Wallet${addressCount !== 1 ? "s" : ""}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
