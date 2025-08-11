import type {
  Address,
  Chain,
  EIP1193Provider,
  GetContractReturnType,
  Hex,
  PublicClient,
  TransactionReceipt,
  Transport,
  WalletClient,
} from "viem";
import { createPublicClient, createWalletClient, custom, decodeEventLog, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BondkitTokenFactoryABI } from "./abis";
import { getConfig, SupportedChainId } from "./config";
import type { BondkitTokenConfig, BondkitTokenCreatedEventArgs } from "./types";

// Define the event ABI snippet for BondkitTokenCreated specifically for decoding
const bondkitTokenCreatedEventAbi = BondkitTokenFactoryABI.find(
  item => item.type === "event" && item.name === "BondkitTokenCreated",
);

export class BondkitTokenFactory {
  private contract: GetContractReturnType<typeof BondkitTokenFactoryABI, WalletClient>;
  private publicClient: PublicClient;
  private contractAddress: Address;
  private chain: Chain;
  private walletKey?: Hex;
  private rpcUrl: string;
  private walletClientInstance: WalletClient; // Made non-optional, initialized in constructor
  private connectedProvider?: EIP1193Provider;

  constructor(chainId: SupportedChainId, walletKey?: string) {
    if (walletKey && !walletKey.startsWith("0x")) {
      this.walletKey = `0x${walletKey}` as Hex;
    } else if (walletKey) {
      this.walletKey = walletKey as Hex;
    }

    const config = getConfig(chainId);
    this.chain = config.chain;
    this.contractAddress = config.factoryAddress;
    this.rpcUrl = config.rpcUrl;

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
      abi: BondkitTokenFactoryABI,
      client: this.walletClientInstance,
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

      this.contract = getContract({
        address: this.contractAddress,
        abi: BondkitTokenFactoryABI,
        client: this.walletClientInstance,
      });

      this.publicClient = createPublicClient({
        chain: this.chain,
        transport,
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

      // Request accounts; fall back to eth_accounts if user already connected
      let addresses: string[] = [];
      try {
        const result = await provider.request({ method: "eth_requestAccounts" });
        if (Array.isArray(result)) addresses = result as string[];
      } catch (requestErr) {
        try {
          const result = await provider.request({ method: "eth_accounts" });
          if (Array.isArray(result)) addresses = result as string[];
        } catch (_) { }
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
        abi: BondkitTokenFactoryABI,
        client: this.walletClientInstance,
      });

      return true;
    } catch (error) {
      console.error("Connection failed:", error);
      return false;
    }
  }

