import { ALL_CHAINS, getExplorerTxUrl } from "@b3dotfun/sdk/anyspend";
import { ChainTokenIcon } from "@b3dotfun/sdk/anyspend/react/components/common/ChainTokenIcon";
import {
  useAccountWallet,
  useAnalytics,
  useModalStore,
  useSimBalance,
  useUnifiedChainSwitchAndExecute,
} from "@b3dotfun/sdk/global-account/react";
import { formatDisplayNumber, formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { ChevronDown, CircleHelp, Copy, Loader2, Send as SendIcon, X } from "lucide-react";
import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from "viem";
import type { SimBalanceItem } from "../../hooks/useSimBalance";
import { Button } from "../ui/button";

export interface SendModalProps {
  recipientAddress?: string;
  onSuccess?: (txHash?: string) => void;
}

export function Send({ recipientAddress: initialRecipient, onSuccess }: SendModalProps) {
  const { address } = useAccountWallet();
  const navigateBack = useModalStore(state => state.navigateBack);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const history = useModalStore(state => state.history);

  // State
  const [selectedToken, setSelectedToken] = useState<SimBalanceItem | null>(null);
  const [recipientAddress, setRecipientAddress] = useState(initialRecipient || "");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [showTokenList, setShowTokenList] = useState(false);

  // Hooks - use address from useAccountWallet for the smart wallet
  const { data: simBalance, refetch: refetchSimBalance, isLoading: isLoadingBalance } = useSimBalance(address);
  const { switchChainAndExecute } = useUnifiedChainSwitchAndExecute();
  const { sendAnalyticsEvent } = useAnalytics();

  // Address validation
  const handleRecipientAddressChange = (value: string) => {
    setRecipientAddress(value);
    if (value && !isAddress(value)) {
      setAddressError("Please enter a valid EVM address (0x...)");
    } else {
      setAddressError("");
    }
  };

  // Percentage button handler
  const handlePercentageClick = (percentage: number) => {
    if (selectedToken) {
      const tokenBalance = (BigInt(selectedToken.amount) * BigInt(percentage)) / BigInt(100);
      const amount = formatTokenAmount(tokenBalance, selectedToken.decimals, 30, false);
      setSendAmount(amount);
    }
  };

  // Send transaction
  const handleSend = async () => {
    const sendAmountWithoutCommas = sendAmount.replace(/,/g, "");

    if (!selectedToken || !recipientAddress || !sendAmount || parseFloat(sendAmountWithoutCommas) <= 0) {
      return;
    }

    setIsSending(true);

    const amountInWei = parseUnits(sendAmountWithoutCommas, selectedToken.decimals);

    const analyticsData = {
      amount: sendAmount,
      symbol: selectedToken.symbol,
      chain_id: selectedToken.chain_id,
      address: selectedToken.address,
    };

    try {
      invariant(isAddress(recipientAddress), "Recipient address is not a valid address");

      const sendTokenData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipientAddress, amountInWei],
      });

      const tx = await switchChainAndExecute(selectedToken.chain_id, {
        to: selectedToken.address === "native" ? recipientAddress : selectedToken.address,
        data: sendTokenData,
        value: selectedToken.address === "native" ? amountInWei : BigInt(0),
      });

      if (tx) {
        sendAnalyticsEvent("send_token_button_click", {
          ...analyticsData,
          success: true,
          tx: getExplorerTxUrl(selectedToken.chain_id, tx),
        });

        toast.success(`Successfully sent ${sendAmount} ${selectedToken.symbol}`);
        setSendAmount("");
        setRecipientAddress("");
        setSelectedToken(null);

        if (onSuccess) {
          onSuccess(tx);
        }

        // Wait and refetch
        setTimeout(async () => {
          await refetchSimBalance();
        }, 1000);
      }
    } catch (error: any) {
      sendAnalyticsEvent("send_token_button_click", {
        ...analyticsData,
        success: false,
        reason: error.message || "Unknown error",
      });

      toast.error(`Failed to send ${selectedToken.symbol}: ${error.message || "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#e4e4e7] bg-white px-5 py-3">
        {history.length > 0 ? (
          <button
            onClick={navigateBack}
            className="flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-70"
          >
            <ChevronDown className="h-6 w-6 rotate-90 text-[#51525c]" />
          </button>
        ) : (
          <div className="h-6 w-6" />
        )}
        <p className="text-lg font-semibold leading-7 text-[#18181b]">Send</p>
        <button
          onClick={() => setB3ModalOpen(false)}
          className="flex h-6 w-6 items-center justify-center transition-opacity hover:opacity-70"
        >
          <X className="h-6 w-6 text-[#51525c]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col space-y-6 pb-6 pt-6">
        {/* Token Selector */}
        <div className="space-y-2 px-6">
          <label className="text-b3-grey font-neue-montreal-medium text-sm">Token</label>
          {selectedToken ? (
            <div className="border-b3-line bg-b3-background hover:border-b3-primary-blue group flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center">
                  {ALL_CHAINS[selectedToken.chain_id]?.logoUrl ? (
                    <ChainTokenIcon
                      chainUrl={ALL_CHAINS[selectedToken.chain_id].logoUrl}
                      tokenUrl={selectedToken.token_metadata?.logo}
                      className="size-10"
                    />
                  ) : (
                    <CircleHelp className="text-b3-react-foreground size-10" />
                  )}
                </div>
                <div>
                  <div className="text-b3-grey font-neue-montreal-semibold">{selectedToken.symbol}</div>
                  <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                    {formatTokenAmount(BigInt(selectedToken.amount), selectedToken.decimals)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTokenList(true)}
                className="text-b3-primary-blue font-neue-montreal-semibold hover:text-b3-primary-blue/80 text-sm transition-colors"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTokenList(true)}
              className="border-b3-line bg-b3-background hover:border-b3-primary-blue flex w-full items-center justify-between rounded-xl border p-4 transition-all"
              disabled={isLoadingBalance}
            >
              <span className="text-b3-foreground-muted font-neue-montreal-medium">Select a token</span>
              <ChevronDown className="text-b3-grey h-5 w-5" />
            </button>
          )}
        </div>

        {/* Token List Modal */}
        {showTokenList && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
            <div className="bg-b3-background max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl md:rounded-2xl">
              <div className="border-b-b3-line flex items-center justify-between border-b p-4">
                <h3 className="text-b3-grey font-neue-montreal-semibold text-lg">Select Token</h3>
                <button onClick={() => setShowTokenList(false)}>
                  <X className="text-b3-grey h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {isLoadingBalance ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-b3-foreground-muted h-8 w-8 animate-spin" />
                  </div>
                ) : simBalance?.balances && simBalance.balances.length > 0 ? (
                  <div className="space-y-1">
                    {simBalance.balances.map(token => (
                      <button
                        key={token.chain_id + "_" + token.address}
                        onClick={() => {
                          setSelectedToken(token);
                          setShowTokenList(false);
                        }}
                        className="hover:bg-b3-line/60 flex w-full items-center justify-between rounded-xl p-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center">
                            {ALL_CHAINS[token.chain_id]?.logoUrl ? (
                              <ChainTokenIcon
                                chainUrl={ALL_CHAINS[token.chain_id].logoUrl}
                                tokenUrl={token.token_metadata?.logo}
                                className="size-10"
                              />
                            ) : (
                              <CircleHelp className="text-b3-react-foreground size-10" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="text-b3-grey font-neue-montreal-semibold">{token.symbol}</div>
                            <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                              {token.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-b3-grey font-neue-montreal-semibold">
                            {formatTokenAmount(BigInt(token.amount), token.decimals)}
                          </div>
                          <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                            {formatDisplayNumber(token.value_usd, { style: "currency", fractionDigits: 2 })}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CircleHelp className="text-b3-foreground-muted mb-4 h-8 w-8" />
                    <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">No tokens available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recipient Address */}
        <div className="space-y-2 px-6">
          <label className="text-b3-grey font-neue-montreal-medium text-sm">Recipient Address</label>
          <div className="space-y-1">
            <div className="relative">
              <input
                type="text"
                value={recipientAddress}
                onChange={e => handleRecipientAddressChange(e.target.value)}
                placeholder="Enter wallet address (0x...)"
                className={`border-b3-line bg-b3-background text-b3-grey font-neue-montreal-medium placeholder:text-b3-foreground-muted w-full rounded-xl border px-4 py-3 pr-12 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  addressError ? "border-red-500 focus:border-red-500" : "focus:border-b3-primary-blue"
                }`}
                disabled={isSending}
              />
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-b3-line/60 absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                disabled={isSending}
                onClick={() => {
                  navigator.clipboard.readText().then(text => {
                    handleRecipientAddressChange(text);
                  });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {addressError && <p className="font-neue-montreal-medium text-xs text-red-500">{addressError}</p>}
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2 px-6">
          <label className="text-b3-grey font-neue-montreal-medium text-sm">Amount</label>
          <div className="space-y-3">
            <NumericFormat
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
              className="border-b3-line bg-b3-background text-b3-grey font-neue-montreal-medium placeholder:text-b3-foreground-muted focus:border-b3-primary-blue w-full rounded-xl border px-4 py-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              pattern="^[0-9]*[.,]?[0-9]*$"
              disabled={isSending || !selectedToken}
              value={sendAmount}
              allowNegative={false}
              onChange={e => setSendAmount(e.currentTarget.value)}
            />

            {/* Percentage buttons */}
            {selectedToken && (
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map(percentage => (
                  <Button
                    key={percentage}
                    variant="outline"
                    onClick={() => handlePercentageClick(percentage)}
                    className="hover:bg-b3-primary-wash border-b3-line text-b3-grey font-neue-montreal-medium text-sm"
                    disabled={isSending}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            )}

            {/* Available balance */}
            {selectedToken && (
              <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                Available: {formatTokenAmount(BigInt(selectedToken.amount), selectedToken.decimals)}{" "}
                {selectedToken.symbol}
              </div>
            )}
          </div>
        </div>

        {/* Send Button */}
        <div className="px-6">
          <Button
            onClick={handleSend}
            disabled={
              !selectedToken ||
              !recipientAddress ||
              !sendAmount ||
              parseFloat(sendAmount) <= 0 ||
              isSending ||
              !!addressError ||
              !isAddress(recipientAddress)
            }
            className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold disabled:bg-b3-line disabled:text-b3-foreground-muted h-12 w-full rounded-xl text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                Send {selectedToken?.symbol || "Token"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
