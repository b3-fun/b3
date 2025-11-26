"use client";

import {
  useGenerateSigMintData,
  useIsMintEligible,
  useSigMintCollection,
} from "@b3dotfun/sdk/anyspend/react/hooks/useSigMint";
import { toast, useAccountWallet } from "@b3dotfun/sdk/global-account/react";
import { Button } from "@b3dotfun/sdk/global-account/react/components/custom/Button";
import { useModalStore } from "@b3dotfun/sdk/global-account/react/stores/useModalStore";
import { useRef, useState } from "react";

export function SignatureMint() {
  const { wallet } = useAccountWallet();
  const [isLoading, setIsLoading] = useState(false);
  const promptRef = useRef("hello corgi");
  const contractAddressRef = useRef("0x8e5d0d12b267f9913db6ca4718c27ba0d5d49b25");
  const chainIdRef = useRef(8333); // Default to Base

  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  // Initialize hooks with empty initial values
  const eligibilityHook = useIsMintEligible({
    contractAddress: "",
    chainId: 0,
    recipientAddress: "",
    quantity: "0",
  });

  const collectionHook = useSigMintCollection({
    address: "",
    chainId: 0,
  });

  const signatureHook = useGenerateSigMintData({
    recipientAddress: "",
    contractAddress: "",
    chainId: 0,
    quantity: "0",
    prompt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet?.address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!contractAddressRef.current || !chainIdRef.current || !promptRef.current) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);

      // Check eligibility
      const eligibilityResponse = await eligibilityHook.runQuery({
        contractAddress: contractAddressRef.current,
        chainId: chainIdRef.current,
        recipientAddress: wallet.address,
        quantity: "1",
      });

      if (!eligibilityResponse?.eligible) {
        toast.error("You are not eligible to mint from this collection");
        return;
      }

      // Get collection data
      const collectionData = await collectionHook.runQuery({
        address: contractAddressRef.current,
        chainId: chainIdRef.current,
      });

      if (!collectionData) {
        toast.error("Failed to fetch collection data");
        return;
      }

      // Get signature data
      const signatureData = await signatureHook.runQuery({
        recipientAddress: wallet.address,
        contractAddress: contractAddressRef.current,
        chainId: chainIdRef.current,
        quantity: "1",
        prompt: promptRef.current,
      });

      if (!signatureData) {
        toast.error("Failed to generate signature data");
        return;
      }

      // Prepare modal data
      const modalData = {
        type: "anySpendSignatureMint" as const,
        mode: "modal",
        signatureData: {
          signature: signatureData.signature,
          payload: signatureData.payload,
          collection: {
            ...collectionData,
            chainId: chainIdRef.current,
            address: contractAddressRef.current,
          },
          mode: "modal",
        },
        imageUrl: "https://cdn.b3.fun/spawn-video.mp4",
        showBackButton: true,
        onSuccess: (txHash?: string) => {
          toast.success(`Successfully minted! ${txHash}`);
          // Reset form
          promptRef.current = "";
          const promptInput = document.querySelector(
            'input[placeholder="Enter your prompt for the NFT"]',
          ) as HTMLInputElement;
          if (promptInput) promptInput.value = "";
          setB3ModalOpen(false); // Close modal after success
        },
      };

      // Open modal with signature data
      setB3ModalOpen(true);
      setB3ModalContentType(modalData);
    } catch (error) {
      console.error("@@signature-mint-form:error", error);
      toast.error("Failed to setup minting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h2 className="text-2xl font-bold">Signature Mint Example</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Contract Address</label>
          <input
            defaultValue={contractAddressRef.current}
            onChange={e => (contractAddressRef.current = e.target.value)}
            placeholder="0x..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Chain ID</label>
          <input
            type="number"
            defaultValue={chainIdRef.current}
            onChange={e => (chainIdRef.current = Number(e.target.value))}
            placeholder="8453"
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Prompt</label>
          <input
            defaultValue={promptRef.current}
            onChange={e => (promptRef.current = e.target.value)}
            placeholder="Enter your prompt for the NFT"
            className="w-full rounded-lg border border-gray-300 px-4 py-2"
          />
        </div>

        <Button disabled={isLoading || !wallet?.address}>{isLoading ? "Loading..." : "Generate Mint"}</Button>
      </form>

      {/* Loading states */}
      {isLoading && <div className="text-sm text-gray-500">Setting up minting...</div>}
    </div>
  );
}
