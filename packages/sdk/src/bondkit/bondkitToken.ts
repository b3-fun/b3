import type {
  Address,
  Chain,
  EIP1193Provider,
  GetContractReturnType,
  Hex,
  PublicClient,
  Transport,
  WalletClient,
} from "viem";
import { createPublicClient, createWalletClient, custom, erc20Abi, getContract, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { BondkitTokenABI } from "./abis";
import { getConfig } from "./config";
import { BondkitSwapService } from "./swapService";
import type {
  BondkitTokenInitializationConfig,
  GetTransactionHistoryOptions,
  SwapQuote,
  TokenDetails,
  TransactionResponse,
} from "./types";
import { TokenStatus } from "./types";

// Event ABI snippets for decoding
const boughtEventAbi = BondkitTokenABI.find(item => item.type === "event" && item.name === "BondingCurveBuy");
const soldEventAbi = BondkitTokenABI.find(item => item.type === "event" && item.name === "BondingCurveSell");
const dexMigrationEventAbi = BondkitTokenABI.find(
  item => item.type === "event" && item.name === "BondkitTokenMigrated",
);

// Define a type for the options that can be passed to executeWrite
// This mirrors common properties from viem's WriteContractParameters but makes them optional
type ExecuteWriteOptions = {
  value?: bigint;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  // Potentially add nonce or other parameters if needed
};

// OKX wallet polling constants
const OKX_POLLING_MAX_RETRIES = 60; // 5 minutes with 5 second intervals
const OKX_POLLING_INTERVAL_MS = 5000; // 5 seconds

export class BondkitToken {
  public contract: GetContractReturnType<typeof BondkitTokenABI, WalletClient>;
  public publicClient: PublicClient;
  public contractAddress: Hex;
  private chain: Chain;
  private walletKey?: Hex;
  private rpcUrl: string;
  private apiEndpoint: string;
  private walletClientInstance: WalletClient;
  private connectedProvider?: EIP1193Provider;
  private tradingToken?: Address;
  private swapService?: BondkitSwapService;

  constructor(contractAddress: string, walletKey?: string) {
    const sdkConfig = getConfig(base.id);
    this.chain = sdkConfig.chain;
    this.rpcUrl = sdkConfig.rpcUrl;
    this.apiEndpoint = sdkConfig.apiEndpoint;

    if (walletKey && !walletKey.startsWith("0x")) {
      this.walletKey = `0x${walletKey}` as Hex;
    } else if (walletKey) {
      this.walletKey = walletKey as Hex;
    }

    if (!contractAddress || !contractAddress.startsWith("0x")) {
      throw new Error("Valid contract address is required for BondkitToken.");
    }
    this.contractAddress = contractAddress as Hex;

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
    });

    this.walletClientInstance = createWalletClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
      account: this.walletKey ? privateKeyToAccount(this.walletKey) : undefined,
    });

    this.contract = getContract({
      address: this.contractAddress,
      abi: BondkitTokenABI,
      client: this.walletClientInstance,
    });

    this.contract.read.tradingToken().then(tradingToken => {
      this.tradingToken = tradingToken as Address;
    });
  }

  public connect(provider?: EIP1193Provider): boolean {
    try {
      const transport: Transport = provider ? custom(provider) : http(this.rpcUrl);

      this.connectedProvider = provider;

      this.walletClientInstance = createWalletClient({
        chain: this.chain,
        transport,
        account: this.walletKey ? privateKeyToAccount(this.walletKey) : undefined,
      });

      this.publicClient = createPublicClient({
        chain: this.chain,
        transport,
      });

      this.contract = getContract({
        address: this.contractAddress,
        abi: BondkitTokenABI,
        client: this.walletClientInstance,
      });
      return true;
    } catch (error) {
      console.error("Connection failed:", error);
      return false;
    }
  }

  /**
   * Connects using an EIP-1193 provider and requests accounts, selecting the first one.
   * Enables frontend wallet flows without requiring a private key.
   */
  public async connectWithProvider(provider: EIP1193Provider): Promise<boolean> {
    try {
      const transport: Transport = custom(provider);
      this.connectedProvider = provider;

      // Try to request accounts (prompt user if needed)
      let addresses: string[] = [];
      try {
        const result = await provider.request({ method: "eth_requestAccounts" });
        if (Array.isArray(result)) addresses = result as string[];
      } catch (requestErr) {
        try {
          const result = await provider.request({ method: "eth_accounts" });
          if (Array.isArray(result)) addresses = result as string[];
        } catch (_) {
          // ignore
        }
      }

      const selectedAccount = (addresses?.[0] ?? undefined) as Address | undefined;

      this.walletClientInstance = createWalletClient({
        chain: this.chain,
        transport,
        account: selectedAccount,
      });

      this.publicClient = createPublicClient({
        chain: this.chain,
        transport,
      });

      this.contract = getContract({
        address: this.contractAddress,
        abi: BondkitTokenABI,
        client: this.walletClientInstance,
      });

      return true;
    } catch (error) {
      console.error("Connection failed:", error);
      return false;
    }
  }

  private async handleError(error: any, context?: string): Promise<never> {
    const defaultMessage = context ? `Error in ${context}:` : "An error occurred:";
    console.error(defaultMessage, error);
    // TODO: Add more specific error checks based on BondkitTokenABI error types if needed
    throw error;
  }

  // --- Read Methods (ERC20 + Custom) --- //
  public async name(): Promise<string | undefined> {
    try {
      return await this.contract.read.name();
    } catch (error) {
      console.warn("Error fetching token name:", error);
      return undefined;
    }
  }

  public async symbol(): Promise<string | undefined> {
    try {
      return await this.contract.read.symbol();
    } catch (error) {
      console.warn("Error fetching token symbol:", error);
      return undefined;
    }
  }

  public async decimals(): Promise<number | undefined> {
    try {
      const dec = await this.contract.read.decimals();
      return Number(dec);
    } catch (error) {
      console.warn("Error fetching token decimals:", error);
      return undefined;
    }
  }

  public async totalSupply(): Promise<bigint | undefined> {
    try {
      return await this.contract.read.totalSupply();
    } catch (error) {
      console.warn("Error fetching token total supply:", error);
      return undefined;
    }
  }

  public async balanceOf(account: Address): Promise<bigint | undefined> {
    try {
      return await this.contract.read.balanceOf([account]);
    } catch (error) {
      console.warn(`Error fetching balance for ${account}:`, error);
      return undefined;
    }
  }

  public async getTradingTokenBalanceOf(account: Address): Promise<bigint | undefined> {
    try {
      if (!this.tradingToken) {
        console.warn("Trading token address not available");
        return undefined;
      }

      // If trading token is ETH (zero address), get ETH balance
      if (this.tradingToken === "0x0000000000000000000000000000000000000000") {
        return await this.publicClient.getBalance({ address: account });
      }

      // For ERC20 trading tokens, get token balance
      const tradingTokenContract = getContract({
        address: this.tradingToken as Address,
        abi: erc20Abi,
        client: this.publicClient, // Use public client for read operations
      });

      return await tradingTokenContract.read.balanceOf([account]);
    } catch (error) {
      console.warn(`Error fetching trading token balance for ${account}:`, error);
      return undefined;
    }
  }

  public async getTradingTokenAddress(): Promise<Address | undefined> {
    try {
      if (!this.tradingToken) {
        this.tradingToken = (await this.contract.read.tradingToken()) as Address;
      }
      return this.tradingToken;
    } catch (error) {
      console.warn("Error fetching trading token address:", error);
      return undefined;
    }
  }

  public async allowance(owner: Address, spender: Address): Promise<bigint | undefined> {
    try {
      return await this.contract.read.allowance([owner, spender]);
    } catch (error) {
      console.warn(`Error fetching allowance for owner ${owner} and spender ${spender}:`, error);
      return undefined;
    }
  }

  public async owner(): Promise<Address | undefined> {
    try {
      return await this.contract.read.owner();
    } catch (error) {
      console.warn("Error fetching token owner or 'owner' function might not exist:", error);
      return undefined;
    }
  }

  public async getTokenDetails(): Promise<TokenDetails | undefined> {
    try {
      const [name, symbol, decimals, totalSupply, owner] = await Promise.all([
        this.name(),
        this.symbol(),
        this.decimals(),
        this.totalSupply(),
        this.owner(),
      ]);
      if (name === undefined || symbol === undefined || decimals === undefined || totalSupply === undefined) {
        console.warn("Failed to retrieve all essential token details.");
        return undefined;
      }
      return {
        name,
        symbol,
        decimals,
        totalSupply,
        owner: owner || "0x0000000000000000000000000000000000000000",
      };
    } catch (error) {
      console.warn("Error in getTokenDetails:", error);
      return undefined;
    }
  }

  // --- Bondkit Specific Read Methods ---
  public async feeRecipient(): Promise<Address | undefined> {
    try {
      return await this.contract.read.feeRecipient();
    } catch (e) {
      console.warn("Error fetching feeRecipient:", e);
      return undefined;
    }
  }

  public async currentStatus(): Promise<TokenStatus | undefined> {
    try {
      const status = await this.contract.read.currentStatus();
      return status as TokenStatus;
    } catch (e) {
      console.warn("Error fetching currentStatus:", e);
      return undefined;
    }
  }

  public async getCurrentPhase(): Promise<string | undefined> {
    try {
      return await this.contract.read.getCurrentPhase();
    } catch (e) {
      console.warn("Error fetching getCurrentPhase:", e);
      return undefined;
    }
  }

  public async getAmountOfTokensToBuy(ethAmount: bigint | string): Promise<bigint | undefined> {
    try {
      const value = typeof ethAmount === "string" ? parseEther(ethAmount) : ethAmount;
      return await this.contract.read.getAmountOfTokensToBuy([value]);
    } catch (e) {
      console.warn("Error in getAmountOfTokensToBuy:", e);
      return undefined;
    }
  }

  public async getAmountOfTradingTokensToSell(amount: bigint): Promise<bigint | undefined> {
    try {
      return await this.contract.read.getAmountOfTradingTokensToSell([amount]);
    } catch (e) {
      console.warn("Error in getAmountOfTradingTokensToSell:", e);
      return undefined;
    }
  }

  public async getCurrentBondingCurvePricePerToken(): Promise<bigint | undefined> {
    try {
      return await this.contract.read.getCurrentBondingCurvePricePerToken();
    } catch (e) {
      console.warn("Error fetching current bonding curve price:", e);
      return undefined;
    }
  }

  public async totalRaisedBonding(): Promise<bigint | undefined> {
    try {
      return await this.contract.read.totalRaisedBonding();
    } catch (e) {
      console.warn("Error fetching totalRaisedBonding:", e);
      return undefined;
    }
  }

  public async getTotalSupply(): Promise<bigint | undefined> {
    try {
      return await this.contract.read.totalSupply();
    } catch (e) {
      console.warn("Error fetching total supply:", e);
      return undefined;
    }
  }

  public async getPaginatedHolders(
    startIndex: bigint,
    count = BigInt(1000),
  ): Promise<{ address: Address; balance: bigint }[]> {
    try {
      const response = await this.contract.read.getPaginatedHolders([startIndex, count]);
      const holders = response[0] as Address[];
      const balances = response[1] as bigint[];

      return holders.map((holder, index) => ({
        address: holder as Address,
        balance: balances[index] as bigint,
      }));
    } catch (e) {
      console.warn("Error fetching paginated holders:", e);
      return [];
    }
  }

  public async getBondingProgress(): Promise<
    | {
        progress: number;
        raised: number;
        threshold: number;
      }
    | undefined
  > {
    try {
      const [progress, raised, threshold] = await this.contract.read.getBondingProgressPercent();
      return {
        progress: Number(progress) / 100,
        raised: Number(raised),
        threshold: Number(threshold),
      };
    } catch (e) {
      console.warn("Error fetching bonding progress percent:", e);
      return undefined;
    }
  }

  // --- Transaction History --- //
  public async getTransactionHistory(options?: GetTransactionHistoryOptions): Promise<TransactionResponse | undefined> {
    try {
      const { userAddress, type, from, to, limit, offset } = options || {};
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-service-method": "getTransactionHistory",
        },
        body: JSON.stringify({
          contractAddress: this.contractAddress,
          chainId: this.chain.id,
          userAddress,
          type,
          from,
          to: to || Date.now(),
          limit: limit || 50,
          offset,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TransactionResponse = await response.json();
      return result;
    } catch (e) {
      console.warn("Error fetching transaction history:", e);
      return undefined;
    }
  }

  // --- Write Methods --- //
  private async executeWrite(
    functionName: string,
    args: any[],
    options?: ExecuteWriteOptions,
  ): Promise<Hex | undefined> {
    if (!this.walletClientInstance.account && !this.walletKey) {
      // Try to resolve an account from a connected EIP-1193 provider on-demand
      if (this.connectedProvider) {
        try {
          const addresses = (await this.connectedProvider.request({ method: "eth_accounts" })) as string[];
          const selectedAccount = (addresses?.[0] ?? undefined) as Address | undefined;
          if (selectedAccount) {
            const transport: Transport = custom(this.connectedProvider);
            this.walletClientInstance = createWalletClient({
              chain: this.chain,
              transport,
              account: selectedAccount,
            });
            this.contract = getContract({
              address: this.contractAddress,
              abi: BondkitTokenABI,
              client: this.walletClientInstance,
            });
          }
        } catch (_) {}
      }
      if (!this.walletClientInstance.account && !this.walletKey) {
        throw new Error("Wallet key not set or client not connected for write operation.");
      }
    }
    const accountToUse = this.walletKey ? privateKeyToAccount(this.walletKey) : this.walletClientInstance.account;
    if (!accountToUse) throw new Error("Account for transaction could not be determined.");

    try {
      let maxFee = options?.maxFeePerGas;
      let priorityFee = options?.maxPriorityFeePerGas;

      if (maxFee === undefined || priorityFee === undefined) {
        try {
          const feeEstimates = await this.publicClient.estimateFeesPerGas();
          if (maxFee === undefined) {
            maxFee = feeEstimates.maxFeePerGas;
          }
          if (priorityFee === undefined) {
            priorityFee = feeEstimates.maxPriorityFeePerGas;
          }
        } catch (feeError) {
          console.warn("Could not estimate fees, will rely on wallet defaults or provided values:", feeError);
          maxFee = maxFee ?? undefined;
          priorityFee = priorityFee ?? undefined;
        }
      }

      const transactionOptions: any = {
        account: accountToUse,
        chain: this.chain,
      };
      if (options?.value !== undefined) transactionOptions.value = options.value;
      if (options?.gas !== undefined) transactionOptions.gas = options.gas;
      if (maxFee !== undefined) transactionOptions.maxFeePerGas = maxFee;
      if (priorityFee !== undefined) transactionOptions.maxPriorityFeePerGas = priorityFee;

      const hash = await (this.contract.write as any)[functionName](args, transactionOptions);
      return hash;
    } catch (error) {
      return this.handleError(error, functionName);
    }
  }

  /** Helper method to wait for transaction confirmation with OKX wallet fallback */
  public async waitForTransaction(hash: Hex) {
    const isOKX = (typeof window !== "undefined" && (window as any).ethereum?.isOKXWallet) || (window as any).okxwallet;

    if (isOKX) {
      // Fallback to polling for OKX wallet
      let retries = 0;

      while (retries < OKX_POLLING_MAX_RETRIES) {
        try {
          const receipt = await this.publicClient.getTransactionReceipt({ hash });
          if (receipt) {
            return receipt;
          }
        } catch (error: any) {
          if (error.name !== "TransactionReceiptNotFoundError") {
            throw error;
          }
        }

        await new Promise(resolve => setTimeout(resolve, OKX_POLLING_INTERVAL_MS));
        retries++;
      }

      throw new Error("Transaction confirmation timeout");
    } else {
      // Use normal waitForTransactionReceipt for other wallets
      return await this.publicClient.waitForTransactionReceipt({ hash });
    }
  }

  public async initialize(
    config: BondkitTokenInitializationConfig,
    options?: ExecuteWriteOptions,
  ): Promise<Hex | undefined> {
    return this.executeWrite("initialize", [config], options);
  }

  public async transfer(to: Address, amount: bigint, options?: ExecuteWriteOptions): Promise<Hex | undefined> {
    return this.executeWrite("transfer", [to, amount], options);
  }

  public async approve(spender: Address, amount: bigint, options?: ExecuteWriteOptions): Promise<Hex | undefined> {
    return this.executeWrite("approve", [spender, amount], options);
  }

  public async transferFrom(
    from: Address,
    to: Address,
    amount: bigint,
    options?: ExecuteWriteOptions,
  ): Promise<Hex | undefined> {
    return this.executeWrite("transferFrom", [from, to, amount], options);
  }

  /** Buy tokens with ETH. Payable function. */
  public async buy(
    amount: bigint | string,
    minTokensOut: bigint,
    options?: ExecuteWriteOptions,
  ): Promise<Hex | undefined> {
    if (!boughtEventAbi) console.warn("Bought event ABI not found for event decoding.");

    if (this.tradingToken === "0x0000000000000000000000000000000000000000") {
      const value = typeof amount === "string" ? parseEther(amount) : amount;
      return this.executeWrite("buy", [minTokensOut], { ...options, value });
    } else {
      // For ERC20 trading tokens, we need to approve first, then call buy
      const tradingTokenContract = getContract({
        address: this.tradingToken as Address,
        abi: erc20Abi,
        client: this.walletClientInstance,
      });

      const currentAllowance = await tradingTokenContract.read.allowance([
        this.walletClientInstance.account?.address as Address,
        this.contractAddress as Address,
      ]);

      const amountBigInt = typeof amount === "string" ? parseEther(amount) : BigInt(amount);

      if (currentAllowance < amountBigInt) {
        // Get account for the approve transaction
        const accountToUse = this.walletKey ? privateKeyToAccount(this.walletKey) : this.walletClientInstance.account;
        if (!accountToUse) throw new Error("Account for transaction could not be determined.");

        // Create approve options with required fields but without value (ERC20 approve doesn't need ETH)
        const approveOptions: any = {
          account: accountToUse,
          chain: this.chain,
        };

        // Add optional transaction parameters if provided
        if (options?.gas !== undefined) approveOptions.gas = options.gas;
        if (options?.maxFeePerGas !== undefined) approveOptions.maxFeePerGas = options.maxFeePerGas;
        if (options?.maxPriorityFeePerGas !== undefined)
          approveOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;

        const approveTx = await tradingTokenContract.write.approve(
          [this.contractAddress as Address, amountBigInt],
          approveOptions,
        );

        await this.waitForTransaction(approveTx);
      }

      // Now call the buy function with the trading token amount
      return this.executeWrite("buy", [amountBigInt, minTokensOut], options);
    }
  }

  /** Sell tokens for ETH. */
  public async sell(tokenAmount: bigint, minEthOut: bigint, options?: ExecuteWriteOptions): Promise<Hex | undefined> {
    if (!soldEventAbi) console.warn("Sold event ABI not found for event decoding.");
    return this.executeWrite("sell", [tokenAmount, minEthOut], options);
  }

  /** Migrate liquidity to DEX. Only callable by owner/migrationAdmin based on typical patterns. */
  public async migrateToDex(options?: ExecuteWriteOptions): Promise<Hex | undefined> {
    if (!dexMigrationEventAbi) console.warn("DexMigration event ABI not found for event decoding.");
    return this.executeWrite("migrateToDex", [], options);
  }

  public async transferTokenOwnership(newOwner: Address, options?: ExecuteWriteOptions): Promise<Hex | undefined> {
    return this.executeWrite("transferOwnership", [newOwner], options);
  }

  public async renounceTokenOwnership(options?: ExecuteWriteOptions): Promise<Hex | undefined> {
    return this.executeWrite("renounceOwnership", [], options);
  }

  // --- DEX Swap Methods ---

  /**
   * Get the swap service instance (lazy initialization)
   */
  private getSwapService(): BondkitSwapService {
    if (!this.swapService) {
      this.swapService = new BondkitSwapService(this.contractAddress);
    }
    return this.swapService;
  }

  /**
   * Check if DEX swapping is available (token must be in DexPhase)
   */
  public async isSwapAvailable(): Promise<boolean | undefined> {
    try {
      const status = await this.currentStatus();
      return status === TokenStatus.DexPhase;
    } catch (error) {
      console.warn("Error checking swap availability:", error);
      return undefined;
    }
  }

  /**
   * Get swap quote for trading token → bondkit token
   */
  public async getSwapQuoteForBondkitToken(
    amountTradingTokenIn: string,
    slippageTolerance: number = 0.5,
  ): Promise<SwapQuote | undefined> {
    try {
      // Check if swapping is available
      const swapAvailable = await this.isSwapAvailable();
      if (!swapAvailable) {
        console.warn("DEX swapping not available - token must be in DexPhase");
        return undefined;
      }

      const tradingTokenAddress = await this.getTradingTokenAddress();
      if (!tradingTokenAddress) {
        console.warn("Trading token address not available");
        return undefined;
      }

      // Get token details for decimals
      const [tradingTokenDecimals, bondkitTokenDecimals] = await Promise.all([
        this.getTradingTokenDecimals(tradingTokenAddress),
        this.decimals(),
      ]);

      if (tradingTokenDecimals === undefined || bondkitTokenDecimals === undefined) {
        console.warn("Unable to fetch token decimals");
        return undefined;
      }

      const swapService = this.getSwapService();
      const quote = await swapService.getSwapQuote({
        tokenIn: tradingTokenAddress,
        tokenOut: this.contractAddress,
        amountIn: amountTradingTokenIn,
        tokenInDecimals: tradingTokenDecimals,
        tokenOutDecimals: bondkitTokenDecimals,
        slippageTolerance,
        recipient: this.walletClientInstance.account?.address || "0x0000000000000000000000000000000000000000",
      });
      return quote || undefined;
    } catch (error) {
      console.warn("Error getting swap quote for bondkit token:", error);
      return undefined;
    }
  }

  /**
   * Get swap quote for bondkit token → trading token
   */
  public async getSwapQuoteForTradingToken(
    amountBondkitTokenIn: string,
    slippageTolerance: number = 0.5,
  ): Promise<SwapQuote | undefined> {
    try {
      // Check if swapping is available
      const swapAvailable = await this.isSwapAvailable();
      if (!swapAvailable) {
        console.warn("DEX swapping not available - token must be in DexPhase");
        return undefined;
      }

      const tradingTokenAddress = await this.getTradingTokenAddress();
      if (!tradingTokenAddress) {
        console.warn("Trading token address not available");
        return undefined;
      }

      // Get token details for decimals
      const [bondkitTokenDecimals, tradingTokenDecimals] = await Promise.all([
        this.decimals(),
        this.getTradingTokenDecimals(tradingTokenAddress),
      ]);

      if (bondkitTokenDecimals === undefined || tradingTokenDecimals === undefined) {
        console.warn("Unable to fetch token decimals");
        return undefined;
      }

      const swapService = this.getSwapService();
      const quote = await swapService.getSwapQuote({
        tokenIn: this.contractAddress,
        tokenOut: tradingTokenAddress,
        amountIn: amountBondkitTokenIn,
        tokenInDecimals: bondkitTokenDecimals,
        tokenOutDecimals: tradingTokenDecimals,
        slippageTolerance,
        recipient: this.walletClientInstance.account?.address || "0x0000000000000000000000000000000000000000",
      });
      return quote || undefined;
    } catch (error) {
      console.warn("Error getting swap quote for trading token:", error);
      return undefined;
    }
  }

  /**
   * Swap trading token for bondkit token
   */
  public async swapTradingTokenForBondkitToken(
    amountTradingTokenIn: string,
    slippageTolerance: number = 0.5,
    options?: ExecuteWriteOptions,
  ): Promise<Hex | undefined> {
    try {
      // Check if swapping is available
      const swapAvailable = await this.isSwapAvailable();
      if (!swapAvailable) {
        console.warn("DEX swapping not available - token must be in DexPhase");
        return undefined;
      }

      if (!this.walletClientInstance.account && !this.walletKey) {
        console.warn("Wallet key not set or client not connected for swap operation");
        return undefined;
      }

      const tradingTokenAddress = await this.getTradingTokenAddress();
      if (!tradingTokenAddress) {
        console.warn("Trading token address not available");
        return undefined;
      }

      // Get token details for decimals
      const [tradingTokenDecimals, bondkitTokenDecimals] = await Promise.all([
        this.getTradingTokenDecimals(tradingTokenAddress),
        this.decimals(),
      ]);

      if (tradingTokenDecimals === undefined || bondkitTokenDecimals === undefined) {
        console.warn("Unable to fetch token decimals");
        return undefined;
      }

      const recipient =
        this.walletClientInstance.account?.address ||
        (this.walletKey ? privateKeyToAccount(this.walletKey).address : undefined);

      if (!recipient) {
        console.warn("Unable to determine recipient address");
        return undefined;
      }

      const swapService = this.getSwapService();
      const txHash = await swapService.executeSwap(
        {
          tokenIn: tradingTokenAddress,
          tokenOut: this.contractAddress,
          amountIn: amountTradingTokenIn,
          tokenInDecimals: tradingTokenDecimals,
          tokenOutDecimals: bondkitTokenDecimals,
          slippageTolerance,
          recipient,
          deadline: options?.value ? Math.floor(Date.now() / 1000) + 3600 : undefined,
        },
        this.walletClientInstance,
      );

      return txHash ? (txHash as Hex) : undefined;
    } catch (error) {
      console.warn("Error swapping trading token for bondkit token:", error);
      return undefined;
    }
  }

  /**
   * Swap bondkit token for trading token
   */
  public async swapBondkitTokenForTradingToken(
    amountBondkitTokenIn: string,
    slippageTolerance: number = 0.5,
    options?: ExecuteWriteOptions,
  ): Promise<Hex | undefined> {
    try {
      // Check if swapping is available
      const swapAvailable = await this.isSwapAvailable();
      if (!swapAvailable) {
        console.warn("DEX swapping not available - token must be in DexPhase");
        return undefined;
      }

      if (!this.walletClientInstance.account && !this.walletKey) {
        console.warn("Wallet key not set or client not connected for swap operation");
        return undefined;
      }

      const tradingTokenAddress = await this.getTradingTokenAddress();
      if (!tradingTokenAddress) {
        console.warn("Trading token address not available");
        return undefined;
      }

      // Get token details for decimals
      const [bondkitTokenDecimals, tradingTokenDecimals] = await Promise.all([
        this.decimals(),
        this.getTradingTokenDecimals(tradingTokenAddress),
      ]);

      if (bondkitTokenDecimals === undefined || tradingTokenDecimals === undefined) {
        console.warn("Unable to fetch token decimals");
        return undefined;
      }

      const recipient =
        this.walletClientInstance.account?.address ||
        (this.walletKey ? privateKeyToAccount(this.walletKey).address : undefined);

      if (!recipient) {
        console.warn("Unable to determine recipient address");
        return undefined;
      }

      const swapService = this.getSwapService();
      const txHash = await swapService.executeSwap(
        {
          tokenIn: this.contractAddress,
          tokenOut: tradingTokenAddress,
          amountIn: amountBondkitTokenIn,
          tokenInDecimals: bondkitTokenDecimals,
          tokenOutDecimals: tradingTokenDecimals,
          slippageTolerance,
          recipient,
          deadline: options?.value ? Math.floor(Date.now() / 1000) + 3600 : undefined,
        },
        this.walletClientInstance,
      );

      return txHash ? (txHash as Hex) : undefined;
    } catch (error) {
      console.warn("Error swapping bondkit token for trading token:", error);
      return undefined;
    }
  }

  /**
   * Helper method to get trading token decimals
   */
  private async getTradingTokenDecimals(tradingTokenAddress: Address): Promise<number | undefined> {
    try {
      // ETH has 18 decimals
      if (tradingTokenAddress === "0x0000000000000000000000000000000000000000") {
        return 18;
      }

      // For ERC20 tokens, read decimals from contract
      const tradingTokenContract = getContract({
        address: tradingTokenAddress,
        abi: erc20Abi,
        client: this.publicClient,
      });

      const decimals = await tradingTokenContract.read.decimals();
      return Number(decimals);
    } catch (error) {
      console.warn("Error fetching trading token decimals:", error);
      return undefined;
    }
  }

  // TODO: Add other specific write methods from BondkitTokenABI.ts
  // e.g., setBondingCurve (if it exists and is external), updateArtistAddress, etc.
}
