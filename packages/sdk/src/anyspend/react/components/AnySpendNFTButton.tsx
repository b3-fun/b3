import { DEFAULT_NFT_CONTRACT } from "@b3dotfun/sdk/anyspend/constants";
import { Button, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { NftContract } from "@b3dotfun/sdk/anyspend/types";

type AnySpendNFTButtonProps = {
  nftContract?: NftContract;
  recipientAddress?: string;
};

export function AnySpendNFTButton({ nftContract = DEFAULT_NFT_CONTRACT, recipientAddress }: AnySpendNFTButtonProps) {
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "anySpendNft",
      nftContract,
      recipientAddress
    });
    setB3ModalOpen(true);
  };

  return (
    <Button
      onClick={handleClick}
      style={{ backgroundColor: "#3368ef" }}
      className="flex items-center gap-2 font-medium text-white"
    >
      <span>AnySpend NFT</span>
      <img src="https://cdn.b3.fun/b3_logo_white.svg" alt="B3 Logo" className="h-5 w-6" />
    </Button>
  );
}
