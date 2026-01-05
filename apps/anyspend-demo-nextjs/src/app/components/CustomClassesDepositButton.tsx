import type { AnySpendAllClasses } from "@b3dotfun/sdk/anyspend/react";
import { useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

/**
 * Example custom classes that override default styling.
 *
 * IMPORTANT: Custom classes REPLACE default styles entirely (not merge).
 * Pattern used: className={classes?.element || "default-classes"}
 *
 * This example demonstrates a purple/indigo dark theme.
 */
const customClasses: AnySpendAllClasses = {
  // ===== AnySpendDeposit Component =====
  // Controls the chain selection screen and deposit form wrapper
  deposit: {
    // Chain selection container (the initial screen)
    chainSelection:
      "bg-gradient-to-b from-purple-900 to-purple-800 rounded-3xl p-6 text-white max-w-[460px] mx-auto relative",
    closeButton: "text-purple-300 hover:text-white absolute right-4 top-4 z-10",

    // Balance header section
    balanceContainer: "border-b border-purple-600 p-5",
    balanceLabel: "text-purple-300 text-sm",
    balanceValue: "text-white text-3xl font-bold",

    // Chain buttons with balances
    chainsContainer: "flex flex-col gap-2",
    chainButton:
      "bg-purple-700 hover:bg-purple-600 border border-purple-500 rounded-xl p-4 text-white transition-all w-full flex items-center justify-between",
    chainContent: "flex items-center gap-3",
    chainInfo: "flex flex-col",
    chainName: "text-white font-semibold flex items-center gap-1.5",
    chainIcon: "h-5 w-5",
    chainBalance: "text-purple-300 text-xs",
    chainChevron: "text-purple-400 h-5 w-5",

    // General options section
    generalOptions: "flex flex-col gap-2",
    optionsContainer: "flex flex-col gap-2 p-6",
    optionButton:
      "bg-purple-700/30 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-4 text-left transition-all w-full flex items-center justify-between",
    cryptoButton:
      "bg-purple-700/30 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-4 text-left transition-all w-full flex items-center justify-between",
    qrButton:
      "bg-purple-700/30 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-4 text-left transition-all w-full flex items-center justify-between",
    fiatButton:
      "bg-purple-700/30 hover:bg-purple-600/30 border border-purple-500/50 rounded-xl p-4 text-left transition-all w-full flex items-center justify-between",
    optionContent: "flex items-center gap-3",
    optionInfo: "flex flex-col",
    optionTitle: "text-white font-medium",
    optionDescription: "text-purple-300 text-xs",
    optionIcon: "h-10 w-10 text-purple-300",
    optionChevron: "text-purple-400 h-5 w-5",

    // Divider between sections
    divider: "flex items-center gap-3 my-2",
    dividerLine: "bg-purple-600 h-px flex-1",
    dividerText: "text-purple-400 text-sm",

    // Back button in deposit form
    backButton: "text-purple-300 hover:text-white absolute left-4 top-4 z-10 flex items-center gap-1",
    backIcon: "h-5 w-5",
    backText: "text-sm",

    // Deposit form wrapper
    form: "relative bg-gradient-to-b from-purple-900 to-purple-800 rounded-3xl",
    formContent: "pt-8",
  },

  // ===== QRDeposit Component =====
  // Controls the QR code deposit screen
  qrDeposit: {
    // Main container
    container: "bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    content: "flex flex-col gap-4",

    // Header with navigation
    header: "flex items-center justify-between",
    backButton: "text-indigo-300 hover:text-white transition-colors",
    title: "text-white text-lg font-bold",
    closeButton: "text-indigo-300 hover:text-white transition-colors",

    // Token selector
    tokenSelectorContainer: "flex flex-col gap-1.5",
    tokenSelectorLabel: "text-indigo-300 text-sm",
    tokenSelectorTrigger:
      "bg-indigo-700/50 border border-indigo-500 rounded-xl px-4 py-3 text-white flex items-center justify-between w-full",

    // QR code area
    qrContent: "bg-indigo-700/30 border border-indigo-500 rounded-xl p-4 flex items-start gap-4",
    qrCodeContainer: "flex flex-col items-center gap-2",
    qrCode: "bg-white rounded-lg p-2",
    qrScanHint: "text-indigo-300 text-xs text-center",

    // Address display
    addressContainer: "flex flex-col gap-1 flex-1",
    addressLabel: "text-indigo-300 text-sm",
    addressRow: "flex items-start gap-1",
    address: "text-white font-mono text-sm break-all leading-relaxed",
    addressCopyIcon: "text-indigo-300 hover:text-white transition-colors mt-0.5 shrink-0",

    // Watching indicator (for pure transfers)
    watchingIndicator: "flex items-center justify-center gap-2 rounded-lg bg-indigo-500/20 p-3",

    // Copy button
    copyButton:
      "bg-indigo-500 hover:bg-indigo-400 text-white font-medium py-3.5 rounded-xl transition-all w-full flex items-center justify-center gap-2",

    // Loading state
    loadingContainer: "bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    loadingContent: "flex flex-col items-center justify-center gap-4 py-12",
    loadingSpinner: "text-indigo-400 h-8 w-8 animate-spin",
    loadingText: "text-indigo-300 text-sm",

    // Order details wrapper
    orderDetailsContainer: "bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    orderDetailsContent: "relative flex flex-col gap-4",
  },

  // ===== AnySpend (Swap) Component =====
  // Controls the main swap interface
  anySpend: {
    // Main container
    container: "bg-gradient-to-b from-violet-900 to-violet-800 rounded-3xl max-w-[460px] mx-auto overflow-hidden",

    // Header section
    header: "mb-4 flex flex-col items-center gap-3 text-center",
    headerLogo: "border-violet-500 h-12 w-12 rounded-full border-2 shadow-md",
    headerTitle: "text-white text-xl font-bold",

    // Tab section
    tabSection: "w-full",
    tabList: "flex gap-2 p-1 bg-violet-800/50 rounded-lg",
    tabTrigger: "flex-1 px-4 py-2 rounded-md text-violet-300 transition-colors",
    tabTriggerActive: "flex-1 px-4 py-2 rounded-md bg-violet-600 text-white",

    // Main content
    mainContent: "mx-auto flex w-[460px] max-w-full flex-col items-center gap-2 pt-5",

    // Swap direction button (the arrow between pay/receive)
    swapDirectionButton:
      "border-violet-500 bg-violet-800 h-10 w-10 rounded-xl border-2 hover:bg-violet-700 transition-colors",

    // Main action button
    mainButton: "bg-violet-500 hover:bg-violet-400 text-white font-semibold py-3 rounded-xl w-full transition-colors",
    mainButtonDisabled: "bg-violet-800 text-violet-400 py-3 rounded-xl w-full cursor-not-allowed",
    mainButtonError: "bg-red-600 text-white font-semibold py-3 rounded-xl w-full",

    // Transaction history button
    historyButton: "text-violet-300 hover:text-white flex items-center gap-1 transition-colors",

    // Gas indicator
    gasIndicator: "mt-2 w-full text-violet-300",
  },

  // ===== CryptoPaySection Component =====
  // Controls the "Pay" input section
  cryptoPaySection: {
    container: "bg-violet-800/50 border border-violet-600 rounded-2xl p-4",
    label: "text-violet-300 text-sm flex items-center gap-1.5",
    inputContainer: "flex items-center justify-between mt-2",
    input: "text-white text-2xl font-bold bg-transparent border-none outline-none flex-1",
    tokenSelector: "bg-violet-700/50 border border-violet-500 rounded-xl px-3 py-2 flex items-center gap-2",
    tokenIcon: "h-8 w-8 rounded-full",
    tokenSymbol: "text-white font-semibold",
    chainBadge: "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-violet-800",
    balanceRow: "flex items-center justify-between mt-2 text-sm",
    balanceLabel: "text-violet-400",
    balanceValue: "text-violet-300",
    maxButton: "text-violet-400 hover:text-white ml-2 font-medium",
    paymentMethodButton: "text-violet-300 hover:text-white flex items-center gap-1",
    feeRow: "text-violet-400 text-sm mt-1",
  },

  // ===== CryptoReceiveSection Component =====
  // Controls the "Receive" output section
  cryptoReceiveSection: {
    container: "bg-violet-800/30 border border-violet-600/50 rounded-2xl p-4",
    label: "text-violet-300 text-sm flex items-center gap-1.5",
    inputContainer: "flex items-center justify-between mt-2",
    input: "text-white text-2xl font-bold",
    tokenSelector: "bg-violet-600/30 border border-violet-500/50 rounded-xl px-3 py-2 flex items-center gap-2",
    tokenIcon: "h-8 w-8 rounded-full",
    tokenSymbol: "text-violet-300 font-semibold",
    chainBadge: "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-violet-800",
    recipientButton: "text-violet-300 flex items-center gap-2",
    recipientValue: "text-violet-300 flex items-center gap-1 text-sm",
    feeRow: "text-violet-400 text-sm flex items-center gap-2",
  },

  // ===== OrderDetails Component =====
  // Controls the order status/details screen
  orderDetails: {
    container: "bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6",
    header: "flex items-center justify-between mb-4",
    statusBadge: "px-3 py-1 rounded-full text-sm font-medium",
    statusPending: "bg-amber-500/20 text-amber-400",
    statusSuccess: "bg-emerald-500/20 text-emerald-400",
    statusFailed: "bg-red-500/20 text-red-400",
    amountSection: "text-center py-4",
    detailsSection: "space-y-3",
    detailRow: "flex items-center justify-between py-2 border-b border-slate-700",
    detailLabel: "text-slate-400 text-sm",
    detailValue: "text-white text-sm font-medium",
    transactionLink: "text-violet-400 hover:text-violet-300 text-sm underline",
    actionButton: "bg-violet-500 hover:bg-violet-400 text-white font-semibold py-3 rounded-xl w-full mt-4",
    backButton: "text-violet-400 hover:text-violet-300 flex items-center justify-center gap-2 underline w-full mt-2",
    returnButton:
      "bg-violet-500 hover:bg-violet-400 text-white font-semibold py-3 rounded-xl w-full flex items-center justify-center gap-2",
  },

  // ===== RecipientSelection Component =====
  // Controls the recipient address input screen
  recipientSelection: {
    container: "bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    header: "flex items-center gap-4 mb-6",
    backButton: "text-slate-400 hover:text-white h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
    searchInput:
      "bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 w-full focus:outline-none focus:border-violet-500",
    confirmButton:
      "bg-violet-500 hover:bg-violet-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl w-full transition-colors",
  },

  // ===== CryptoPaymentMethod Component =====
  // Controls the crypto payment method selection
  cryptoPaymentMethod: {
    container: "bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    header: "flex items-center justify-around gap-4 mb-6",
    backButton: "text-slate-400 hover:text-white absolute h-8 w-8 flex items-center justify-center rounded-lg",
    optionsList: "flex flex-col gap-3",
    optionItem:
      "bg-slate-800/50 border border-slate-600 rounded-xl p-4 w-full text-left hover:border-violet-500 transition-colors",
    optionItemActive: "bg-violet-500/20 border border-violet-500 rounded-xl p-4 w-full text-left",
  },

  // ===== FiatPaymentMethod Component =====
  // Controls the fiat payment method selection
  fiatPaymentMethod: {
    container: "bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 max-w-[460px] mx-auto",
    header: "flex items-center gap-4 mb-6",
    backButton: "text-slate-400 hover:text-white h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
    optionsList: "flex flex-col gap-3",
    optionItem:
      "bg-slate-800/50 border border-slate-600 rounded-2xl p-4 w-full flex items-center gap-4 hover:border-green-500 transition-colors",
    optionItemActive: "bg-green-500/20 border border-green-500 rounded-2xl p-4 w-full flex items-center gap-4",
  },

  // ===== Warning Text Components =====
  warningText: {
    root: "text-center text-xs italic text-amber-400",
  },
  chainWarningText: {
    root: "text-center text-xs italic text-amber-400 mt-2",
  },
};

export function CustomClassesDepositButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);
  const { address } = useAccountWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(address || "");

  const handleOpenModal = () => {
    setRecipientAddress(address || "");
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!recipientAddress) {
      alert("Please enter recipient address");
      return;
    }

    try {
      setIsModalOpen(false);
      setB3ModalOpen(true);
      setB3ModalContentType({
        type: "anySpendDeposit",
        recipientAddress,
        destinationTokenAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
        destinationTokenChainId: 8453,
        classes: customClasses,
      });
    } catch (error) {
      alert("Failed to open modal");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setRecipientAddress(address || "");
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="group flex h-40 w-full flex-col justify-between overflow-hidden rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-left shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-purple-900">Custom Classes Demo</h3>
          <p className="mt-1 text-sm text-purple-600">Deposit with custom purple/indigo theme using classes prop</p>
        </div>
        <span className="text-xs text-purple-400">Full styling example with all components</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Custom Classes Deposit</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="modal-recipient-address" className="mb-1 block text-sm font-medium text-gray-700">
                  Recipient Address
                </label>
                <input
                  id="modal-recipient-address"
                  type="text"
                  value={recipientAddress}
                  onChange={e => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="rounded-md bg-purple-50 p-3">
                <p className="text-xs text-purple-700">
                  This demo uses the <code className="rounded bg-purple-100 px-1">classes</code> prop to apply a custom
                  dark purple/indigo/violet theme. Classes <strong>completely replace</strong> default styles.
                </p>
                <p className="mt-2 text-xs text-purple-600">
                  Components styled: Deposit, QRDeposit, AnySpend, CryptoPaySection, CryptoReceiveSection, OrderDetails,
                  RecipientSelection, PaymentMethods, WarningText
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
                >
                  Open Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
