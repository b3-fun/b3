# Components API Reference

AnySpend provides a collection of React components designed to integrate seamlessly into your application for various crypto payment and interaction scenarios.

## Core Components

### `<AnySpend>`

The primary interface component for token-to-token exchanges and fiat onramps.

```tsx
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";

<AnySpend
  isMainnet={true}
  mode="modal"
  defaultActiveTab="crypto"
  destinationTokenAddress="0x..."
  destinationTokenChainId={8333}
  recipientAddress="0x..."
  hideTransactionHistoryButton={false}
  onSuccess={(txHash) => console.log("Swap completed", txHash)}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isMainnet` | `boolean` | `true` | Use mainnet or testnet environment |
| `mode` | `"modal" \| "page"` | `"modal"` | Display as modal overlay or full page |
| `defaultActiveTab` | `"crypto" \| "fiat"` | `"crypto"` | Initial payment method tab |
| `destinationTokenAddress` | `string` | - | Target token address for buy mode |
| `destinationTokenChainId` | `number` | - | Chain ID of destination token |
| `recipientAddress` | `string` | - | Recipient wallet address |
| `hideTransactionHistoryButton` | `boolean` | `false` | Hide transaction history access |
| `loadOrder` | `string` | - | Load specific order by ID |
| `onSuccess` | `(txHash?: string) => void` | - | Success callback with transaction hash |

#### Usage Examples

**Basic Token Swap:**
```tsx
<AnySpend
  mode="page"
  recipientAddress={userWalletAddress}
  onSuccess={(txHash) => {
    toast.success(`Swap completed! TX: ${txHash}`);
  }}
/>
```

**Fiat-to-Crypto Onramp:**
```tsx
<AnySpend
  defaultActiveTab="fiat"
  destinationTokenAddress="0xA0b86a33E6Fb6Dd9a9B3d8B5FEb2b3C8e7D9Ff1E"
  destinationTokenChainId={8333}
  recipientAddress={userWalletAddress}
/>
```

---

### `<AnySpendNFTButton>`

A streamlined button component for NFT purchases with built-in payment handling.

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

<AnySpendNFTButton
  nftContract={nftContractDetails}
  recipientAddress="0x..."
  isMainnet={true}
  onSuccess={(txHash) => console.log("NFT minted:", txHash)}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `nftContract` | `NFTContract` | ✅ | NFT contract configuration |
| `recipientAddress` | `string` | ✅ | Wallet to receive the NFT |
| `isMainnet` | `boolean` | - | Environment selection |
| `onSuccess` | `(txHash?: string) => void` | - | Success callback |

#### NFTContract Interface

```typescript
interface NFTContract {
  chainId: number;                    // Blockchain network ID
  contractAddress: string;            // NFT contract address
  price: string;                      // Price in wei
  priceFormatted: string;             // Human-readable price
  currency: {
    chainId: number;
    address: string;                  // Token contract (0x0 for native ETH)
    name: string;
    symbol: string;
    decimals: number;
  };
  name: string;                       // NFT collection name
  description: string;                // NFT description
  imageUrl: string;                   // Preview image URL
}
```

#### Usage Example

```tsx
const coolNFT = {
  chainId: 8333,
  contractAddress: "0x9c275ff1634519E9B5449ec79cd939B5F900564d",
  price: "500000000000000000", // 0.5 ETH
  priceFormatted: "0.5",
  currency: {
    chainId: 8333,
    address: "0x0000000000000000000000000000000000000000",
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  name: "Cool Art Collection",
  description: "Unique digital artwork",
  imageUrl: "https://example.com/nft-preview.png",
};

<AnySpendNFTButton
  nftContract={coolNFT}
  recipientAddress={userAddress}
  onSuccess={(txHash) => {
    // Update UI to show NFT ownership
    refreshUserNFTs();
  }}
/>
```

---

### `<AnySpendCustom>`

The most flexible component for custom smart contract interactions, including gaming, staking, and DeFi operations.

