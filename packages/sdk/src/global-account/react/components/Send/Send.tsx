import { ALL_CHAINS, getExplorerTxUrl } from "@b3dotfun/sdk/anyspend";
import { ChainTokenIcon } from "@b3dotfun/sdk/anyspend/react/components/common/ChainTokenIcon";
import {
  toast,
  useAccountWallet,
  useAnalytics,
  useModalStore,
  useProfile,
  useSimBalance,
  useUnifiedChainSwitchAndExecute,
} from "@b3dotfun/sdk/global-account/react";
import { formatDisplayNumber, formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import invariant from "invariant";
import { CircleHelp, Clock, Loader2, Send as SendIcon, Wallet } from "lucide-react";
import { useState } from "react";
import { NumericFormat } from "react-number-format";

import { encodeFunctionData, erc20Abi, isAddress, parseUnits } from "viem";

import type { SimBalanceItem } from "../../hooks/useSimBalance";
import { useRecentAddressesStore } from "../../stores/useRecentAddressesStore";
import ModalHeader from "../ModalHeader/ModalHeader";
import { Button } from "../ui/button";

export interface SendModalProps {
  recipientAddress?: string;
  onSuccess?: (txHash?: string) => void;
}

type SendStep = "recipient" | "token" | "amount" | "confirm" | "success";

// Component for displaying a recent address with profile data
function RecentAddressItem({ address, onClick }: { address: string; onClick: () => void }) {
  const { data: profileData } = useProfile({ address });

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-[#fafafa]"
    >
      {/* Avatar */}
      {profileData?.avatar ? (
        <img src={profileData.avatar} alt={profileData.name || address} className="h-10 w-10 rounded-full" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e7] bg-[#f4f4f5]">
          <Wallet className="h-5 w-5 text-[#a0a0ab]" />
        </div>
      )}
      {/* Address and Name */}
      <div className="flex flex-col items-start">
        <span className="font-neue-montreal-medium text-base tracking-[-0.32px] text-[#70707b]">
          {address.slice(0, 6)}...{address.slice(-4)}
          {profileData?.name && ` (${profileData.name})`}
        </span>
      </div>
    </button>
  );
}

export function Send({ recipientAddress: initialRecipient, onSuccess }: SendModalProps) {
  const { address } = useAccountWallet();
  const navigateBack = useModalStore(state => state.navigateBack);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);

  // Wizard state
  const [step, setStep] = useState<SendStep>("recipient");
  const [selectedToken, setSelectedToken] = useState<SimBalanceItem | null>(null);
  const [recipientAddress, setRecipientAddress] = useState(initialRecipient || "");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [showValidatedResult, setShowValidatedResult] = useState(false);

  // Hooks
  const { data: simBalance, refetch: refetchSimBalance, isLoading: isLoadingBalance } = useSimBalance(address);
  const { switchChainAndExecute } = useUnifiedChainSwitchAndExecute();
  const { sendAnalyticsEvent } = useAnalytics();

  // Recent addresses store
  const recentAddresses = useRecentAddressesStore(state => state.recentAddresses);
  const addRecentAddress = useRecentAddressesStore(state => state.addRecentAddress);

  // Fetch profile data for validated address
  const { data: validatedProfileData } = useProfile({
    address: showValidatedResult && recipientAddress && isAddress(recipientAddress) ? recipientAddress : undefined,
  });

  // Address validation
  const handleRecipientAddressChange = (value: string) => {
    setRecipientAddress(value);
    setShowValidatedResult(false);
    if (value && !isAddress(value)) {
      setAddressError("Please enter a valid EVM address (0x...)");
    } else {
      setAddressError("");
      if (value && isAddress(value)) {
        setShowValidatedResult(true);
      }
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmedText = text.trim();
      setRecipientAddress(trimmedText);

      if (trimmedText && isAddress(trimmedText)) {
        setAddressError("");
        setShowValidatedResult(true);
      } else if (trimmedText) {
        setAddressError("Please enter a valid EVM address (0x...)");
        setShowValidatedResult(false);
      }
    } catch (error) {
      toast.error("Failed to read clipboard");
    }
  };

  // Handle clicking on the validated result to proceed
  const handleSelectValidatedAddress = () => {
    if (recipientAddress && isAddress(recipientAddress)) {
      addRecentAddress(recipientAddress);
      setStep("token");
    }
  };

  // Go to previous step
  const handleBack = () => {
    if (step === "token") setStep("recipient");
    else if (step === "amount") setStep("token");
    else if (step === "confirm") setStep("amount");
    else navigateBack();
  };

  // Get current selected token from fresh balance
  const getCurrentSelectedToken = (): SimBalanceItem | null => {
    if (!selectedToken || !simBalance?.balances) {
      return null;
    }
    const found = simBalance.balances.find(
      token => token.chain_id === selectedToken.chain_id && token.address === selectedToken.address,
    );
    return found || null;
  };

  // Percentage button handler
  const handlePercentageClick = (percentage: number) => {
    const currentToken = getCurrentSelectedToken();
    if (currentToken) {
      const tokenBalance = (BigInt(currentToken.amount) * BigInt(percentage)) / BigInt(100);
      const amount = formatTokenAmount(tokenBalance, currentToken.decimals, 30, false);
      setSendAmount(amount);
    }
  };

  // Send transaction
  const handleSend = async () => {
    const sendAmountWithoutCommas = sendAmount.replace(/,/g, "");
    const currentToken = getCurrentSelectedToken();

    if (!currentToken || !recipientAddress || !sendAmount || parseFloat(sendAmountWithoutCommas) <= 0) {
      return;
    }

    setIsSending(true);

    const amountInWei = parseUnits(sendAmountWithoutCommas, currentToken.decimals);

    const analyticsData = {
      amount: sendAmount,
      symbol: currentToken.symbol,
      chain_id: currentToken.chain_id,
      address: currentToken.address,
    };

    try {
      invariant(isAddress(recipientAddress), "Recipient address is not a valid address");

      const sendTokenData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipientAddress, amountInWei],
      });

      const tx = await switchChainAndExecute(currentToken.chain_id, {
        to: currentToken.address === "native" ? recipientAddress : currentToken.address,
        data: sendTokenData,
        value: currentToken.address === "native" ? amountInWei : BigInt(0),
      });

      if (tx) {
        sendAnalyticsEvent("send_token_button_click", {
          ...analyticsData,
          success: true,
          tx: getExplorerTxUrl(currentToken.chain_id, tx),
        });

        setStep("success");
        toast.success(`Successfully sent ${sendAmount} ${currentToken.symbol}`);

        if (onSuccess) {
          onSuccess(tx);
        }

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

      toast.error(`Failed to send ${currentToken.symbol}: ${error.message || "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  };

  // Get step title
  const getStepTitle = () => {
    switch (step) {
      case "recipient":
        return "Select Recipient";
      case "token":
        return "Select Token";
      case "amount":
        return "Enter Amount";
      case "confirm":
        return "Confirm";
      case "success":
        return "Sent!";
      default:
        return "Send";
    }
  };

  return (
    <div className="dark:bg-b3-background flex h-[600px] w-full flex-col bg-white">
      <ModalHeader handleBack={handleBack} title={getStepTitle()} />

      {/* Content - 20px padding */}
      <div className="flex-1 overflow-y-auto">
        {step === "recipient" && (
          <div className="flex flex-col gap-6 p-5">
            {/* Input field - 48px height */}
            <div className="dark:border-b3-line dark:bg-b3-background flex h-12 w-full items-stretch overflow-hidden rounded-lg border border-[#d1d1d6] bg-white">
              {/* "To" addon - 48px width */}
              <div className="flex w-12 items-center justify-center bg-transparent px-3 py-2">
                <span className="font-neue-montreal-medium text-base text-[#3f3f46] dark:text-white">To</span>
              </div>
              {/* Input */}
              <div className="flex flex-1 items-center border-l border-[#d1d1d6] px-3 py-2">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={e => handleRecipientAddressChange(e.target.value)}
                  placeholder="ENS or Address"
                  className="font-neue-montreal-medium dark:bg-b3-background flex-1 text-base text-[#70707b] outline-none placeholder:text-[#70707b] dark:text-white dark:placeholder:text-white"
                />
                {/* Paste badge */}
                <button
                  onClick={handlePaste}
                  className="font-inter ml-2 rounded-md border border-[#e4e4e7] bg-[#fafafa] px-2.5 py-0.5 text-sm font-medium text-[#3f3f46] transition-colors hover:bg-[#f4f4f5]"
                >
                  Paste
                </button>
              </div>
            </div>

            {addressError && <p className="font-neue-montreal-medium -mt-4 text-xs text-red-500">{addressError}</p>}

            {/* Validated Result Section */}
            {showValidatedResult && recipientAddress && isAddress(recipientAddress) && (
              <div className="flex flex-col gap-2">
                {/* Result Header */}
                <div className="flex items-center gap-1">
                  <span className="font-sf-pro-text text-sm font-semibold leading-[1.3] tracking-[-0.41px] text-[#0b57c2]">
                    Result
                  </span>
                </div>

                {/* Validated Address Card */}
                <button
                  onClick={handleSelectValidatedAddress}
                  className="dark:bg-b3-background dark:border-b3-line flex items-center gap-2 rounded-xl bg-[#f4f4f5] px-3 py-2 transition-colors hover:bg-[#e4e4e7]"
                >
                  {/* Avatar */}
                  {validatedProfileData?.avatar ? (
                    <img
                      src={validatedProfileData.avatar}
                      alt={validatedProfileData.name || recipientAddress}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="dark:border-b3-line dark:bg-b3-background flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e7] bg-[#f4f4f5]">
                      <Wallet className="h-5 w-5 text-[#a0a0ab] dark:text-white" />
                    </div>
                  )}
                  {/* Address and Name */}
                  <span className="font-neue-montreal-medium text-base tracking-[-0.32px] text-[#70707b] dark:text-white">
                    {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                    {validatedProfileData?.name && ` (${validatedProfileData.name})`}
                  </span>
                </button>
              </div>
            )}

            {/* Recents Container */}
            {recentAddresses.length > 0 && (
              <div className="flex flex-col gap-2">
                {/* Recents Header */}
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#3f3f46]" />
                  <span className="font-sf-pro-text text-sm font-semibold leading-[1.3] tracking-[-0.41px] text-[#3f3f46]">
                    Recents
                  </span>
                </div>

                {/* Recent addresses list */}
                <div className="flex flex-col">
                  {recentAddresses.map((recent, index) => (
                    <RecentAddressItem
                      key={index}
                      address={recent.address}
                      onClick={() => {
                        // Just fill the input and show validation - don't auto-proceed
                        handleRecipientAddressChange(recent.address);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "token" && (
          <div className="flex flex-col p-5">
            {isLoadingBalance ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-b3-line h-10 w-10 animate-pulse rounded-full"></div>
                        <div>
                          <div className="bg-b3-line mb-1 h-4 w-16 animate-pulse rounded"></div>
                          <div className="bg-b3-line h-3 w-24 animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="bg-b3-line mb-1 h-4 w-20 animate-pulse rounded"></div>
                        <div className="bg-b3-line h-3 w-16 animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : simBalance?.balances && simBalance.balances.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  {simBalance.balances.map(token => (
                    <div
                      key={token.chain_id + "_" + token.address}
                      className="hover:bg-b3-line/60 dark:hover:bg-b3-primary-wash/40 group flex cursor-pointer items-center justify-between rounded-xl p-3 transition-all duration-200"
                      onClick={() => {
                        setSelectedToken(token);
                        setStep("amount");
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full">
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
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-b3-grey font-neue-montreal-semibold transition-colors duration-200 group-hover:font-bold group-hover:text-black">
                              {token.symbol}
                            </span>
                          </div>
                          <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm transition-colors duration-200 group-hover:text-gray-700">
                            {token.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-b3-grey font-neue-montreal-semibold transition-colors duration-200 group-hover:font-bold group-hover:text-black">
                          {formatTokenAmount(BigInt(token.amount), token.decimals)}
                        </div>
                        <div className="text-b3-foreground-muted font-neue-montreal-medium text-sm transition-colors duration-200 group-hover:text-gray-700">
                          {formatDisplayNumber(token.value_usd, { style: "currency", fractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CircleHelp className="text-b3-foreground-muted mb-4 h-8 w-8" />
                <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">No tokens available</p>
              </div>
            )}
          </div>
        )}

        {step === "amount" && selectedToken && (
          <div className="flex flex-col gap-6 p-5">
            {/* Selected Token Display */}
            <div className="dark:border-b3-line dark:bg-b3-background flex items-center justify-between rounded-xl border border-[#d1d1d6] bg-[#fafafa] p-3">
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
                  <div className="font-neue-montreal-semibold text-base text-[#18181b] dark:text-white">
                    {selectedToken.symbol}
                  </div>
                  <div className="font-neue-montreal-medium text-sm text-[#70707b] dark:text-white">
                    {formatTokenAmount(BigInt(selectedToken.amount), selectedToken.decimals)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep("token")}
                className="text-b3-primary-blue font-neue-montreal-semibold hover:text-b3-primary-blue/80 text-sm transition-colors dark:text-white"
              >
                Change
              </button>
            </div>

            {/* Amount Input */}
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
                className="font-neue-montreal-medium placeholder:text-b3-foreground-muted dark:border-b3-line dark:bg-b3-background w-full rounded-lg border border-[#d1d1d6] bg-white px-3 py-2 text-base text-[#18181b] outline-none focus:border-[#0c68e9] dark:text-white"
                pattern="^[0-9]*[.,]?[0-9]*$"
                disabled={isSending}
                value={sendAmount}
                allowNegative={false}
                onValueChange={values => setSendAmount(values.value)}
              />

              {/* Percentage buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map(percentage => (
                  <Button
                    key={percentage}
                    variant="outline"
                    onClick={() => handlePercentageClick(percentage)}
                    className="font-neue-montreal-medium dark:border-b3-line dark:bg-b3-background border-[#d1d1d6] text-sm text-[#18181b] hover:bg-[#fafafa] dark:text-white"
                    disabled={isSending}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>

              {/* Available balance */}
              <div className="font-neue-montreal-medium text-sm text-[#70707b]">
                Available: {formatTokenAmount(BigInt(selectedToken.amount), selectedToken.decimals)}{" "}
                {selectedToken.symbol}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={() => setStep("confirm")}
              disabled={!sendAmount || parseFloat(sendAmount) <= 0}
              className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold disabled:bg-b3-line disabled:text-b3-foreground-muted h-12 w-full rounded-xl text-white"
            >
              Continue
            </Button>
          </div>
        )}

        {step === "confirm" && selectedToken && (
          <div className="flex min-h-full flex-col">
            {/* Top section with icon and amount */}
            <div className="flex flex-col items-center gap-4 px-5 pb-0 pt-6">
              {/* Send icon */}
              <div className="dark:bg-b3-line flex h-14 w-14 items-center justify-center rounded-full bg-[#d5e5fd]">
                <SendIcon className="h-7 w-7 text-[#0c68e9]" />
              </div>

              {/* Amount */}
              <div className="flex items-center gap-1">
                <span className="font-neue-montreal-semibold text-[30px] leading-[38px] text-[#18181b] dark:text-white">
                  {sendAmount}
                </span>
                <span className="font-neue-montreal-semibold text-[30px] leading-[38px] text-[#70707b] dark:text-white">
                  {selectedToken.symbol}
                </span>
              </div>
            </div>

            {/* Spacing */}
            <div className="h-5" />

            {/* Transaction details */}
            <div className="flex flex-col gap-3 px-5">
              <div className="dark:border-b3-line dark:bg-b3-background rounded-xl border border-[#e4e4e7] bg-[#fafafa] p-4">
                <div className="flex flex-col gap-3">
                  {/* To */}
                  <div className="dark:border-b3-line flex items-center justify-between border-b border-[#e4e4e7] pb-3">
                    <span className="font-inter text-sm font-normal leading-5 text-[#51525c] dark:text-white">To</span>
                    <span className="font-inter text-sm font-normal leading-5 text-[#18181b] dark:text-white">
                      Wallet ({recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)})
                    </span>
                  </div>

                  {/* Network */}
                  <div className="dark:border-b3-line flex items-center justify-between border-b border-[#e4e4e7] pb-3">
                    <span className="font-inter text-sm font-normal leading-5 text-[#51525c] dark:text-white">
                      Network
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-inter text-sm font-normal leading-5 text-[#51525c] dark:text-white">
                        {ALL_CHAINS[selectedToken.chain_id]?.name || "Unknown"}
                      </span>
                      {ALL_CHAINS[selectedToken.chain_id]?.logoUrl && (
                        <img
                          src={ALL_CHAINS[selectedToken.chain_id].logoUrl}
                          alt={ALL_CHAINS[selectedToken.chain_id]?.name}
                          className="h-4 w-4 rounded-full"
                        />
                      )}
                    </div>
                  </div>

                  {/* Network fee */}
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-sm font-normal leading-5 text-[#51525c] dark:text-white">
                      Network fee
                    </span>
                    <span className="font-inter text-sm font-normal leading-5 text-[#18181b] dark:text-white">
                      $0.1
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer to push buttons to bottom */}
            <div className="flex-1" />

            {/* Bottom buttons */}
            <div className="dark:border-b3-line dark:bg-b3-background flex gap-4 border-t border-[#e4e4e7] bg-[#fafafa] p-4">
              <Button
                onClick={handleBack}
                disabled={isSending}
                variant="outline"
                className="font-inter h-12 flex-1 rounded-xl border border-[#e4e4e7] bg-white text-base font-semibold text-[#3f3f46] shadow-[inset_0px_0px_0px_1px_rgba(10,13,18,0.18),inset_0px_-2px_0px_0px_rgba(10,13,18,0.05)] hover:bg-[#fafafa]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="font-inter border-white/12 h-12 flex-1 rounded-xl border-2 bg-[#0c68e9] text-base font-semibold text-white shadow-[inset_0px_0px_0px_1px_rgba(10,13,18,0.18),inset_0px_-2px_0px_0px_rgba(10,13,18,0.05)] hover:bg-[#0b5fd4]"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && selectedToken && (
          <div className="flex h-full flex-col items-center justify-center gap-6 p-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <SendIcon className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h3 className="font-neue-montreal-semibold mb-2 text-xl text-[#18181b]">Sent!</h3>
              <p className="font-neue-montreal-medium text-sm text-[#70707b]">
                {sendAmount} {selectedToken.symbol} was sent to {recipientAddress.slice(0, 6)}...
                {recipientAddress.slice(-4)}
              </p>
            </div>
            <Button
              onClick={() => setB3ModalOpen(false)}
              className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold h-12 w-full rounded-xl text-white"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
