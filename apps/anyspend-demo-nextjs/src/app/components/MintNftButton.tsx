import { components } from '@b3dotfun/sdk/anyspend';
import { useModalStore } from '@b3dotfun/sdk/global-account/react';
import { base } from 'viem/chains';

export function MintNftButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  const handleMint = async () => {
    const usdcOnBase = {
      chainId: base.id,
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
      metadata: {
        logoURI: 'https://b3.fun/logo.png',
      },
    };
    // Generate random token ID between 0 and 6
    const randomTokenId = Math.floor(Math.random() * 7);

    const nftContract: components['schemas']['NftContract'] = {
      chainId: base.id,
      contractAddress: '0xe04074c294d0Db90F0ffBC60fa61b48672C91965',
      price: '1990000', // 1.99 USDC (6 decimals)
      priceFormatted: '1.99',
      currency: usdcOnBase,
      name: 'Mystery B3kemon',
      description: 'Summon a mysterious B3kemon creature!',
      tokenId: randomTokenId,
      type: 'erc1155',
      imageUrl: '',
    };

    setB3ModalOpen(true);
    setB3ModalContentType({
      type: 'anySpendNft',
      nftContract,
    });
  };

  return (
    <button
      onClick={handleMint}
      className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-green-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Mint B3kemon</h3>
        <p className="mt-1 text-sm text-gray-500">Mint your own mysterious B3kemon NFT</p>
      </div>
    </button>
  );
}
