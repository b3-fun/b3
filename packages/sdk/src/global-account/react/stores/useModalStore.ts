import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { GenerateSigMintResponse } from "@b3dotfun/sdk/anyspend/types/signatureMint";
import { AllowedStrategy } from "@b3dotfun/sdk/global-account/react";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { Address, Chain } from "thirdweb";
import { Account } from "thirdweb/wallets";
import { create } from "zustand";

/**
 * Base modal props that all modal types extend
 */
interface BaseModalProps {
  /** Whether to show a back button in the modal header */
  showBackButton?: boolean;
}

/**
 * Props for the Sign In With B3 modal
 * Handles authentication flow with various providers
 */
export interface SignInWithB3ModalProps extends BaseModalProps {
  /** Modal type identifier */
  type: "signInWithB3";
  /** Authentication provider to use for sign-in */
  strategies?: AllowedStrategy[];
  /** Callback function called when login is successful */
  onLoginSuccess?: (account: Account) => void;
  /** Callback function called when session key is successfully added */
  onSessionKeySuccess?: () => void;
  /** Callback function called when an error occurs */
  onError?: (error: Error) => Promise<void>;
  /** Blockchain chain information */
  chain: Chain;
  /** Address of the session key, typically the user's login address */
  sessionKeyAddress?: Address;
  /** Unique identifier for the partner application */
  partnerId: string;
  /** Whether to authenticate with Sign In With Ethereum */
  loginWithSiwe?: boolean;
  /** Whether to close the modal after successful login */
  closeAfterLogin?: boolean;
  /** Source of the sign-in request */
  source?: "signInWithB3Button" | "requestPermissions";
  /** Whether to show the signers enabled modal */
  signersEnabled?: boolean;
}

/**
 * Props for the Request Permissions modal
 * Used to request permission for session keys to interact with contracts
 */
export interface RequestPermissionsModalProps extends BaseModalProps {
  /** Modal type identifier */
  type: "requestPermissions";
  /** Callback function called when permissions are successfully granted */
  onSuccess?: () => void;
  /** Callback function called when an error occurs */
  onError?: (error: Error) => Promise<void>;
  /** Blockchain chain information */
  chain?: Chain;
  /** Address of the session key to grant permissions to */
  sessionKeyAddress?: Address;
  /** Permissions to request */
  permissions?: PermissionsConfig;
}

/**
 * Props for the Manage Account modal
 * Allows users to manage their account settings and actions
 */
export interface ManageAccountModalProps extends BaseModalProps {
  /** Modal type identifier */
  type: "manageAccount";
  /** Callback function called when user logs out */
  onLogout?: () => void;
  /** Callback function called when user initiates a swap */
  onSwap?: () => void;
  /** Callback function called when user initiates a deposit */
  onDeposit?: () => void;
  /** Callback function called when user views their profile */
  onViewProfile?: () => void;
  /** Blockchain chain information */
  chain: Chain;
  /** Partner ID */
  partnerId: string;
  /** Active Tab */
  activeTab?: "balance" | "tokens" | "assets" | "apps" | "settings";
  /** Function to set the active tab */
  setActiveTab?: (tab: "balance" | "tokens" | "assets" | "apps" | "settings") => void;
}

/**
 * Props for the AnySpend modal
 * Handles cross-chain token transfers and transactions
 */
export interface AnySpendModalProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpend";
  /** The default active tab */
  defaultActiveTab?: "crypto" | "fiat";
  /** Chain ID of the source blockchain */
  sourceChainId?: number;
  /** Chain ID of the destination blockchain */
  destinationChainId?: number;
  /** Token address or identifier on the source chain */
  sourceToken?: string;
  /** Token address or identifier on the destination chain */
  destinationToken?: string;
  /** Amount of tokens to send from source chain */
  sourceAmount?: string;
  /** Amount of tokens to receive on destination chain */
  destinationAmount?: string;
  /** Address to receive the tokens on the destination chain */
  recipientAddress?: string;
  /** Unique identifier for an existing order */
  orderId?: string;
  /** Whether to hide the transaction history button */
  hideTransactionHistoryButton?: boolean;
  /** Callback function called when the transaction is successful */
  onSuccess?: () => void;
  /** Token address of the destination token to buy (enables buy mode) */
  destinationTokenAddress?: string;
  /** Chain ID where the destination token exists (enables buy mode) */
  destinationTokenChainId?: number;
}

