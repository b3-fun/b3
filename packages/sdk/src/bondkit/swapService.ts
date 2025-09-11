import type { Address, Hex, WalletClient, PublicClient } from "viem";
import {
  parseUnits,
  formatUnits,
  encodeAbiParameters,
  parseAbiParameters,
  getContract,
  createPublicClient,
  http,
} from "viem";
import { base } from "viem/chains";
import { UniversalRouterAddress, QuoterAddress, Permit2Address, BaseMainnetRpcUrl } from "./constants";
import type { SwapQuote } from "./types";

// Minimal ABIs needed for swap functionality
const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "Currency", name: "currency0", type: "address" },
              { internalType: "Currency", name: "currency1", type: "address" },
              { internalType: "uint24", name: "fee", type: "uint24" },
              { internalType: "int24", name: "tickSpacing", type: "int24" },
              { internalType: "contract IHooks", name: "hooks", type: "address" },
            ],
            internalType: "struct PoolKey",
            name: "poolKey",
            type: "tuple",
          },
          { internalType: "bool", name: "zeroForOne", type: "bool" },
          { internalType: "uint128", name: "exactAmount", type: "uint128" },
          { internalType: "bytes", name: "hookData", type: "bytes" },
        ],
        internalType: "struct IV4Quoter.QuoteExactSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const PERMIT2_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const TOKEN_V4_CONFIG_ABI = [
  {
    inputs: [],
    name: "v4Hook",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "v4PoolFee",
    outputs: [{ internalType: "uint24", name: "", type: "uint24" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "v4TickSpacing",
    outputs: [{ internalType: "int24", name: "", type: "int24" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Command and action constants
const COMMANDS = {
  V4_SWAP: "0x10",
} as const;

const V4_ACTIONS = {
  SWAP_EXACT_IN_SINGLE: 6,
  TAKE_ALL: 15,
  SETTLE_ALL: 12,
} as const;

interface V4PoolConfig {
  hook: string;
  fee: number;
  tickSpacing: number;
}

interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  slippageTolerance: number;
  recipient: Address;
  deadline?: number;
}

/**
 * Internal swap service for handling Uniswap V4 swaps between trading token and bondkit token
 */
export class BondkitSwapService {
  private v4Config: V4PoolConfig | null = null;
  private configInitialized = false;
  private readonly bondkitTokenAddress: Address;
  private readonly publicClient: PublicClient;

  constructor(bondkitTokenAddress: Address) {
    this.bondkitTokenAddress = bondkitTokenAddress;
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(BaseMainnetRpcUrl),
    }) as PublicClient;
  }

  /**
   * Initialize V4 pool configuration from bondkit token contract
   */
  private async initializeV4Config(): Promise<void> {
    if (this.configInitialized) {
      return;
    }

    try {
      const tokenContract = getContract({
        address: this.bondkitTokenAddress,
        abi: TOKEN_V4_CONFIG_ABI,
        client: this.publicClient,
      });

      const [hook, fee, tickSpacing] = await Promise.all([
        tokenContract.read.v4Hook(),
        tokenContract.read.v4PoolFee(),
        tokenContract.read.v4TickSpacing(),
      ]);

      this.v4Config = {
        hook: hook as string,
        fee: Number(fee),
        tickSpacing: Number(tickSpacing),
      };

      this.configInitialized = true;
    } catch (error) {
      console.warn("Failed to initialize V4 configuration:", error);
      // Use fallback configuration
      this.v4Config = {
        hook: "0xB36f4A2FB18b745ef8eD31452781a463d2B3f0cC",
        fee: 30000,
        tickSpacing: 60,
      };
      this.configInitialized = true;
    }
  }

  /**
   * Get V4 pool configuration
   */
  private async getV4Config(): Promise<V4PoolConfig> {
    await this.initializeV4Config();
    return this.v4Config!;
  }

  /**
   * Handle token approvals for swap
   */
  private async handleTokenApprovals(
    tokenAddress: Address,
    amountIn: string,
    walletClient: WalletClient,
    deadline: number,
  ): Promise<void> {
    // Skip approvals for ETH
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      return;
    }

    const userAddress = walletClient.account?.address;
    if (!userAddress) {
      throw new Error("No user address found");
    }

    const erc20Contract = getContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      client: walletClient,
    });

    const permit2Contract = getContract({
      address: Permit2Address,
      abi: PERMIT2_ABI,
      client: walletClient,
    });

    // Check ERC20 allowance to Permit2
    const currentAllowance = (await erc20Contract.read.allowance([userAddress, Permit2Address])) as bigint;

    const requiredAmount = BigInt(amountIn);

    if (currentAllowance < requiredAmount) {
      await erc20Contract.write.approve(
        [Permit2Address, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")],
        {
          account: userAddress,
          chain: base,
        },
      );
    }

    // Check Permit2 allowance for Universal Router
    const permit2Allowance = (await permit2Contract.read.allowance([
      userAddress,
      tokenAddress,
      UniversalRouterAddress,
    ])) as [bigint, number, number];

    const [currentPermit2Amount, expiration] = permit2Allowance;
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = expiration <= currentTime;

    if (currentPermit2Amount < requiredAmount || isExpired) {
      await permit2Contract.write.approve(
        [tokenAddress, UniversalRouterAddress, BigInt("0xffffffffffffffffffffffffffffffffffffff"), Number(deadline)],
        {
          account: userAddress,
          chain: base,
        },
      );
    }
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(params: SwapParams): Promise<SwapQuote | null> {
    try {
      const { tokenIn, tokenOut, amountIn, tokenInDecimals, tokenOutDecimals, slippageTolerance } = params;

      const v4Config = await this.getV4Config();
      const amountInWei = parseUnits(amountIn, tokenInDecimals);

      // Determine token order for pool
      const currency0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
      const currency1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
      const zeroForOne = tokenIn.toLowerCase() === currency0.toLowerCase();

      const poolKey = {
        currency0: currency0 as Address,
        currency1: currency1 as Address,
        fee: v4Config.fee,
        tickSpacing: v4Config.tickSpacing,
        hooks: v4Config.hook as Address,
      };

      const quoteParams = {
        poolKey,
        zeroForOne,
        exactAmount: BigInt(amountInWei.toString()),
        hookData: "0x" as Hex,
      };

      const { result } = await this.publicClient.simulateContract({
        address: QuoterAddress,
        abi: QUOTER_ABI,
        functionName: "quoteExactInputSingle",
        args: [quoteParams],
      });

      const [amountOut] = result;
      const amountOutRaw = formatUnits(amountOut, tokenOutDecimals);
      const amountOutFormatted = parseFloat(amountOutRaw).toFixed(Math.min(6, tokenOutDecimals));

      // Calculate minimum amount out with slippage
      const slippageMultiplier = (100 - slippageTolerance) / 100;
      const amountOutMinRaw = parseFloat(amountOutFormatted) * slippageMultiplier;
      const amountOutMin = amountOutMinRaw.toFixed(tokenOutDecimals);

      // Simple execution price calculation
      const rate = parseFloat(amountOutFormatted) / parseFloat(amountIn);
      const executionPrice = `1 = ${rate.toFixed(6)}`;

      return {
        amountOut: amountOutFormatted,
        amountOutMin,
        priceImpact: "0.0", // Simplified
        executionPrice,
        fee: (v4Config.fee / 10000).toString(),
      };
    } catch (error) {
      console.warn("Error getting swap quote:", error);
      return null;
    }
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(params: SwapParams, walletClient: WalletClient): Promise<string | null> {
    try {
      const { tokenIn, tokenOut, amountIn, tokenInDecimals, tokenOutDecimals, deadline } = params;

      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 3600;

      if (!walletClient.account) {
        throw new Error("Wallet client must have an account");
      }

      const amountInWei = parseUnits(amountIn, tokenInDecimals);

      // Handle token approvals
      await this.handleTokenApprovals(tokenIn, amountInWei.toString(), walletClient, swapDeadline);

      // Get quote for minimum amount out
      const quote = await this.getSwapQuote(params);
      if (!quote) {
        throw new Error("Unable to get swap quote");
      }

      const amountOutMinimum = parseUnits(quote.amountOutMin, tokenOutDecimals);
      const v4Config = await this.getV4Config();

      // Determine token order
      const currency0 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenIn : tokenOut;
      const currency1 = tokenIn.toLowerCase() < tokenOut.toLowerCase() ? tokenOut : tokenIn;
      const zeroForOne = tokenIn.toLowerCase() === currency0.toLowerCase();

      const poolKey = [currency0, currency1, v4Config.fee, v4Config.tickSpacing, v4Config.hook];

      // Encode V4 actions
      const actions = [
        {
          type: V4_ACTIONS.SWAP_EXACT_IN_SINGLE,
          params: [poolKey, zeroForOne, amountInWei, amountOutMinimum, "0x" as `0x${string}`],
        },
        {
          type: V4_ACTIONS.TAKE_ALL,
          params: [(zeroForOne ? currency1 : currency0) as Address, BigInt(0)],
        },
        {
          type: V4_ACTIONS.SETTLE_ALL,
          params: [(zeroForOne ? currency0 : currency1) as Address, amountInWei],
        },
      ];

      // Encode actions
      const actionTypes = actions.map(action => action.type);
      const actionsBytes = ("0x" + actionTypes.map(type => type.toString(16).padStart(2, "0")).join("")) as Hex;

      const actionParams = actions.map(action => {
        switch (action.type) {
          case V4_ACTIONS.SWAP_EXACT_IN_SINGLE:
            return encodeAbiParameters(
              parseAbiParameters("((address,address,uint24,int24,address),bool,uint128,uint128,bytes)"),
              [action.params as any],
            );
          case V4_ACTIONS.TAKE_ALL:
            return encodeAbiParameters(parseAbiParameters("address,uint256"), action.params as [Address, bigint]);
          case V4_ACTIONS.SETTLE_ALL:
            return encodeAbiParameters(parseAbiParameters("address,uint256"), action.params as [Address, bigint]);
          default:
            return "0x00" as Hex;
        }
      });

      const v4SwapInput = encodeAbiParameters(parseAbiParameters("bytes,bytes[]"), [actionsBytes, actionParams]);

      const commands = COMMANDS.V4_SWAP;
      const inputs = [v4SwapInput];

      // Execute swap
      const universalRouter = getContract({
        address: UniversalRouterAddress,
        abi: UNIVERSAL_ROUTER_ABI,
        client: walletClient,
      });

      const txHash = await universalRouter.write.execute([commands, inputs, BigInt(swapDeadline)], {
        account: walletClient.account,
        chain: base,
        value: tokenIn === "0x0000000000000000000000000000000000000000" ? amountInWei : BigInt(0),
      });

      return txHash;
    } catch (error) {
      console.warn("Error executing swap:", error);
      return null;
    }
  }
}
