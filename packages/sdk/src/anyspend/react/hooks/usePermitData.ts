import { chainIdToPublicClient, getMulticall3Address, isEvmChain, isNativeToken } from "@b3dotfun/sdk/anyspend/utils";
import { useQuery } from "@tanstack/react-query";
import { Address, Hex } from "viem";
import { ABI_USDC_BASE } from "@b3dotfun/sdk/anyspend/abis/abi-usdc-base";

export type GetPermitDataParams = {
  chainId: number;
  tokenAddress: Hex;
  ownerAddress: Hex | undefined;
  amount: bigint;
};

// EIP-5267 ABI for eip712Domain function
const EIP5267_ABI = [
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      { name: "fields", type: "bytes1" },
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

export async function getPermitData(p: GetPermitDataParams) {
  console.log("Start getting permit data...");

  if (!isEvmChain(p.chainId) || isNativeToken(p.tokenAddress) || !p.ownerAddress) {
    return {
      canPermit: false,
      data: null
    };
  }

  const publicClient = chainIdToPublicClient(p.chainId);

  const balance = await publicClient.readContract({
    address: p.tokenAddress,
    abi: ABI_USDC_BASE,
    functionName: "balanceOf",
    args: [p.ownerAddress]
  });
  if (balance < p.amount) {
    return {
      canPermit: false,
      data: null
    };
  }

  // Domain parameters
  let name: string;
  let version: string = "1"; // Default version for EIP-2612 (used by Uniswap V2 reference implementation)

  // Try to get domain information using EIP-5267 (eip712Domain function)
  try {
    const domainData = await publicClient.readContract({
      address: p.tokenAddress,
      abi: EIP5267_ABI,
      functionName: "eip712Domain"
    });

    console.log("Found EIP-5267 eip712Domain function");
    name = domainData[1]; // name is the second return value
    version = domainData[2]; // version is the third return value

    console.log("Contract domain data from EIP-5267:");
    console.log("- name:", name);
    console.log("- version:", version);
    console.log("- chainId:", domainData[3]);
    console.log("- verifyingContract:", domainData[4]);
  } catch (error) {
    console.log("[EIP-5267] eip712Domain function not found, falling back to individual calls");

    // Fallback: get name from contract
    name = await publicClient.readContract({
      address: p.tokenAddress,
      abi: ABI_USDC_BASE,
      functionName: "name"
    });

    // Try to get version from contract
    try {
      version = await publicClient.readContract({
        address: p.tokenAddress,
        abi: ABI_USDC_BASE,
        functionName: "version"
      });
    } catch (error) {
      console.log(`Function "version" not found, using default version "1" (standard for EIP-2612)`);
    }
  }

  // Fetch the PERMIT_TYPEHASH - important for ensuring our structure matches the contract
  const permitTypeHash = await publicClient
    .readContract({
      address: p.tokenAddress,
      abi: ABI_USDC_BASE,
      functionName: "PERMIT_TYPEHASH"
    })
    .catch(() => {
      console.log("PERMIT_TYPEHASH not directly accessible, using standard EIP-2612 value");
      return "0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9" as `0x${string}`;
    });

  // Fetch the DOMAIN_SEPARATOR - critical for signature validation
  const contractDomainSeparator = await publicClient.readContract({
    address: p.tokenAddress,
    abi: ABI_USDC_BASE,
    functionName: "DOMAIN_SEPARATOR"
  });

  console.log("Contract name:", name);
  console.log("Contract version:", version);
  console.log("Contract PERMIT_TYPEHASH:", permitTypeHash);
  console.log("Contract DOMAIN_SEPARATOR:", contractDomainSeparator);

  // Domain data for EIP-712 signature
  const domain = {
    name,
    version,
    chainId: p.chainId,
    verifyingContract: p.tokenAddress
  };

  // EIP-2612 Permit type definition
  // This must match the structure used to compute the PERMIT_TYPEHASH in the contract
  const PermitType = [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" }
  ];

  const multicall3 = getMulticall3Address(p.chainId);

  const nonce = await publicClient.readContract({
    address: p.tokenAddress,
    abi: ABI_USDC_BASE,
    functionName: "nonces",
    args: [p.ownerAddress]
  });

  const deadlineInSeconds = BigInt(Math.floor(Date.now() / 1000) + 60 * 60); // 60 minutes

  // Permit data to sign
  const messageToSign = {
    owner: p.ownerAddress,
    spender: multicall3 as Address,
    value: p.amount,
    nonce,
    deadline: deadlineInSeconds
  };

  return {
    canPermit: true,
    data: {
      domain,
      types: { Permit: PermitType },
      messageToSign
    }
  };
}

export function usePermitData(p: GetPermitDataParams) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["usePermitData", p.chainId, p.tokenAddress],
    queryFn: () => getPermitData(p)
  });

  return {
    permitData: data,
    isCheckingPermit: isLoading,
    checkPermitError: error,
    recheckPermit: refetch
  };
}