/**
 * Props for the AnySpend NFT modal
 * Handles NFT-specific operations
 */
export interface AnySpendNftProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendNft";
  /** NFT contract information */
  nftContract: components["schemas"]["NftContract"];
  /** Recipient address to receive the NFT */
  recipientAddress?: string;
  /** Callback function called when the NFT is successfully transferred */
  onSuccess?: (txHash?: string) => void;
}

/**
 * Props for the AnySpend tournament modal
 */
export interface AnySpendJoinTournamentProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendJoinTournament";
  /** Recipient address to join the tournament for */
  joinFor: string;
  /** Tournament chain ID */
  tournamentChainId: number;
  /** Tournament contract address */
  tournamentContractAddress: string;
  /** Tournament metadata */
  tournamentMetadata: components["schemas"]["Tournament"];
  /** Tournament entry token */
  tournamentEntryToken: components["schemas"]["Token"];
  /** Tournament entry fee */
  tournamentEntryFee: string;
  /** Callback function called when the tournament is successfully joined */
  onSuccess?: () => void;
}

/**
 * Props for the AnySpend tournament modal
 */
export interface AnySpendFundTournamentProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendFundTournament";
  /** Tournament chain ID */
  tournamentChainId: number;
  /** Tournament contract address */
  tournamentContractAddress: string;
  /** Tournament metadata */
  tournamentMetadata: components["schemas"]["Tournament"];
  /** Tournament fund token */
  tournamentFundToken: components["schemas"]["Token"];
  /** Tournament fund amount */
  tournamentFundAmount: string;
  /** Callback function called when the tournament is successfully joined */
  onSuccess?: () => void;
}

/**
 * Props for the AnySpend order details modal
 * Displays details about a specific order
 */
export interface AnyspendOrderDetailsProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anyspendOrderDetails";
  /** Unique identifier for the order to display */
  orderId: string;
  /** Whether to show the back button */
  showBackButton?: boolean;
}

/**
 * Props for the Transak modal
 * Handles Transak-specific on-ramping
 */
export interface TransakProps extends BaseModalProps {
  /** Modal type identifier */
  type: "transak";
  /** Wallet address to receive the purchased crypto */
  destinationWalletAddress?: string;
  /** Default amount of crypto to purchase */
  defaultCryptoAmount?: number;
  /** Amount of fiat currency to spend */
  fiatAmount?: number;
  /** ISO country code for KYC and available payment methods */
  countryCode?: string;
  /** Callback function called when the purchase is successful */
  onSuccess?: () => void;
}

/**
 * Props for the AnySpend order history modal
 */
export interface AnySpendOrderHistoryProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendOrderHistory";
}

/**
 * Props for the AnySpend Stake B3 modal
 * Handles B3 token staking operations
 */
export interface AnySpendStakeB3Props extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendStakeB3";
  /** Recipient address to stake B3 for */
  recipientAddress: string;
  /** Stake amount */
  stakeAmount?: string;
  /** Callback function called when the stake is successful */
  onSuccess?: () => void;
}

/**
 * Props for the AnySpend Buy Spin modal
 * Handles spin wheel entry purchases
 */
export interface AnySpendBuySpinProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendBuySpin";
  /** Spin wheel contract address */
  spinwheelContractAddress: string;
  /** Chain ID where the spin wheel contract is deployed */
  chainId: number;
  /** Recipient address to receive the spins */
  recipientAddress: string;
  /** Callback function called when the spin purchase is successful */
  onSuccess?: (txHash?: string) => void;
  /** Prefill quantity of spins to purchase */
  prefillQuantity?: string;
}

/**
 * Props for the AnySpend Signature Mint modal
 * Handles signature-based NFT minting
 */
export interface AnySpendSignatureMintProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendSignatureMint";
  /** Signature data required for minting */
  signatureData: GenerateSigMintResponse;
  /** Optional image URL for NFT preview */
  imageUrl?: string;
  /** Callback function called when minting is successful */
  onSuccess?: (txHash?: string) => void;
}

/**
 * Props for the AnySpend bondKit modal
 * Handles bondKit token purchases
 */
