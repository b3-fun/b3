"use client";

import type { AnySpendAllClasses } from "@b3dotfun/sdk/anyspend/react";
import { AnySpendDeposit } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import Link from "next/link";
import { SignInButton } from "../components/SignInButton";

/**
 * Custom classes for testing - purple/indigo dark theme
 */
const customClasses: AnySpendAllClasses = {
  deposit: {
    chainSelection: "bg-purple-900 rounded-3xl p-6 text-white max-w-[460px] mx-auto relative",
    closeButton: "text-purple-300 hover:text-white absolute right-4 top-4 z-10",
    balanceContainer: "border-b border-purple-600 p-5",
    balanceLabel: "text-purple-300 text-sm",
    balanceValue: "text-white text-3xl font-bold",
    chainsContainer: "flex flex-col gap-2",
    chainButton:
      "bg-purple-700/50 hover:bg-purple-600/50 border border-purple-500 rounded-xl p-4 text-white transition-all w-full flex items-center justify-between",
    chainName: "text-white font-semibold flex items-center gap-1.5",
    chainBalance: "text-purple-300 text-xs",
    chainChevron: "text-purple-400 h-5 w-5",
    optionsContainer: "flex flex-col gap-2 p-6",
    optionButton:
      "bg-purple-700/30 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-4 text-left transition-all w-full flex items-center justify-between",
    optionTitle: "text-white font-medium",
    optionDescription: "text-purple-300 text-xs",
    divider: "flex items-center gap-3 my-2",
    dividerLine: "bg-purple-600 h-px flex-1",
    dividerText: "text-purple-400 text-sm",
    backButton: "text-purple-300 hover:text-white absolute left-4 top-4 z-10 flex items-center gap-1",
    form: "relative bg-gradient-to-b from-purple-900 to-purple-800 rounded-3xl",
  },
  qrDeposit: {
    container: "bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    content: "flex flex-col gap-4",
    header: "flex items-center justify-between",
    backButton: "text-indigo-300 hover:text-white transition-colors",
    title: "text-white text-lg font-bold",
    closeButton: "text-indigo-300 hover:text-white transition-colors",
    tokenSelectorContainer: "flex flex-col gap-1.5",
    tokenSelectorLabel: "text-indigo-300 text-sm",
    tokenSelectorTrigger:
      "bg-indigo-700/50 border border-indigo-500 rounded-xl px-4 py-3 text-white flex items-center justify-between w-full",
    qrContent: "bg-indigo-700/30 border border-indigo-500 rounded-xl p-4 flex items-start gap-4",
    qrCodeContainer: "flex flex-col items-center gap-2",
    qrCode: "bg-white rounded-lg p-2",
    qrScanHint: "text-indigo-300 text-xs text-center",
    addressContainer: "flex flex-col gap-1 flex-1",
    addressLabel: "text-indigo-300 text-sm",
    addressRow: "flex items-start gap-1",
    address: "text-white font-mono text-sm break-all leading-relaxed",
    addressCopyIcon: "text-indigo-300 hover:text-white transition-colors mt-0.5 shrink-0",
    copyButton:
      "bg-indigo-500 hover:bg-indigo-400 text-white font-medium py-3.5 rounded-xl transition-all w-full flex items-center justify-center gap-2",
    loadingContainer: "bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    loadingContent: "flex flex-col items-center justify-center gap-4 py-12",
    loadingSpinner: "text-indigo-400 h-8 w-8 animate-spin",
    loadingText: "text-indigo-300 text-sm",
  },
  warningText: {
    root: "text-center text-xs italic text-amber-400",
  },
  chainWarningText: {
    root: "text-center text-xs italic text-amber-400 mt-2",
  },
};

export default function CustomDepositPage() {
  const { address } = useAccountWallet();

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
          <SignInButton />
          <h1 className="mt-4 text-2xl font-bold text-white">Custom Classes Test Page</h1>
          <p className="mt-2 text-gray-400">Testing AnySpendDeposit with custom classes in page mode (not modal)</p>
        </div>

        {address ? (
          <AnySpendDeposit
            mode="modal"
            recipientAddress={address}
            destinationTokenAddress="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
            destinationTokenChainId={8453}
            classes={customClasses}
          />
        ) : (
          <div className="rounded-xl bg-gray-800 p-8 text-center">
            <p className="text-gray-400">Please connect your wallet to test the deposit component</p>
          </div>
        )}
      </div>
    </div>
  );
}
