import { B3_TOKEN, USDC_BASE } from "@b3dotfun/sdk/anyspend";
import { AnySpend, AnySpendNFT } from "@b3dotfun/sdk/anyspend/react";
import { components } from "@b3dotfun/sdk/anyspend/types/api";
import { useMemo, useState } from "react";
import { arbitrum, base, mainnet } from "viem/chains";

// Types for our playground configuration
interface PlaygroundConfig {
  componentType: "anyspend" | "anyspend-nft";
  // AnySpend props
  mode: "page" | "modal";
  defaultActiveTab: "crypto" | "fiat";
  destinationTokenAddress?: string;
  destinationTokenChainId?: number;
  recipientAddress?: string;
  hideTransactionHistoryButton?: boolean;
  // NFT specific props
  nftContract?: components["schemas"]["NftContract"];
  // Branding
  theme: "dark" | "light";
  fontFamily: string;
  // Comprehensive color system based on actual CSS variables
  colors: {
    // AnySpend colors
    asPrimary: string;
    asContentPrimary: string;
    asContentSecondary: string;
    asSurfacePrimary: string;
    asSurfaceSecondary: string;
    asOnSurface1: string;
    asOnSurface2: string;
    asOnSurface3: string;
    asBorderPrimary: string;
    asBorderSecondary: string;
    asStroke: string;
    asBrand: string;
    asLightBrand: string;
    asSecondary: string;
    asRed: string;
    asYellow: string;
    // B3 React colors
    b3ReactBackground: string;
    b3ReactForeground: string;
    b3ReactCard: string;
    b3ReactBorder: string;
    b3ReactPrimary: string;
    b3ReactMutedForeground: string;
  };
}

const defaultConfig: PlaygroundConfig = {
  componentType: "anyspend",
  mode: "page",
  defaultActiveTab: "crypto",
  recipientAddress: "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4",
  hideTransactionHistoryButton: false,
  theme: "light",
  fontFamily: "Inter",
  colors: {
    // AnySpend colors (light theme defaults)
    asPrimary: "hsl(204, 9%, 11%)",
    asContentPrimary: "hsl(240, 6%, 10%)",
    asContentSecondary: "hsl(240, 5%, 26%)",
    asSurfacePrimary: "hsl(0, 0%, 100%)",
    asSurfaceSecondary: "hsl(0, 0%, 98%)",
    asOnSurface1: "hsl(0, 0%, 99%)",
    asOnSurface2: "hsl(0, 0%, 94%)",
    asOnSurface3: "hsl(210, 9%, 91%)",
    asBorderPrimary: "hsl(240, 6%, 83%)",
    asBorderSecondary: "hsl(240, 6%, 90%)",
    asStroke: "hsl(0, 0%, 94%)",
    asBrand: "hsl(215, 90%, 48%)",
    asLightBrand: "hsl(215, 90%, 70%)",
    asSecondary: "hsl(212, 6%, 46%)",
    asRed: "hsl(14, 88%, 52%)",
    asYellow: "hsl(32, 96%, 64%)",
    // B3 React colors
    b3ReactBackground: "hsl(0, 0%, 100%)",
    b3ReactForeground: "hsl(0, 0%, 10%)",
    b3ReactCard: "hsl(0, 0%, 98%)",
    b3ReactBorder: "hsl(0, 0%, 90%)",
    b3ReactPrimary: "hsl(210, 80%, 45%)",
    b3ReactMutedForeground: "hsl(0, 0%, 50%)",
  },
};

// Sample NFT contract for testing
const sampleNFTContract: components["schemas"]["NftContract"] = {
  chainId: base.id,
  contractAddress: "0xe04074c294d0Db90F0ffBC60fa61b48672C91965",
  price: "1990000", // 1.99 USDC (6 decimals)
  priceFormatted: "1.99",
  currency: USDC_BASE,
  imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
  name: "Mystery B3kemon",
  description: "Summon a mysterious B3kemon creature!",
  tokenId: 1,
  type: "erc1155",
};