export interface AnySpendBondKitProps extends BaseModalProps {
  /** Mode of the modal */
  mode?: "modal" | "page";
  /** Modal type identifier */
  type: "anySpendBondKit";
  /** Recipient address to receive the tokens */
  recipientAddress: string;
  /** bondKit contract address */
  contractAddress: string;
  /** Minimum tokens to receive */
  minTokensOut?: string;
  /** Optional image URL for token preview */
  imageUrl?: string;
  /** Token name to display */
  tokenName?: string;
  /** Optional pre-filled B3 amount */
  b3Amount?: string;
  /** Callback function called when purchase is successful */
  onSuccess?: (txHash?: string) => void;
}

export interface LinkAccountModalProps extends BaseModalProps {
  type: "linkAccount";
  showBackButton?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  partnerId: string;
  chain: Chain;
}

export interface AnySpendDepositHypeProps extends BaseModalProps {
  /** Modal type identifier */
  type: "anySpendDepositHype";
  /** Recipient address to receive the tokens */
  recipientAddress: string;
  /** Destination token address */
  sourceTokenAddress?: string;
  /** Source token chain ID */
  sourceTokenChainId?: number;
  /** Payment type - crypto or fiat */
  paymentType?: "crypto" | "fiat";
  /** Deposit contract address */
  depositContractAddress: string;
  /** Main footer */
  mainFooter?: React.ReactNode;
  /** Callback function called when the deposit is successful */
  onSuccess?: () => void;
}

/**
 * Union type of all possible modal content types
 */
export type ModalContentType =
  | SignInWithB3ModalProps
  | RequestPermissionsModalProps
  | ManageAccountModalProps
  | AnySpendModalProps
  | AnyspendOrderDetailsProps
  | AnySpendNftProps
  | AnySpendJoinTournamentProps
  | AnySpendFundTournamentProps
  | TransakProps
  | AnySpendOrderHistoryProps
  | AnySpendStakeB3Props
  | AnySpendBuySpinProps
  | AnySpendSignatureMintProps
  | AnySpendBondKitProps
  | LinkAccountModalProps
  | AnySpendDepositHypeProps;
// Add other modal types here like: | OtherModalProps | AnotherModalProps

/**
 * State interface for the modal store
 */
interface ModalState {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Current content being displayed in the modal */
  contentType: ModalContentType | null;
  /** History of previously displayed modal contents */
  history: ModalContentType[];
  /** Function to open or close the modal */
  setB3ModalOpen: (isOpen: boolean) => void;
  /** Function to set the modal content and add current content to history */
  setB3ModalContentType: (content: ModalContentType) => void;
  /** Function to navigate back to the previous modal content */
  navigateBack: () => void;
  /** Function to clear the modal history */
  clearHistory: () => void;
  /** Address of the ecosystem account */
  ecoSystemAccountAddress?: Address;
  /** Function to set the ecosystem account address */
  setEcoSystemAccountAddress: (address: Address) => void;
  /** Whether an account linking operation is in progress */
  isLinking: boolean;
  /** The method currently being linked */
  linkingMethod: string | null;
  /** Function to set the linking state */
  setLinkingState: (isLinking: boolean, method?: string | null) => void;
}

/**
 * Zustand store for managing modal state
 * Handles modal visibility, content type, and navigation history
 */
export const useModalStore = create<ModalState>(set => ({
  isOpen: false,
  contentType: null,
  history: [],
  setB3ModalOpen: isOpen => set({ isOpen }),
  setB3ModalContentType: content =>
    set(state => {
      // Add current modal to history before changing
      const newHistory = state.contentType ? [...state.history, state.contentType] : state.history;
      return {
        contentType: content,
        history: newHistory,
      };
    }),
  navigateBack: () =>
    set(state => {
      if (state.history.length === 0) {
        return { isOpen: false, contentType: null };
      }
      const newHistory = [...state.history];
      const previousModal = newHistory.pop();
      return {
        contentType: previousModal || null,
        history: newHistory,
      };
    }),
  clearHistory: () => set({ history: [] }),
  ecoSystemAccountAddress: undefined,
  setEcoSystemAccountAddress: (address: Address) => set({ ecoSystemAccountAddress: address }),
  isLinking: false,
  linkingMethod: null,
  setLinkingState: (isLinking: boolean, method: string | null = null) =>
    set({ isLinking, linkingMethod: isLinking ? method : null }),
}));
