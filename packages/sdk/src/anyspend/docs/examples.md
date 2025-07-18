# Examples & Use Cases

Real-world implementation examples for common AnySpend integration patterns.

## Table of Contents

- [🔄 Cross-Chain Token Swaps](#-cross-chain-token-swaps)
  - [Basic Swap Interface](#basic-swap-interface)
  - [Advanced Swap with Quote Preview](#advanced-swap-with-quote-preview)
- [🖼️ NFT Marketplace Integration](#️-nft-marketplace-integration)
  - [Simple NFT Purchase](#simple-nft-purchase)
  - [NFT Marketplace with Bulk Purchase](#nft-marketplace-with-bulk-purchase)
- [🎮 Gaming & DeFi Applications](#-gaming--defi-applications)
  - [Staking Interface](#staking-interface)
  - [Gaming Spin Wheel](#gaming-spin-wheel)
  - [Tournament Entry](#tournament-entry)
- [💰 Fiat-to-Crypto Onramp](#-fiat-to-crypto-onramp)
  - [Simple Onboarding Flow](#simple-onboarding-flow)
  - [Multi-Step Onboarding](#multi-step-onboarding)
- [🛒 E-commerce Integration](#-e-commerce-integration)
  - [Crypto Checkout](#crypto-checkout)
- [🎯 Advanced Patterns](#-advanced-patterns)
  - [Multi-Chain Portfolio Rebalancing](#multi-chain-portfolio-rebalancing)

## 🔄 Cross-Chain Token Swaps

### Basic Swap Interface

Perfect for DeFi applications, portfolio managers, or any app that needs token exchange functionality.

```tsx
import { AnySpend } from "@b3dotfun/sdk/anyspend/react";

function TokenSwapPage() {
  const [userAddress] = useWallet(); // Your wallet hook

  return (
    <div className="swap-container">
      <h1>Swap Tokens</h1>
      <AnySpend
        mode="page"
        recipientAddress={userAddress}
        onSuccess={(txHash) => {
          // Update user's portfolio
          toast.success("Swap completed successfully!");
          
          // Optional: Track analytics
          analytics.track("swap_completed", {
            txHash,
            userAddress,
          });
          
          // Refresh user balances
          queryClient.invalidateQueries(['user-balances', userAddress]);
        }}
      />
    </div>
  );
}
```

### Advanced Swap with Quote Preview

```tsx
import { useAnyspendQuote, AnySpend } from "@b3dotfun/sdk/anyspend/react";

function AdvancedSwapInterface() {
  const [fromToken, setFromToken] = useState(USDC_ETHEREUM);
  const [toToken, setToToken] = useState(ETH_B3);
  const [amount, setAmount] = useState("100");
  const [isSwapOpen, setIsSwapOpen] = useState(false);

  const quoteRequest = useMemo(() => ({
    srcChain: fromToken.chainId,
    dstChain: toToken.chainId,
    srcTokenAddress: fromToken.address,
    dstTokenAddress: toToken.address,
    type: "swap" as const,
    tradeType: "EXACT_INPUT" as const,
    amount: parseUnits(amount || "0", fromToken.decimals).toString(),
  }), [fromToken, toToken, amount]);

  const { anyspendQuote, isLoadingAnyspendQuote } = useAnyspendQuote(true, quoteRequest);

  return (
    <div className="advanced-swap">
      <div className="swap-form">
        <TokenInput
          label="From"
          token={fromToken}
          amount={amount}
          onTokenChange={setFromToken}
          onAmountChange={setAmount}
        />
        
        <SwapArrowButton onClick={() => {
          setFromToken(toToken);
          setToToken(fromToken);
        }} />
        
        <TokenInput
          label="To"
          token={toToken}
          amount={anyspendQuote?.expectedOutput || "0"}
          onTokenChange={setToToken}
          readOnly
        />
        
        {anyspendQuote && (
          <div className="quote-details">
            <div>Rate: 1 {fromToken.symbol} = {anyspendQuote.rate} {toToken.symbol}</div>
            <div>Network Fee: ${anyspendQuote.networkFeeUsd}</div>
            <div>Service Fee: ${anyspendQuote.serviceFeeUsd}</div>
            <div>Total: ${anyspendQuote.totalUsdCost}</div>
          </div>
        )}
        
        <button
          onClick={() => setIsSwapOpen(true)}
          disabled={isLoadingAnyspendQuote || !anyspendQuote}
          className="swap-button"
        >
          {isLoadingAnyspendQuote ? "Getting Quote..." : "Swap Tokens"}
        </button>
      </div>

      {isSwapOpen && (
        <AnySpend
          mode="modal"
          recipientAddress={userAddress}
          destinationTokenAddress={toToken.address}
          destinationTokenChainId={toToken.chainId}
          onSuccess={() => {
            setIsSwapOpen(false);
            toast.success("Swap completed!");
          }}
        />
      )}
    </div>
  );
}
```

## 🖼️ NFT Marketplace Integration

### Simple NFT Purchase

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

function NFTCard({ nft }: { nft: NFTListing }) {
  const [userAddress] = useWallet();
  const [isOwned, setIsOwned] = useState(false);

  const nftContract = {
    chainId: nft.chainId,
    contractAddress: nft.contractAddress,
    price: nft.priceWei,
    priceFormatted: nft.priceFormatted,
    currency: nft.currency,
    name: nft.name,
    description: nft.description,
    imageUrl: nft.imageUrl,
  };

  return (
    <div className="nft-card">
      <img src={nft.imageUrl} alt={nft.name} />
      <div className="nft-details">
        <h3>{nft.name}</h3>
        <p>{nft.description}</p>
        <div className="price">
          {nft.priceFormatted} {nft.currency.symbol}
        </div>
        
        {isOwned ? (
          <div className="owned-badge">✅ Owned</div>
        ) : (
          <AnySpendNFTButton
            nftContract={nftContract}
            recipientAddress={userAddress}
            onSuccess={(txHash) => {
              setIsOwned(true);
              
              // Update user's NFT collection
              queryClient.invalidateQueries(['user-nfts', userAddress]);
              
              // Show success message with explorer link
              toast.success(
                <div>
                  NFT purchased successfully!
                  <a href={`https://explorer.b3.fun/tx/${txHash}`} target="_blank">
                    View Transaction
                  </a>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
```

### NFT Marketplace with Bulk Purchase

```tsx
function NFTMarketplace() {
  const [selectedNFTs, setSelectedNFTs] = useState<NFTListing[]>([]);
  const [userAddress] = useWallet();

  const handleBulkPurchase = () => {
    // For bulk purchases, create multiple orders or use batch contract
    selectedNFTs.forEach((nft, index) => {
      setTimeout(() => {
        // Stagger purchases to avoid rate limiting
        createSingleNFTPurchase(nft);
      }, index * 1000);
    });
  };

  return (
    <div className="marketplace">
      <div className="nft-grid">
        {nfts.map((nft) => (
          <NFTCard 
            key={nft.id} 
            nft={nft}
            onSelect={(selected) => {
              if (selected) {
                setSelectedNFTs([...selectedNFTs, nft]);
              } else {
                setSelectedNFTs(selectedNFTs.filter(n => n.id !== nft.id));
              }
            }}
          />
        ))}
      </div>
      
      {selectedNFTs.length > 0 && (
        <div className="bulk-purchase">
          <p>Selected: {selectedNFTs.length} NFTs</p>
          <p>Total: {calculateTotal(selectedNFTs)} ETH</p>
          <button onClick={handleBulkPurchase}>
            Purchase Selected NFTs
          </button>
        </div>
      )}
    </div>
  );
}
```

## 🎮 Gaming & DeFi Applications

### Staking Interface

```tsx
import { AnySpendCustom } from "@b3dotfun/sdk/anyspend/react";
import { encodeFunctionData } from "viem";

function StakingPool({ pool }: { pool: StakingPool }) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakingDuration, setStakingDuration] = useState(30);
  const [userAddress] = useWallet();

  const stakingCalldata = useMemo(() => {
    if (!stakeAmount) return "0x";
    
    const amountWei = parseUnits(stakeAmount, pool.token.decimals);
    
    return encodeFunctionData({
      abi: stakingPoolABI,
      functionName: "stake",
      args: [amountWei, stakingDuration * 24 * 60 * 60], // duration in seconds
    });
  }, [stakeAmount, stakingDuration]);

  const expectedRewards = useMemo(() => {
    if (!stakeAmount) return "0";
    const amount = parseFloat(stakeAmount);
    const apy = pool.apy / 100;
    const durationInYears = stakingDuration / 365;
    return (amount * apy * durationInYears).toFixed(4);
  }, [stakeAmount, stakingDuration, pool.apy]);

  return (
    <div className="staking-pool">
      <div className="pool-info">
        <h2>{pool.name}</h2>
        <p>APY: {pool.apy}%</p>
        <p>TVL: ${pool.totalValueLocked.toLocaleString()}</p>
      </div>

      <div className="stake-form">
        <div className="input-group">
          <label>Amount to stake</label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="0.0"
          />
          <span>{pool.token.symbol}</span>
        </div>

        <div className="input-group">
          <label>Staking Duration</label>
          <select
            value={stakingDuration}
            onChange={(e) => setStakingDuration(Number(e.target.value))}
          >
            <option value={7}>7 days (2% APY)</option>
            <option value={30}>30 days (5% APY)</option>
            <option value={90}>90 days (8% APY)</option>
            <option value={365}>1 year (12% APY)</option>
          </select>
        </div>

        <div className="rewards-preview">
          <p>Expected rewards: {expectedRewards} {pool.token.symbol}</p>
        </div>

        <AnySpendCustom
          orderType="custom"
          dstChainId={pool.chainId}
          dstToken={pool.token}
          dstAmount={parseUnits(stakeAmount || "0", pool.token.decimals).toString()}
          contractAddress={pool.contractAddress}
          encodedData={stakingCalldata}
          metadata={{
            action: "stake",
            poolId: pool.id,
            duration: stakingDuration,
            expectedRewards,
          }}
          header={({ anyspendPrice, isLoadingAnyspendPrice }) => (
            <div className="staking-header">
              <h3>Stake {pool.token.symbol}</h3>
              <div className="stake-summary">
                <div>Amount: {stakeAmount} {pool.token.symbol}</div>
                <div>Duration: {stakingDuration} days</div>
                <div>Expected rewards: {expectedRewards} {pool.token.symbol}</div>
                {anyspendPrice && (
                  <div>Total cost: ${anyspendPrice.totalUsdCost}</div>
                )}
              </div>
            </div>
          )}
          onSuccess={(txHash) => {
            toast.success("Staking successful!");
            
            // Update user's staking positions
            queryClient.invalidateQueries(['staking-positions', userAddress]);
            
            // Reset form
            setStakeAmount("");
          }}
        />
      </div>
    </div>
  );
}
```

### Gaming Spin Wheel

```tsx
import { AnySpendBuySpin } from "@b3dotfun/sdk/anyspend/react";

function SpinWheel({ game }: { game: GameConfig }) {
  const [userAddress] = useWallet();
  const [spinHistory, setSpinHistory] = useState<SpinResult[]>([]);

  return (
    <div className="spin-game">
      <div className="wheel-container">
        <SpinWheelVisual prizes={game.prizes} />
      </div>

      <div className="game-info">
        <h2>{game.name}</h2>
        <p>Cost per spin: {game.spinCost} {game.currency.symbol}</p>
        <div className="prizes">
          <h3>Possible Prizes:</h3>
          {game.prizes.map((prize, index) => (
            <div key={index} className="prize">
              <span>{prize.name}</span>
              <span>{prize.probability}% chance</span>
            </div>
          ))}
        </div>
      </div>

      <AnySpendBuySpin
        gameContract={game.contractAddress}
        spinPrice={game.spinCostWei}
        recipientAddress={userAddress}
        onSuccess={(txHash) => {
          // Listen for spin result event
          listenForSpinResult(txHash).then((result) => {
            setSpinHistory([result, ...spinHistory]);
            
            if (result.isWinner) {
              toast.success(`You won ${result.prize.name}!`);
            } else {
              toast.info("Better luck next time!");
            }
          });
        }}
      />

      {spinHistory.length > 0 && (
        <div className="spin-history">
          <h3>Recent Spins</h3>
          {spinHistory.map((spin, index) => (
            <div key={index} className={`spin-result ${spin.isWinner ? 'winner' : 'loser'}`}>
              <span>{spin.prize.name}</span>
              <span>{new Date(spin.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Tournament Entry

```tsx
import { AnySpendTournament } from "@b3dotfun/sdk/anyspend/react";

function TournamentCard({ tournament }: { tournament: Tournament }) {
  const [userAddress] = useWallet();
  const [isRegistered, setIsRegistered] = useState(false);
  
  const timeUntilStart = tournament.startTime - Date.now();
  const isStartingSoon = timeUntilStart < 60 * 60 * 1000; // 1 hour

  return (
    <div className="tournament-card">
      <div className="tournament-header">
        <h3>{tournament.name}</h3>
        <div className="tournament-status">
          {tournament.status === "upcoming" && (
            <span className="status upcoming">
              Starts in {formatTimeUntil(tournament.startTime)}
            </span>
          )}
          {tournament.status === "live" && (
            <span className="status live">🔴 Live</span>
          )}
        </div>
      </div>

      <div className="tournament-details">
        <div className="prize-pool">
          <h4>Prize Pool</h4>
          <p>{tournament.prizePool} {tournament.currency.symbol}</p>
        </div>
        
        <div className="participants">
          <h4>Participants</h4>
          <p>{tournament.currentParticipants} / {tournament.maxParticipants}</p>
        </div>
        
        <div className="entry-fee">
          <h4>Entry Fee</h4>
          <p>{tournament.entryFee} {tournament.currency.symbol}</p>
        </div>
      </div>

      {isRegistered ? (
        <div className="registered">
          ✅ Registered for tournament
        </div>
      ) : tournament.status === "upcoming" && !isStartingSoon ? (
        <AnySpendTournament
          tournamentId={tournament.id}
          entryFee={tournament.entryFeeWei}
          recipientAddress={userAddress}
          onSuccess={() => {
            setIsRegistered(true);
            toast.success("Successfully registered for tournament!");
            
            // Update tournament data
            queryClient.invalidateQueries(['tournament', tournament.id]);
          }}
        />
      ) : (
        <div className="cannot-register">
          {isStartingSoon ? "Registration closed" : "Tournament started"}
        </div>
      )}
    </div>
  );
}
```

## 💰 Fiat-to-Crypto Onramp

### Simple Onboarding Flow

```tsx
function FiatOnramp({ targetToken }: { targetToken: Token }) {
  const [userAddress] = useWallet();

  return (
    <div className="onramp-flow">
      <div className="onramp-header">
        <h2>Buy {targetToken.symbol}</h2>
        <p>Purchase crypto with your credit card or bank account</p>
      </div>

      <AnySpend
        defaultActiveTab="fiat"
        destinationTokenAddress={targetToken.address}
        destinationTokenChainId={targetToken.chainId}
        recipientAddress={userAddress}
        mode="page"
        onSuccess={(txHash) => {
          // Welcome new user
          toast.success("Welcome to crypto! Your purchase was successful.");
          
          // Track onboarding completion
          analytics.track("onramp_completed", {
            userAddress,
            token: targetToken.symbol,
            txHash,
          });
          
          // Redirect to main app
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
```

### Multi-Step Onboarding

```tsx
function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [userAddress, setUserAddress] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token>(USDC_BASE);

  return (
    <div className="onboarding-wizard">
      <div className="progress-bar">
        <div className={`step ${step >= 1 ? 'completed' : ''}`}>1. Connect Wallet</div>
        <div className={`step ${step >= 2 ? 'completed' : ''}`}>2. Choose Token</div>
        <div className={`step ${step >= 3 ? 'completed' : ''}`}>3. Purchase</div>
      </div>

      {step === 1 && (
        <WalletConnectionStep 
          onConnect={(address) => {
            setUserAddress(address);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <TokenSelectionStep
          selectedToken={selectedToken}
          onTokenSelect={(token) => {
            setSelectedToken(token);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <div className="purchase-step">
          <h2>Purchase {selectedToken.symbol}</h2>
          <AnySpend
            defaultActiveTab="fiat"
            destinationTokenAddress={selectedToken.address}
            destinationTokenChainId={selectedToken.chainId}
            recipientAddress={userAddress}
            mode="page"
            onSuccess={() => {
              // Complete onboarding
              completeOnboarding(userAddress, selectedToken);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## 🛒 E-commerce Integration

### Crypto Checkout

```tsx
function CryptoCheckout({ order }: { order: Order }) {
  const [userAddress] = useWallet();
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "fiat">("crypto");

  const orderTotal = order.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="checkout">
      <div className="order-summary">
        <h2>Order Summary</h2>
        {order.items.map((item) => (
          <div key={item.id} className="order-item">
            <span>{item.name}</span>
            <span>${item.price}</span>
          </div>
        ))}
        <div className="total">
          <strong>Total: ${orderTotal}</strong>
        </div>
      </div>

      <div className="payment-section">
        <div className="payment-method-selector">
          <button
            className={paymentMethod === "crypto" ? "active" : ""}
            onClick={() => setPaymentMethod("crypto")}
          >
            Pay with Crypto
          </button>
          <button
            className={paymentMethod === "fiat" ? "active" : ""}
            onClick={() => setPaymentMethod("fiat")}
          >
            Pay with Card
          </button>
        </div>

        <AnySpend
          defaultActiveTab={paymentMethod}
          destinationTokenAddress={USDC_BASE.address}
          destinationTokenChainId={USDC_BASE.chainId}
          recipientAddress={MERCHANT_WALLET_ADDRESS}
          mode="page"
          onSuccess={(txHash) => {
            // Process order fulfillment
            processOrder(order.id, txHash);
            
            // Send confirmation email
            sendOrderConfirmation(order, txHash);
            
            // Redirect to success page
            router.push(`/order-confirmation/${order.id}`);
          }}
        />
      </div>
    </div>
  );
}
```

## 🎯 Advanced Patterns

### Multi-Chain Portfolio Rebalancing

```tsx
function PortfolioRebalancer() {
  const [userAddress] = useWallet();
  const [targetAllocation, setTargetAllocation] = useState({
    ETH: 50,
    BTC: 30,
    USDC: 20,
  });

  const { data: currentBalances } = useUserBalances(userAddress);
  const rebalanceOrders = calculateRebalanceOrders(currentBalances, targetAllocation);

  return (
    <div className="portfolio-rebalancer">
      <h2>Portfolio Rebalancing</h2>
      
      <div className="current-allocation">
        <h3>Current Allocation</h3>
        <AllocationChart balances={currentBalances} />
      </div>

      <div className="target-allocation">
        <h3>Target Allocation</h3>
        <AllocationInputs
          allocation={targetAllocation}
          onChange={setTargetAllocation}
        />
      </div>

      <div className="rebalance-orders">
        <h3>Required Transactions</h3>
        {rebalanceOrders.map((order, index) => (
          <div key={index} className="rebalance-order">
            <p>
              Swap {order.sellAmount} {order.sellToken.symbol} → {order.buyToken.symbol}
            </p>
            <AnySpendCustom
              orderType="swap"
              dstChainId={order.buyToken.chainId}
              dstToken={order.buyToken}
              dstAmount={order.buyAmountWei}
              contractAddress="0x" // Use standard swap
              encodedData="0x"
              onSuccess={() => {
                toast.success(`Rebalanced ${order.sellToken.symbol} → ${order.buyToken.symbol}`);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Next Steps

- [Error Handling Guide →](./error-handling.md)
- [Components Reference →](./components.md)
- [Hooks Reference →](./hooks.md) 