// Available tokens for selection
const availableTokens = [
  { name: "USDC (Base)", address: USDC_BASE.address, chainId: base.id, symbol: "USDC" },
  { name: "B3 Token", address: B3_TOKEN.address, chainId: B3_TOKEN.chainId, symbol: "B3" },
  { name: "ETH (Mainnet)", address: "0x0000000000000000000000000000000000000000", chainId: mainnet.id, symbol: "ETH" },
  { name: "ETH (Base)", address: "0x0000000000000000000000000000000000000000", chainId: base.id, symbol: "ETH" },
  {
    name: "ETH (Arbitrum)",
    address: "0x0000000000000000000000000000000000000000",
    chainId: arbitrum.id,
    symbol: "ETH",
  },
];

// Available chains
const availableChains = [
  { name: "Base", chainId: base.id },
  { name: "Ethereum", chainId: mainnet.id },
  { name: "Arbitrum", chainId: arbitrum.id },
];

// Font families
const fontFamilies = ["Inter", "SF Pro Display", "Roboto", "Open Sans", "Poppins", "Montserrat"];

// Color presets
const colorPresets = {
  "Default Light": {
    asPrimary: "hsl(204, 9%, 11%)",
    asContentPrimary: "hsl(240, 6%, 10%)",
    asContentSecondary: "hsl(240, 5%, 26%)",
    asSurfacePrimary: "hsl(0, 0%, 100%)",
    asSurfaceSecondary: "hsl(0, 0%, 98%)",
    asOnSurface1: "hsl(0, 0%, 99%)",
    asOnSurface2: "hsl(0, 0%, 94%)",
    asOnSurface3: "hsl(210, 9%, 91%)",
    asBorderPrimary: "hsl(240, 6%, 83%)",
    asBorderSecondary: "hsl(240, 6%, 90%)",
    asStroke: "hsl(0, 0%, 94%)",
    asBrand: "hsl(215, 90%, 48%)",
    asLightBrand: "hsl(215, 90%, 70%)",
    asSecondary: "hsl(212, 6%, 46%)",
    asRed: "hsl(14, 88%, 52%)",
    asYellow: "hsl(32, 96%, 64%)",
    b3ReactBackground: "hsl(0, 0%, 100%)",
    b3ReactForeground: "hsl(0, 0%, 10%)",
    b3ReactCard: "hsl(0, 0%, 98%)",
    b3ReactBorder: "hsl(0, 0%, 90%)",
    b3ReactPrimary: "hsl(210, 80%, 45%)",
    b3ReactMutedForeground: "hsl(0, 0%, 50%)",
  },
  "Default Dark": {
    asPrimary: "hsl(0, 0%, 99%)",
    asContentPrimary: "hsl(0, 0%, 98%)",
    asContentSecondary: "hsl(240, 6%, 83%)",
    asSurfacePrimary: "hsl(240, 7%, 8%)",
    asSurfaceSecondary: "hsl(240, 6%, 10%)",
    asOnSurface1: "hsl(204, 9%, 11%)",
    asOnSurface2: "hsl(213, 10%, 17%)",
    asOnSurface3: "hsl(203, 8%, 21%)",
    asBorderPrimary: "hsl(240, 5%, 26%)",
    asBorderSecondary: "hsl(228, 6%, 16%)",
    asStroke: "hsl(213, 10%, 17%)",
    asBrand: "hsl(215, 90%, 48%)",
    asLightBrand: "hsl(215, 90%, 70%)",
    asSecondary: "hsl(212, 6%, 46%)",
    asRed: "hsl(14, 88%, 52%)",
    asYellow: "hsl(32, 96%, 64%)",
    b3ReactBackground: "hsl(0, 0%, 10%)",
    b3ReactForeground: "hsl(0, 0%, 90%)",
    b3ReactCard: "hsl(0, 0%, 15%)",
    b3ReactBorder: "hsl(0, 0%, 25%)",
    b3ReactPrimary: "hsl(210, 80%, 45%)",
    b3ReactMutedForeground: "hsl(0, 0%, 65%)",
  },
  "Purple Theme": {
    asPrimary: "hsl(263, 70%, 20%)",
    asContentPrimary: "hsl(263, 70%, 15%)",
    asContentSecondary: "hsl(263, 30%, 40%)",
    asSurfacePrimary: "hsl(0, 0%, 100%)",
    asSurfaceSecondary: "hsl(263, 20%, 98%)",
    asOnSurface1: "hsl(263, 20%, 99%)",
    asOnSurface2: "hsl(263, 10%, 94%)",
    asOnSurface3: "hsl(263, 15%, 91%)",
    asBorderPrimary: "hsl(263, 20%, 83%)",
    asBorderSecondary: "hsl(263, 15%, 90%)",
    asStroke: "hsl(263, 10%, 94%)",
    asBrand: "hsl(263, 90%, 63%)",
    asLightBrand: "hsl(263, 90%, 75%)",
    asSecondary: "hsl(263, 20%, 46%)",
    asRed: "hsl(14, 88%, 52%)",
    asYellow: "hsl(32, 96%, 64%)",
    b3ReactBackground: "hsl(0, 0%, 100%)",
    b3ReactForeground: "hsl(263, 70%, 15%)",
    b3ReactCard: "hsl(263, 20%, 98%)",
    b3ReactBorder: "hsl(263, 15%, 90%)",
    b3ReactPrimary: "hsl(263, 90%, 63%)",
    b3ReactMutedForeground: "hsl(263, 30%, 50%)",
  },
  "Green Theme": {
    asPrimary: "hsl(153, 70%, 20%)",
    asContentPrimary: "hsl(153, 70%, 15%)",
    asContentSecondary: "hsl(153, 30%, 40%)",
    asSurfacePrimary: "hsl(0, 0%, 100%)",
    asSurfaceSecondary: "hsl(153, 20%, 98%)",
    asOnSurface1: "hsl(153, 20%, 99%)",
    asOnSurface2: "hsl(153, 10%, 94%)",
    asOnSurface3: "hsl(153, 15%, 91%)",
    asBorderPrimary: "hsl(153, 20%, 83%)",
    asBorderSecondary: "hsl(153, 15%, 90%)",
    asStroke: "hsl(153, 10%, 94%)",
    asBrand: "hsl(153, 90%, 39%)",
    asLightBrand: "hsl(153, 90%, 55%)",
    asSecondary: "hsl(153, 20%, 46%)",
    asRed: "hsl(14, 88%, 52%)",
    asYellow: "hsl(32, 96%, 64%)",
    b3ReactBackground: "hsl(0, 0%, 100%)",
    b3ReactForeground: "hsl(153, 70%, 15%)",
    b3ReactCard: "hsl(153, 20%, 98%)",
    b3ReactBorder: "hsl(153, 15%, 90%)",
    b3ReactPrimary: "hsl(153, 90%, 39%)",
    b3ReactMutedForeground: "hsl(153, 30%, 50%)",
  },
};