```tsx
import { AnySpendCustom } from "@b3dotfun/sdk/anyspend/react";

<AnySpendCustom
  orderType="custom"
  dstChainId={8333}
  dstToken={tokenDetails}
  dstAmount="1000000000000000000"
  contractAddress="0x..."
  encodedData="0x..."
  spenderAddress="0x..."
  metadata={customMetadata}
  header={CustomHeaderComponent}
  onSuccess={(txHash) => console.log("Custom action completed", txHash)}
/>
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `orderType` | `"custom"` | ✅ | Order type identifier |
| `dstChainId` | `number` | ✅ | Target blockchain network |
| `dstToken` | `Token` | ✅ | Token being used for payment |
| `dstAmount` | `string` | ✅ | Amount in wei/smallest unit |
| `contractAddress` | `string` | ✅ | Target smart contract |
| `encodedData` | `string` | ✅ | Encoded function call data |
| `spenderAddress` | `string` | - | Optional token spender |
| `metadata` | `object` | - | Custom metadata for tracking |
| `header` | `React.ComponentType` | - | Custom header component |
| `onSuccess` | `(txHash?: string) => void` | - | Success callback |

#### Usage Example - Staking

```tsx
// Encode staking function call
const stakeAmount = "1000000000000000000"; // 1 token
const stakingCalldata = encodeFunctionData({
  abi: stakingABI,
  functionName: "stake",
  args: [stakeAmount, 30] // 30 days
});

<AnySpendCustom
  orderType="custom"
  dstChainId={8333}
  dstToken={stakingToken}
  dstAmount={stakeAmount}
  contractAddress="0xStakingContract..."
  encodedData={stakingCalldata}
  metadata={{
    action: "stake",
    duration: 30,
    expectedRewards: "5.2%"
  }}
  header={({ anyspendPrice, isLoadingAnyspendPrice }) => (
    <div className="staking-header">
      <h2>Stake Tokens</h2>
      <p>Duration: 30 days</p>
      <p>Expected APY: 5.2%</p>
      {!isLoadingAnyspendPrice && (
        <p>Total Cost: ${anyspendPrice?.usdPrice}</p>
      )}
    </div>
  )}
/>
```

## Specialized Components

### `<AnySpendNFT>`

Enhanced NFT component with additional marketplace features.

```tsx
<AnySpendNFT
  nftContract={nftDetails}
  recipientAddress="0x..."
  showMetadata={true}
  showPriceHistory={true}
/>
```

### `<AnySpendStakeB3>`

Pre-configured component for B3 token staking.

```tsx
<AnySpendStakeB3
  stakeAmount="1000000000000000000"
  stakingDuration={30}
  recipientAddress="0x..."
/>
```

### `<AnySpendBuySpin>`

Gaming-specific component for purchasing spin wheels or lottery tickets.

```tsx
<AnySpendBuySpin
  gameContract="0x..."
  spinPrice="100000000000000000"
  recipientAddress="0x..."
/>
```

### `<AnySpendTournament>`

Tournament entry payment component.

```tsx
<AnySpendTournament
  tournamentId="tournament-123"
  entryFee="500000000000000000"
  recipientAddress="0x..."
/>
```

## Component Styling

All components come with default styling that can be customized:

```css
/* Override default styles */
.anyspend-modal {
  --anyspend-primary: #6366f1;
  --anyspend-secondary: #f3f4f6;
  --anyspend-border-radius: 12px;
}
```

## Platform Support

| Component | React Web | React Native |
|-----------|-----------|--------------|
| `AnySpend` | ✅ | ✅ |
| `AnySpendNFTButton` | ✅ | ✅ |
| `AnySpendCustom` | ✅ | ✅ |
| `AnySpendNFT` | ✅ | ✅ |
| Fiat onramp features | ✅ | ❌ |

## Next Steps

- [Learn about Hooks →](./hooks.md)
- [See Examples →](./examples.md)
- [Error Handling →](./error-handling.md) 