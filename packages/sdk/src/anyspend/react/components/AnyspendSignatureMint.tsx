import { B3_TOKEN, OrderType } from "@b3dotfun/sdk/anyspend";
import {
  Button,
  GlareCardRounded,
  StyleRoot,
  useChainSwitchWithAction,
  useHasMounted,
  useModalStore,
  useTokenData,
} from "@b3dotfun/sdk/global-account/react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createPublicClient, decodeEventLog, http, parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ABI_SIGNATURE_MINTING, ABI_TRANSFER_SINGLE_EVENT } from "../../abis/signature-minting";
import { GenerateSigMintResponse } from "../../types/signature-mint";
import { AnySpendCustom } from "./AnySpendCustom";

export function AnyspendSignatureMint({
  isMainnet = true,
  loadOrder,
  mode = "modal",
  signatureData,
  imageUrl,
  onSuccess,
}: {
  isMainnet?: boolean;
  loadOrder?: string;
  mode?: "modal" | "page";
  signatureData: GenerateSigMintResponse;
  imageUrl?: string;
  onSuccess?: () => void;
}) {
  const hasMounted = useHasMounted();
  const { setB3ModalOpen } = useModalStore();

  // Wagmi hooks for direct minting
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAndExecute } = useChainSwitchWithAction();

  // Get token data
  const { data: tokenData, isError: isTokenError } = useTokenData(
    signatureData.collection.chainId,
    signatureData.collection.signatureRequestBody.currency
  );

  // Convert token data to AnySpend Token type
  const dstToken = useMemo(() => {
    if (!tokenData) return null;
    
    return {
      address: tokenData.address,
      chainId: signatureData.collection.chainId,
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      metadata: {
        logoURI: tokenData.logoURI,
      },
    };
  }, [tokenData, signatureData.collection.chainId]);

  // State for direct minting flow
  const [isMinting, setIsMinting] = useState(false);
  const [mintingTxHash, setMintingTxHash] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mintedTokenId, setMintedTokenId] = useState<string>();

  // Wait for transaction confirmation
  const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: mintingTxHash as `0x${string}`,
    query: {
      structuralSharing: false, // Disable to avoid BigInt serialization issues
    },
  });

  // Show success modal when transaction is confirmed
  useEffect(() => {
    if (isTxSuccess && mintingTxHash) {
      setShowSuccessModal(true);
      setIsMinting(false);
    }
  }, [isTxSuccess, mintingTxHash]);

  const handleDirectMinting = async () => {
    if (!address || !signatureData?.signature || !signatureData?.payload) return;

    try {
      setIsMinting(true);

      const { signature, payload } = signatureData;
      const { address: collectionAddress, chainId: collectionChainId } = signatureData.collection;

      // Prepare mint request
      const mintRequest = {
        to: payload.to,
        royaltyRecipient: payload.royaltyRecipient,
        royaltyBps: BigInt(payload.royaltyBps || 0),
        primarySaleRecipient: payload.primarySaleRecipient,
        tokenId: BigInt(payload.tokenId || 0),
        uri: payload.uri,
        quantity: BigInt(payload.quantity || 1),
        pricePerToken: parseEther(payload.price?.toString() || "0"),
        currency: payload.currencyAddress,
        validityStartTimestamp: BigInt(payload.mintStartTime || 0),
        validityEndTimestamp: BigInt(payload.mintEndTime || 0),
        uid: payload.uid as `0x${string}`,
      };

      await switchChainAndExecute(collectionChainId, async () => {
        // Execute the mint
        toast.info("Minting NFT...");
        const mintHash = await writeContractAsync({
          address: collectionAddress as `0x${string}`,
          abi: [ABI_SIGNATURE_MINTING[0], ABI_TRANSFER_SINGLE_EVENT],
          functionName: "mintWithSignature",
          args: [mintRequest, signature as `0x${string}`],
          value: parseEther(payload.price?.toString() || "0"),
        });

        setMintingTxHash(mintHash);
        toast.success("Minting transaction submitted!");

        // Wait for receipt to extract tokenId
        const receipt = await createPublicClient({
          chain: { id: collectionChainId } as any,
          transport: http(),
        }).waitForTransactionReceipt({ hash: mintHash });

        // Extract tokenId from logs
        for (const log of receipt.logs) {
          try {
            const decodedLog = decodeEventLog({
              abi: [ABI_TRANSFER_SINGLE_EVENT],
              data: log.data,
              topics: log.topics,
            });

            if (decodedLog.eventName === "TransferSingle") {
              setMintedTokenId(decodedLog.args.id.toString());
              break;
            }
          } catch {
            continue;
          }
        }
      });
    } catch (error) {
      console.error("@@signature-mint:error:", error);
      toast.error("Minting failed. Please try again.");
      setShowSuccessModal(false);
    } finally {
      setIsMinting(false);
    }
  };

  const header = () => (
    <>
      <div className="relative mx-auto size-32">
        <img
          alt="nft preview"
          className="size-full rounded-lg object-cover"
          src={imageUrl || signatureData.payload.metadata.image || "https://cdn.b3.fun/nft-placeholder.png"}
        />
      </div>
      <div className="from-b3-react-background to-as-on-surface-1 mt-[-60px] w-full rounded-t-lg bg-gradient-to-t">
        <div className="h-[60px] w-full" />
        <div className="mb-1 flex w-full flex-col items-center gap-2 p-5">
          <span className="font-sf-rounded text-2xl font-semibold">
            {signatureData.payload.metadata.name || "Mint NFT"}{" "}
            {Number(signatureData.payload.quantity) > 1 ? `(${signatureData.payload.quantity}x)` : ""}
          </span>
        </div>
      </div>
    </>
  );

  // Success Modal for Direct Minting
  if (showSuccessModal) {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center">
          <div className="w-full p-4">
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)",
              }}
              transition={{ duration: 0.3, delay: 0, ease: "easeInOut" }}
              className="relative mx-auto mb-4 size-[120px]"
            >
              <div className="absolute inset-0 scale-95 rounded-[50%] bg-black/30 blur-md"></div>
              <GlareCardRounded className="overflow-hidden rounded-full border-none">
                <img
                  alt="nft preview"
                  loading="lazy"
                  width="64"
                  height="64"
                  decoding="async"
                  data-nimg="1"
                  className="size-full shrink-0 rounded-full object-cover"
                  src={imageUrl || signatureData.payload.metadata.image || "https://cdn.b3.fun/nft-placeholder.png"}
                />
                <div className="absolute inset-0 rounded-[50%] border border-white/10"></div>
              </GlareCardRounded>
            </motion.div>
            <motion.div
              initial={false}
              animate={{
                opacity: hasMounted ? 1 : 0,
                y: hasMounted ? 0 : 20,
                filter: hasMounted ? "blur(0px)" : "blur(10px)",
              }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            >
              <h2 className="font-sf-rounded mb-1 text-center text-2xl font-semibold">
                NFT Minted Successfully{" "}
                {Number(signatureData.payload.quantity) > 1 ? `(${signatureData.payload.quantity}x)` : ""}
              </h2>
              {mintedTokenId && <p className="text-as-primary/50 text-center text-sm">Token ID: {mintedTokenId}</p>}
            </motion.div>
          </div>

          <motion.div
            initial={false}
            animate={{
              opacity: hasMounted ? 1 : 0,
              y: hasMounted ? 0 : 20,
              filter: hasMounted ? "blur(0px)" : "blur(10px)",
            }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeInOut" }}
            className="bg-b3-react-background w-full p-6"
          >
            <div className="mb-6">
              <a
                href={`https://basescan.org/tx/${mintingTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-as-primary/70 hover:text-as-primary block break-all text-center font-mono text-sm underline transition-colors"
              >
                View transaction
              </a>
            </div>

            <Button
              onClick={() => {
                setB3ModalOpen(false);
                onSuccess?.();
              }}
              className="bg-as-brand hover:bg-as-brand/90 text-as-primary h-14 w-full rounded-xl text-lg font-medium"
            >
              Done
            </Button>
          </motion.div>
        </div>
      </StyleRoot>
    );
  }

  // If price is 0, do direct minting
  if (!signatureData.payload.price || signatureData.payload.price === "0") {
    return (
      <StyleRoot>
        <div className="bg-b3-react-background flex w-full flex-col items-center">
          {header()}
          <div className="w-full p-6">
            <Button
              onClick={handleDirectMinting}
              disabled={isMinting || isTxPending}
              className="bg-as-brand hover:bg-as-brand/90 text-as-primary h-14 w-full rounded-xl text-lg font-medium"
            >
              {isMinting ? "Minting..." : isTxPending ? "Confirming..." : "Mint NFT"}
            </Button>
          </div>
        </div>
      </StyleRoot>
    );
  }

  // If price > 0, show AnySpend flow
  if (signatureData.payload.price && signatureData.payload.price !== "0") {
    const encodedData = signatureData.signature;
    const price = parseEther(signatureData.payload.price.toString());

    // If we don't have token data, show error state
    if (!dstToken || isTokenError) {
      return (
        <StyleRoot>
          <div className="bg-b3-react-background flex w-full flex-col items-center p-8">
            <p className="text-as-red text-center text-sm">
              Failed to fetch payment token information for {signatureData.collection.signatureRequestBody.currency} on chain {signatureData.collection.chainId}. Please try again.
            </p>
          </div>
        </StyleRoot>
      );
    }

    return (
      <AnySpendCustom
        isMainnet={isMainnet}
        loadOrder={loadOrder}
        mode={mode}
        recipientAddress={signatureData.payload.to}
        orderType={OrderType.Custom}
        dstChainId={signatureData.collection.chainId}
        dstToken={dstToken}
        dstAmount={price.toString()}
        contractAddress={signatureData.collection.address}
        encodedData={encodedData}
        metadata={{
          type: OrderType.Custom,
          action: "Signature Mint",
        }}
        header={header}
        onSuccess={onSuccess}
        showRecipient={true}
      />
    );
  }

  // Error state
  return (
    <StyleRoot>
      <div className="bg-b3-react-background flex w-full flex-col items-center p-8">
        <p className="text-as-red text-center text-sm">Failed to prepare mint. Please try again.</p>
      </div>
    </StyleRoot>
  );
}