export default function PlaygroundPage() {
  const [config, setConfig] = useState<PlaygroundConfig>(defaultConfig);

  // Update config helper
  const updateConfig = (updates: Partial<PlaygroundConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Update colors helper
  const updateColors = (colorUpdates: Partial<PlaygroundConfig["colors"]>) => {
    setConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, ...colorUpdates },
    }));
  };

  // Generate CSS variables for theming
  const cssVariables = useMemo(() => {
    return {
      // AnySpend CSS variables
      "--as-primary": config.colors.asPrimary,
      "--as-content-primary": config.colors.asContentPrimary,
      "--as-content-secondary": config.colors.asContentSecondary,
      "--as-surface-primary": config.colors.asSurfacePrimary,
      "--as-surface-secondary": config.colors.asSurfaceSecondary,
      "--as-on-surface-1": config.colors.asOnSurface1,
      "--as-on-surface-2": config.colors.asOnSurface2,
      "--as-on-surface-3": config.colors.asOnSurface3,
      "--as-border-primary": config.colors.asBorderPrimary,
      "--as-border-secondary": config.colors.asBorderSecondary,
      "--as-stroke": config.colors.asStroke,
      "--as-brand": config.colors.asBrand,
      "--as-light-brand": config.colors.asLightBrand,
      "--as-secondary": config.colors.asSecondary,
      "--as-red": config.colors.asRed,
      "--as-yellow": config.colors.asYellow,
      // B3 React CSS variables
      "--b3-react-background": config.colors.b3ReactBackground,
      "--b3-react-foreground": config.colors.b3ReactForeground,
      "--b3-react-card": config.colors.b3ReactCard,
      "--b3-react-border": config.colors.b3ReactBorder,
      "--b3-react-primary": config.colors.b3ReactPrimary,
      "--b3-react-muted-foreground": config.colors.b3ReactMutedForeground,
      fontFamily: config.fontFamily,
    } as React.CSSProperties;
  }, [config]);

  // Generate code example
  const generateCodeExample = () => {
    if (config.componentType === "anyspend") {
      const props = [];
      if (config.mode !== "modal") props.push(`mode="${config.mode}"`);
      if (config.defaultActiveTab !== "crypto") props.push(`defaultActiveTab="${config.defaultActiveTab}"`);
      if (config.destinationTokenAddress) props.push(`destinationTokenAddress="${config.destinationTokenAddress}"`);
      if (config.destinationTokenChainId) props.push(`destinationTokenChainId={${config.destinationTokenChainId}}`);
      if (config.recipientAddress) props.push(`recipientAddress="${config.recipientAddress}"`);
      if (config.hideTransactionHistoryButton) props.push(`hideTransactionHistoryButton={true}`);

      return `<AnySpend${props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : ""} />`;
    } else {
      const props = [];
      if (config.mode !== "modal") props.push(`mode="${config.mode}"`);
      if (config.recipientAddress) props.push(`recipientAddress="${config.recipientAddress}"`);
      props.push(`nftContract={${JSON.stringify(config.nftContract || sampleNFTContract, null, 2)}}`);

      return `<AnySpendNFT${props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : ""} />`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">AnySpend Playground</h1>
          <p className="text-gray-600">Customize and test AnySpend components with live preview</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-4">
            <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Configuration</h2>

              {/* Component Type Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Component Type</label>
                <select
                  value={config.componentType}
                  onChange={e => updateConfig({ componentType: e.target.value as "anyspend" | "anyspend-nft" })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="anyspend">AnySpend (Buy/Swap)</option>
                  <option value="anyspend-nft">AnySpend NFT (Checkout)</option>
                </select>
              </div>

              {/* Basic Props */}
              <div>
                <h3 className="mb-3 text-lg font-medium text-gray-800">Basic Props</h3>

                <div className="space-y-4">
                  {/* Mode */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Mode</label>
                    <select
                      value={config.mode}
                      onChange={e => updateConfig({ mode: e.target.value as "page" | "modal" })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="page">Page</option>
                      <option value="modal">Modal</option>
                    </select>
                  </div>

                  {/* Default Active Tab - Only for AnySpend */}
                  {config.componentType === "anyspend" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Default Active Tab</label>
                      <select
                        value={config.defaultActiveTab}
                        onChange={e => updateConfig({ defaultActiveTab: e.target.value as "crypto" | "fiat" })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="crypto">Crypto</option>
                        <option value="fiat">Fiat</option>
                      </select>
                    </div>
                  )}

                  {/* Recipient Address */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Recipient Address</label>
                    <input
                      type="text"
                      value={config.recipientAddress || ""}
                      onChange={e => updateConfig({ recipientAddress: e.target.value })}
                      placeholder="0x..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* AnySpend specific options */}
                  {config.componentType === "anyspend" && (
                    <>
                      {/* Default Chain */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Destination Chain (Buy Mode)
                        </label>
                        <select
                          value={config.destinationTokenChainId || ""}
                          onChange={e =>
                            updateConfig({
                              destinationTokenChainId: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None (Swap Mode)</option>
                          {availableChains.map(chain => (
                            <option key={chain.chainId} value={chain.chainId}>
                              {chain.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Default Token */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Destination Token (Buy Mode)
                        </label>
                        <select
                          value={config.destinationTokenAddress || ""}
                          onChange={e => {
                            const selectedToken = availableTokens.find(t => t.address === e.target.value);
                            updateConfig({
                              destinationTokenAddress: e.target.value || undefined,
                              destinationTokenChainId: selectedToken?.chainId,
                            });
                          }}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">None (Swap Mode)</option>
                          {availableTokens.map(token => (
                            <option key={`${token.chainId}-${token.address}`} value={token.address}>
                              {token.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Hide Transaction History Button */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideHistory"
                          checked={config.hideTransactionHistoryButton}
                          onChange={e => updateConfig({ hideTransactionHistoryButton: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor="hideHistory" className="text-sm font-medium text-gray-700">
                          Hide Transaction History Button
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Branding Options */}
              <div>
                <h3 className="mb-3 text-lg font-medium text-gray-800">Branding</h3>

                <div className="space-y-4">
                  {/* Theme */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Theme</label>
                    <select
                      value={config.theme}
                      onChange={e => updateConfig({ theme: e.target.value as "dark" | "light" })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Font Family</label>
                    <select
                      value={config.fontFamily}
                      onChange={e => updateConfig({ fontFamily: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {fontFamilies.map(font => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Colors */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-800">Colors</h4>
                    </div>

                    {/* Color Presets */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">Color Presets</label>
                      <select
                        onChange={e => {
                          if (e.target.value && colorPresets[e.target.value as keyof typeof colorPresets]) {
                            updateColors(colorPresets[e.target.value as keyof typeof colorPresets]);
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="">Choose a preset...</option>
                        {Object.keys(colorPresets).map(preset => (
                          <option key={preset} value={preset}>
                            {preset}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* AnySpend Colors */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-700">AnySpend Colors</h5>
                      {Object.entries(config.colors)
                        .filter(([key]) => key.startsWith("as"))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <label className="w-24 text-right text-xs text-gray-600">
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^as/, "AS")
                                .trim()}
                            </label>
                            <input
                              type="text"
                              value={value}
                              onChange={e => updateColors({ [key]: e.target.value } as any)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="hsl(0, 0%, 100%)"
                            />
                          </div>
                        ))}
                    </div>

                    {/* B3 React Colors */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-gray-700">B3 React Colors</h5>
                      {Object.entries(config.colors)
                        .filter(([key]) => key.startsWith("b3React"))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <label className="w-24 text-right text-xs text-gray-600">
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^b3 React/, "B3")
                                .trim()}
                            </label>
                            <input
                              type="text"
                              value={value}
                              onChange={e => updateColors({ [key]: e.target.value } as any)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="hsl(0, 0%, 100%)"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview and Code */}
          <div className="space-y-6 lg:col-span-8">
            {/* Live Preview */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Live Preview</h2>

              <div
                className={`b3-root flex min-h-[600px] items-center justify-center rounded-lg border border-gray-200 p-6 ${config.theme === "dark" ? "data-theme-dark" : ""}`}
                style={cssVariables}
                data-theme={config.theme}
              >
                {config.componentType === "anyspend" ? (
                  <AnySpend
                    mode={config.mode}
                    defaultActiveTab={config.defaultActiveTab}
                    destinationTokenAddress={config.destinationTokenAddress}
                    destinationTokenChainId={config.destinationTokenChainId}
                    recipientAddress={config.recipientAddress}
                    hideTransactionHistoryButton={config.hideTransactionHistoryButton}
                  />
                ) : (
                  <AnySpendNFT
                    mode={config.mode}
                    recipientAddress={config.recipientAddress}
                    nftContract={config.nftContract || sampleNFTContract}
                  />
                )}
              </div>
            </div>

            {/* Code Example */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Code Example</h2>

              <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
                <pre className="text-sm text-gray-300">
                  <code>{generateCodeExample()}</code>
                </pre>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Setup:</strong> Import the component and wrap your app with providers:
                </p>
                <div className="mt-2 overflow-x-auto rounded bg-blue-900 p-2">
                  <pre className="text-xs text-blue-100">
                    {`import { ${config.componentType === "anyspend" ? "AnySpend" : "AnySpendNFT"} } from "@b3dotfun/sdk/anyspend/react";
import { B3Provider, B3DynamicModal } from "@b3dotfun/sdk/global-account/react";
import { AnyspendProvider } from "@b3dotfun/sdk/anyspend/react";
import "@b3dotfun/sdk/index.css";

// Wrap your app with providers
<B3Provider environment="production" theme="${config.theme}">
  <AnyspendProvider>
    <B3DynamicModal />
    {/* Your app content */}
  </AnyspendProvider>
</B3Provider>`}
                  </pre>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  <strong>Custom Theming:</strong> Override CSS variables to customize colors:
                </p>
                <div className="mt-2 overflow-x-auto rounded bg-green-900 p-2">
                  <pre className="text-xs text-green-100">
                    {`.b3-root {
  --as-brand: ${config.colors.asBrand};
  --as-surface-primary: ${config.colors.asSurfacePrimary};
  --as-primary: ${config.colors.asPrimary};
  --b3-react-background: ${config.colors.b3ReactBackground};
  --b3-react-foreground: ${config.colors.b3ReactForeground};
  /* ... other variables ... */
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
