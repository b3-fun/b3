import { StyleRoot, useTokenData } from "@b3dotfun/sdk/global-account/react";
import invariant from "@b3dotfun/sdk/shared/utils/debug";
import { useMemo } from "react";
import { encodeFunctionData, parseEther } from "viem";
import { ABI_SIGNATURE_MINTING } from "../../abis/signatureMinting";
import { GenerateSigMintResponse } from "../../types/signatureMint";
import { AnySpendCustom } from "./AnySpendCustom";

// Helper function to determine if URL is a video
function isVideoURL(url: string): boolean {
  const videoExtensions = [".mp4", ".webm", ".ogg"];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
}

function generateEncodedDataForSignatureMint(signatureData: GenerateSigMintResponse): string {
  const { signature, payload } = signatureData;
  invariant(signature, "Signature is required");
  invariant(payload, "Payload is required");

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

  const encodedData = encodeFunctionData({
    abi: [ABI_SIGNATURE_MINTING[0]],
    functionName: "mintWithSignature",
    args: [mintRequest, signature as `0x${string}`],
  });

  return encodedData;
}

export function AnyspendSignatureMint({
  loadOrder,
  mode = "modal",
  signatureData,
  imageUrl,
  onSuccess,
}: {
  loadOrder?: string;
  mode?: "modal" | "page";
  signatureData: GenerateSigMintResponse;
  imageUrl?: string;
  onSuccess?: (txHash?: string) => void;
}) {
  // Get token data
  const {
    data: tokenData,
    isError: isTokenError,
    isLoading,
  } = useTokenData(signatureData.collection.chainId, signatureData.collection.signatureRequestBody?.currency);

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

  const mediaUrl = imageUrl || signatureData.payload.metadata.image || "https://cdn.b3.fun/nft-placeholder.png";
  const isVideo = isVideoURL(mediaUrl);

  const header = () => (
    <>
      <div className="relative mx-auto size-32">
        {isVideo ? (
          <video autoPlay loop muted playsInline className="size-full rounded-lg object-cover">
            <source src={mediaUrl} type={`video/${mediaUrl.split(".").pop()}`} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img alt="nft preview" className="size-full rounded-lg object-cover" src={mediaUrl} />
        )}
      </div>
      <div className="mt-[-60px] w-full rounded-t-lg bg-white">
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

  // Show loading state while fetching token data
  if (isLoading) {
    return (
      <StyleRoot>
        <div className="b3-root b3-modal bg-b3-react-background flex w-full flex-col items-center p-8">
          <p className="text-as-primary/70 text-center text-sm">Loading payment token information...</p>
        </div>
      </StyleRoot>
    );
  }

  // If we don't have token data after loading, show error state
  if (!dstToken || isTokenError) {
    return (
      <StyleRoot>
        <div className="b3-root b3-modal bg-b3-react-background flex w-full flex-col items-center p-8">
          <p className="text-as-red text-center text-sm">
            Failed to fetch payment token information for {signatureData.collection.signatureRequestBody?.currency} on
            chain {signatureData.collection.chainId}. Please try again.
          </p>
        </div>
      </StyleRoot>
    );
  }

  const encodedData = generateEncodedDataForSignatureMint(signatureData);
  const price = parseEther(signatureData.payload.price?.toString() || "0");

  return (
    <AnySpendCustom
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={signatureData.payload.to}
      orderType={"custom"}
      dstChainId={signatureData.collection.chainId}
      dstToken={dstToken}
      dstAmount={price.toString()}
      contractAddress={signatureData.collection.address!}
      encodedData={encodedData}
      metadata={{
        type: "custom",
        action: "Signature Mint",
      }}
      header={header}
      onSuccess={onSuccess}
      showRecipient={true}
    />
  );
}
