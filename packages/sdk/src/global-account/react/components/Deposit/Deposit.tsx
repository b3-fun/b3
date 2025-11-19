import { RELAY_SOLANA_MAINNET_CHAIN_ID } from "@b3dotfun/sdk/anyspend/constants";
import type { components } from "@b3dotfun/sdk/anyspend/types/api";
import { ALL_CHAINS } from "@b3dotfun/sdk/anyspend/utils/chain";
import { toast, useAccountWallet, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { TokenSelector } from "@relayprotocol/relay-kit-ui";
import { ChevronDown, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";

import { base } from "thirdweb/chains";
import ModalHeader from "../ModalHeader/ModalHeader";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

// Coinbase logo SVG
const CoinbaseLogo = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z"
      fill="#0052FF"
    />
    <path
      d="M8.00065 11.3337C6.16065 11.3337 4.66732 9.84033 4.66732 8.00033C4.66732 6.16033 6.16065 4.66699 8.00065 4.66699C9.47399 4.66699 10.734 5.64699 11.1607 7.00033H13.2273C12.774 4.54699 10.6273 2.66699 8.00065 2.66699C5.05399 2.66699 2.66732 5.05366 2.66732 8.00033C2.66732 10.947 5.05399 13.3337 8.00065 13.3337C10.6273 13.3337 12.774 11.4537 13.2273 9.00033H11.1607C10.734 10.3537 9.47399 11.3337 8.00065 11.3337Z"
      fill="white"
    />
  </svg>
);

export function Deposit() {
  const { address } = useAccountWallet();
  const navigateBack = useModalStore(state => state.navigateBack);
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const history = useModalStore(state => state.history);

  const [selectedChainId, setSelectedChainId] = useState(base.id);
  const [selectedToken, setSelectedToken] = useState<components["schemas"]["Token"]>({
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    chainId: base.id,
    decimals: 6,
    symbol: "USDC",
    name: "USD Coin",
    metadata: {
      logoURI: "https://assets.relay.link/icons/1/light/usdc.png",
    },
  });

  // Get the selected chain object
  const selectedChain = useMemo(() => ALL_CHAINS[selectedChainId], [selectedChainId]);

  // Get all supported chains for the dropdown
  const supportedChains = useMemo(() => Object.values(ALL_CHAINS), []);

  // The deposit address is the user's active wallet address
  const depositAddress = address || "0x0000000000000000000000000000000000000000";

  const handleTokenSelect = (token: any) => {
    setSelectedChainId(token.chainId);
    setSelectedToken({
      address: token.address,
      chainId: token.chainId,
      decimals: token.decimals,
      metadata: { logoURI: token.logoURI },
      name: token.name,
      symbol: token.symbol,
    });
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  return (
    <div className="flex w-full flex-col">
      <ModalHeader title="Deposit" showCloseButton={false} />

      {/* Content */}
      <div className="flex flex-col pb-5 pt-5">
        {/* Header text */}
        <div className="mb-4 px-5">
          <p className="font-neue-montreal-medium text-base leading-snug text-[#3f3f46]">
            Send any accepted token and we'll convert it to B3 on Base for you to use.
          </p>
        </div>

        {/* Chain and Token Selectors */}
        <div className="space-y-3 px-5">
          {/* Chain Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3f3f46]">Chain</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-full items-center justify-between rounded-lg border border-[#d1d1d6] bg-white px-2.5 py-2 transition-colors hover:bg-[#fafafa]">
                  <div className="flex items-center gap-2">
                    {selectedChain?.logoUrl && (
                      <img src={selectedChain.logoUrl} alt={selectedChain.name} className="h-6 w-6 rounded-full" />
                    )}
                    <span className="text-base text-[#18181b]">{selectedChain?.name || "Select Chain"}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#51525c]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] w-full overflow-y-auto">
                {supportedChains.map(chain => (
                  <DropdownMenuItem key={chain.id} onClick={() => setSelectedChainId(chain.id)}>
                    <div className="flex items-center gap-2">
                      {chain.logoUrl && <img src={chain.logoUrl} alt={chain.name} className="h-6 w-6 rounded-full" />}
                      <span className="text-[#18181b]">{chain.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Accepted Tokens Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#3f3f46]">Accepted tokens</label>
            <TokenSelector
              address={address}
              chainIdsFilter={[selectedChainId]}
              context="from"
              fromChainWalletVMSupported={true}
              isValidAddress={true}
              lockedChainIds={[selectedChainId]}
              multiWalletSupportEnabled={true}
              onAnalyticEvent={undefined}
              popularChainIds={[1, 8453, RELAY_SOLANA_MAINNET_CHAIN_ID]}
              setToken={handleTokenSelect}
              supportedWalletVMs={["evm", "svm"]}
              token={undefined}
              trigger={
                <button className="flex h-10 w-full items-center justify-between rounded-lg border border-[#d1d1d6] bg-white px-2.5 py-2 transition-colors hover:bg-[#fafafa]">
                  <div className="flex items-center gap-2">
                    {selectedToken?.metadata?.logoURI && (
                      <img
                        src={selectedToken.metadata.logoURI}
                        alt={selectedToken.symbol}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-base text-[#18181b]">{selectedToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#51525c]" />
                </button>
              }
            />
          </div>
        </div>

        {/* QR Code and Address Container */}
        <div className="mx-5 mt-4 flex items-start rounded-xl border border-[#e4e4e7] bg-[#fafafa]">
          {/* QR Code Section */}
          <div className="flex flex-1 flex-col items-center gap-2 px-5 pb-3 pt-5">
            <div className="flex w-full items-center justify-center">
              <div className="w-full">
                <div className="flex aspect-[144/146] w-full flex-col items-center justify-center overflow-hidden">
                  <QRCodeSVG value={depositAddress} size={144} level="M" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold leading-[18px] text-[#0b57c2]">SCAN WITH</span>
              <CoinbaseLogo />
            </div>
          </div>

          {/* Deposit Address Section */}
          <div className="relative flex flex-1 flex-col gap-2 self-stretch border-l border-[#e4e4e7] p-6">
            <label className="text-sm font-medium leading-5 text-[#3f3f46]">Deposit address:</label>
            <div className="relative flex w-full flex-wrap items-center gap-2">
              <p className="h-[74px] flex-1 overflow-hidden text-ellipsis whitespace-pre-wrap break-all pr-6 text-base font-semibold leading-6 text-[#18181b]">
                {depositAddress}
              </p>
              <button
                onClick={handleCopyAddress}
                className="absolute bottom-0 right-0 h-4 w-4 transition-opacity hover:opacity-70"
                aria-label="Copy address"
              >
                <Copy className="h-full w-full text-[#51525c]" />
              </button>
            </div>
          </div>
        </div>

        {/* Warning Text */}
        <div className="mx-5 mt-4">
          <p className="font-neue-montreal-italic text-center text-sm leading-[1.3] text-[#3f3f46]">
            Do not send any tokens other than the ones specified.
            <br />
            Tokens not accepted will not be converted.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-4 px-5">
          <Button
            onClick={handleCopyAddress}
            className="h-12 w-full rounded-xl bg-[#0c68e9] text-base font-semibold text-white shadow-[inset_0px_0px_0px_1px_rgba(10,13,18,0.18),inset_0px_-2px_0px_0px_rgba(10,13,18,0.05)] hover:bg-[#0b5fd4]"
          >
            Copy deposit address
          </Button>
        </div>
      </div>
    </div>
  );
}
