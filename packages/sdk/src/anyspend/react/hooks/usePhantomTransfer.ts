import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

interface UsePhantomTransferParams {
  /** RPC endpoint URL for Solana network */
  rpcEndpoint?: string;
}

interface PhantomTransferParams {
  /** Amount in lamports (for SOL) or smallest token unit (for SPL tokens) */
  amountLamports: string;
  /** Token address (use "11111111111111111111111111111111" for native SOL) */
  tokenAddress: string;
  /** Recipient address */
  recipientAddress: string;
}

/**
 * Custom hook for handling Phantom wallet transfers on Solana.
 * Supports both native SOL and SPL token transfers with automatic priority fee calculation.
 *
 * @example
 * ```tsx
 * const { initiateTransfer, isPhantomAvailable } = usePhantomTransfer();
 *
 * await initiateTransfer({
 *   amountLamports: "1000000000", // 1 SOL
 *   tokenAddress: "11111111111111111111111111111111",
 *   recipientAddress: "..."
 * });
 * ```
 */
export function usePhantomTransfer({ rpcEndpoint }: UsePhantomTransferParams = {}) {
  // Default RPC endpoint
  const defaultRpcEndpoint = "https://mainnet.helius-rpc.com/?api-key=efafd9b3-1807-4cf8-8aa4-3d984f56d8fb";
  const effectiveRpcEndpoint = rpcEndpoint || defaultRpcEndpoint;

  // Check for Phantom wallet availability
  const isPhantomMobile = useMemo(() => navigator.userAgent.includes("Phantom"), []);
  const isPhantomBrowser = useMemo(() => (window as any).phantom?.solana?.isPhantom, []);
  const isPhantomAvailable = isPhantomMobile || isPhantomBrowser;

  /**
   * Get the connected Phantom wallet address if available
   */
  const getConnectedAddress = useCallback(() => {
    const phantom = (window as any).phantom?.solana;
    if (phantom?.isConnected && phantom?.publicKey) {
      return phantom.publicKey.toString();
    }
    return null;
  }, []);

  /**
   * Calculate optimal priority fee based on recent network activity
   */
  const calculatePriorityFee = useCallback(async (connection: Connection, fromPubkey: PublicKey): Promise<number> => {
    let priorityFee = 10000; // Default fallback (10,000 micro-lamports)

    try {
      const recentFees = await connection.getRecentPrioritizationFees({
        lockedWritableAccounts: [fromPubkey],
      });

      if (recentFees && recentFees.length > 0) {
        // Use 75th percentile of recent fees for good priority
        const sortedFees = recentFees.map(fee => fee.prioritizationFee).sort((a, b) => a - b);
        const percentile75Index = Math.floor(sortedFees.length * 0.75);
        priorityFee = Math.max(sortedFees[percentile75Index] || 10000, 10000);
      }
    } catch (feeError) {
      console.warn("Failed to fetch recent priority fees, using default:", feeError);
    }

    return priorityFee;
  }, []);

  /**
   * Create a native SOL transfer transaction with priority fees
   */
  const createNativeTransferTransaction = useCallback(
    async (
      _connection: Connection,
      fromPubkey: PublicKey,
      toPubkey: PublicKey,
      amount: bigint,
      priorityFee: number,
    ): Promise<Transaction> => {
      const computeUnitLimit = 1000; // SOL transfer + compute budget instructions need ~600-800 CU
      const computeUnitPrice = Math.min(priorityFee, 100000); // Cap at 100k micro-lamports for safety

      const transaction = new Transaction()
        .add(
          // Set compute unit limit first (must come before other instructions)
          ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnitLimit,
          }),
        )
        .add(
          // Set priority fee
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: computeUnitPrice,
          }),
        )
        .add(
          // Actual transfer instruction
          SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: Number(amount),
          }),
        );

      console.log(`Using priority fee: ${computeUnitPrice} micro-lamports per CU, limit: ${computeUnitLimit} CU`);

      return transaction;
    },
    [],
  );

  /**
   * Create an SPL token transfer transaction with priority fees
   */
  const createSPLTransferTransaction = useCallback(
    async (
      connection: Connection,
      fromPubkey: PublicKey,
      toPubkey: PublicKey,
      mintPubkey: PublicKey,
      amount: bigint,
      priorityFee: number,
    ): Promise<Transaction> => {
      // Get associated token accounts
      const fromTokenAccount = getAssociatedTokenAddressSync(mintPubkey, fromPubkey);
      const toTokenAccount = getAssociatedTokenAddressSync(mintPubkey, toPubkey);

      // Check if destination token account exists
      const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
      const needsDestinationAccount = !toTokenAccountInfo;

      // Get mint info to determine decimals
      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
      const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 9;

      // SPL transfers need more compute units than SOL transfers
      // Add extra CU if we need to create destination account
      const computeUnitLimit = needsDestinationAccount ? 40000 : 20000;
      const computeUnitPrice = Math.min(priorityFee, 100000);

      // Create transfer instruction
      const transferInstruction = createTransferCheckedInstruction(
        fromTokenAccount,
        mintPubkey,
        toTokenAccount,
        fromPubkey,
        Number(amount),
        decimals,
      );

      const transaction = new Transaction()
        .add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: computeUnitLimit,
          }),
        )
        .add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: computeUnitPrice,
          }),
        );

      // Add create destination account instruction if needed
      if (needsDestinationAccount) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromPubkey, // payer
            toTokenAccount, // ata
            toPubkey, // owner
            mintPubkey, // mint
          ),
        );
      }

      // Add the transfer instruction
      transaction.add(transferInstruction);

      console.log(
        `SPL Token transfer: ${computeUnitPrice} micro-lamports per CU, limit: ${computeUnitLimit} CU, creating destination: ${needsDestinationAccount}`,
      );

      return transaction;
    },
    [],
  );

  /**
   * Initiate a Phantom wallet transfer for SOL or SPL tokens
   */
  const initiateTransfer = useCallback(
    async ({ amountLamports, tokenAddress, recipientAddress }: PhantomTransferParams): Promise<void> => {
      try {
        // Step 1: Check if Phantom is installed
        if (!isPhantomAvailable) {
          toast.error("Phantom wallet not installed. Please install Phantom wallet to continue.");
          return;
        }

        // Step 2: Ensure Phantom is connected/unlocked
        const phantom = (window as any).phantom?.solana;
        if (!phantom) {
          toast.error("Phantom wallet not accessible");
          return;
        }

        // Connect and unlock wallet if needed
        let publicKey;
        try {
          const connection = await phantom.connect();
          publicKey = connection.publicKey;
        } catch (connectError) {
          toast.error("Failed to connect to Phantom wallet");
          return;
        }

        // Step 3: Setup connection and public keys
        const connection = new Connection(effectiveRpcEndpoint);
        const fromPubkey = new PublicKey(publicKey.toString());
        const toPubkey = new PublicKey(recipientAddress);
        const amount = BigInt(amountLamports);

        // Step 4: Calculate optimal priority fee
        const priorityFee = await calculatePriorityFee(connection, fromPubkey);

        // Step 5: Create transaction based on token type
        let transaction: Transaction;

        if (tokenAddress === "11111111111111111111111111111111") {
          // Native SOL transfer
          transaction = await createNativeTransferTransaction(connection, fromPubkey, toPubkey, amount, priorityFee);
        } else {
          // SPL Token transfer
          const mintPubkey = new PublicKey(tokenAddress);
          transaction = await createSPLTransferTransaction(
            connection,
            fromPubkey,
            toPubkey,
            mintPubkey,
            amount,
            priorityFee,
          );
        }

        // Step 6: Get latest blockhash and set fee payer
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        // Step 7: Sign and send transaction
        const signedTransaction = await phantom.signAndSendTransaction(transaction);

        toast.success(`Transaction successful! Signature: ${signedTransaction.signature}`);
        console.log("Transaction sent with priority fees. Signature:", signedTransaction.signature);
      } catch (error: unknown) {
        console.error("Transfer error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("User rejected")) {
          toast.error("Transaction was cancelled by user");
        } else if (errorMessage.includes("insufficient")) {
          toast.error("Insufficient balance for this transaction");
        } else if (errorMessage.includes("blockhash not found")) {
          toast.error("Network congestion detected. Please try again in a moment.");
        } else {
          toast.error(`Transfer failed: ${errorMessage}`);
        }
      }
    },
    [
      isPhantomAvailable,
      effectiveRpcEndpoint,
      calculatePriorityFee,
      createNativeTransferTransaction,
      createSPLTransferTransaction,
    ],
  );

  return {
    /** Function to initiate a transfer */
    initiateTransfer,
    /** Whether Phantom wallet is available (installed) */
    isPhantomAvailable,
    /** Get the currently connected Phantom wallet address */
    getConnectedAddress,
  };
}