  /**
   * Ensure we have an account set for write operations.
   * If not, try to resolve from a connected provider and reinitialize the client.
   */
  private async ensureWriteAccount(): Promise<void> {
    if (this.walletClientInstance.account || this.walletKey) return;
    if (!this.connectedProvider) return;
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
          abi: BondkitTokenFactoryABI,
          client: this.walletClientInstance,
        });
      }
    } catch (_) { }
  }

  // TODO: Implement a more generic handleError based on leaderboards-sdk style if common errors are identified
  private async handleError(error: any, context?: string): Promise<never> {
    const defaultMessage = context ? `Error in ${context}:` : "An error occurred:";
    console.error(defaultMessage, error);
    // You could check for common error signatures here if needed
    // e.g. if (error.data === "0xsomeErrorCode") throw new Error("Specific known error");
    throw error;
  }

  /**
   * Deploys a new Bondkit token using the factory.
   * @param config The configuration for the token to be deployed.
   * @returns The address of the newly created BondkitToken.
   */
  public async deployBondkitToken(
    configArg: BondkitTokenConfig, // Renamed to avoid conflict with getConfig
  ): Promise<Address> {
    if (!this.walletClientInstance.account && !this.walletKey) {
      await this.ensureWriteAccount();
      if (!this.walletClientInstance.account && !this.walletKey) {
        throw new Error("Wallet key not set or client not connected with an account.");
      }
    }
    if (!bondkitTokenCreatedEventAbi) {
      throw new Error("BondkitTokenCreated event ABI not found.");
    }

    try {
      const accountToUse = this.walletKey ? privateKeyToAccount(this.walletKey) : this.walletClientInstance.account;
      if (!accountToUse) {
        throw new Error("Account for transaction could not be determined.");
      }

      const hash = await this.contract.write.deployBondkitToken([configArg], {
        account: accountToUse,
        chain: this.chain,
      });

      console.log("hash", hash);
      const receipt: TransactionReceipt = await this.publicClient.waitForTransactionReceipt({ hash });

      for (const log of receipt.logs) {
        try {
          if (log.topics[0] !== "0x75b2d0aabe689b83d7eb7920447b5ae7bef7f28da01d0beb3e197899392eb0d6") {
            continue;
          }

          const decodedEvent = decodeEventLog({
            abi: BondkitTokenFactoryABI,
            data: log.data,
            topics: log.topics,
          });

          return (decodedEvent.args as BondkitTokenCreatedEventArgs).tokenAddress;
        } catch (e) { }
      }
      throw new Error("BondkitTokenCreated event not found in transaction logs.");
    } catch (error) {
      return this.handleError(error, "deployBondkitToken");
    }
  }

  /**
   * Gets the configuration of a deployed Bondkit token.
   * @param tokenAddress The address of the Bondkit token.
   * @returns The configuration object for the token.
   */
  public async getBondkitTokenConfig(tokenAddress: Address): Promise<BondkitTokenConfig | undefined> {
    try {
      const result = await this.contract.read.getBondkitTokenConfig([tokenAddress]);
      return result as BondkitTokenConfig;
    } catch (error) {
      console.error(`Error getting config for token ${tokenAddress}:`, error);
      return undefined;
    }
  }

  /**
   * Gets a list of all Bondkit tokens deployed by this factory.
   * @returns An array of token addresses.
   */
  public async getDeployedBondkitTokens(): Promise<readonly Address[]> {
    // ABI returns address[] which viem treats as readonly Address[]
    try {
      return await this.contract.read.getDeployedBondkitTokens(); // No arguments if function takes none
    } catch (error) {
      console.error("Error getting all deployed tokens:", error);
      return [];
    }
  }

  /**
   * Gets the owner of the factory contract.
   * @returns The address of the owner.
   */
  public async getOwner(): Promise<Address | undefined> {
    try {
      return await this.contract.read.owner(); // No arguments if function takes none
    } catch (error) {
      console.error("Error getting factory owner:", error);
      return undefined;
    }
  }

  /**
   * Gets the implementation address used for new Bondkit token clones.
   * @returns The address of the BondkitToken implementation contract.
   */
  public async getBondkitTokenImplementation(): Promise<Address | undefined> {
    try {
      return await this.contract.read.bondkitTokenImplementation(); // No arguments if function takes none
    } catch (error) {
      console.error("Error getting Bondkit token implementation address:", error);
      return undefined;
    }
  }

  // --- Write Methods (Ownership, etc.) --- //

  /**
   * Transfers ownership of the factory contract to a new owner.
   * Requires the current owner to call this method.
   * @param newOwner The address of the new owner.
   * @returns A promise that resolves with the transaction hash.
   */
  public async transferOwnership(newOwner: Address): Promise<Hex | undefined> {
    if (!this.walletClientInstance.account && !this.walletKey) {
      await this.ensureWriteAccount();
      if (!this.walletClientInstance.account && !this.walletKey) {
        throw new Error("Wallet key not set or client not connected with an account for write operation.");
      }
    }
    try {
      const accountToUse = this.walletKey ? privateKeyToAccount(this.walletKey) : this.walletClientInstance.account;
      if (!accountToUse) {
        throw new Error("Account for transaction could not be determined.");
      }
      const hash = await this.contract.write.transferOwnership([newOwner], {
        account: accountToUse,
        chain: this.chain,
      });
      return hash;
    } catch (error) {
      return this.handleError(error, "transferOwnership");
    }
  }

  // /**
  //  * Allows the current owner to renounce ownership of the factory contract.
  //  * This is a dangerous operation and irreversible.
  //  * @returns A promise that resolves with the transaction hash.
  //  */
  // public async renounceOwnership(): Promise<Hex | undefined> {
  //   if (!this.walletClientInstance.account && !this.walletKey) {
  //     throw new Error("Wallet key not set or client not connected with an account for write operation.");
  //   }
  //   try {
  //     const accountToUse = this.walletKey ? privateKeyToAccount(this.walletKey) : this.walletClientInstance.account;
  //     if (!accountToUse) {
  //       throw new Error("Account for transaction could not be determined.");
  //     }
  //     const hash = await this.contract.write.renounceOwnership([], {
  //       account: accountToUse,
  //       chain: this.chain,
  //     });
  //     return hash;
  //   } catch (error) {
  //     return this.handleError(error, "renounceOwnership");
  //   }
  // }
}
