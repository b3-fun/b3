# 🎨 Widget Examples & Use Cases

Beyond basic sign-in and content gating, here are real-world examples you can build with B3 Widgets.

---

## 1. 🖼️ NFT Gate

**Use Case**: Exclusive content for NFT holders (memberships, communities, premium articles)

```html
<!-- Content to gate -->
<div id="premium-content" class="nft-gated">
  <h2>Exclusive Content for Token Holders</h2>
  <p>This content is only visible to holders of CoolNFT Collection.</p>
</div>

<!-- Widget -->
<div data-b3-widget="sign-in"></div>

<script>
  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: async wallet => {
      // Check if user owns the NFT
      const hasNFT = await checkNFTOwnership(wallet.address, "0xNFTContractAddress");

      if (hasNFT) {
        document.getElementById("premium-content").classList.remove("blurred");
      } else {
        alert("You need to own a CoolNFT to access this content");
      }
    },
  });
</script>

<style>
  .nft-gated {
    filter: blur(8px);
    transition: filter 0.5s;
  }
  .nft-gated.unlocked {
    filter: none;
  }
</style>
```

**Real-World Examples**:

- Bored Ape member-only articles
- Token-gated Discord communities
- NFT holder exclusive video content

---

## 2. 💰 Token Gate

**Use Case**: Require specific token balance to access content

```html
<div id="token-gated-video" class="token-gate">
  <video width="640" height="360" controls>
    <source src="premium-content.mp4" type="video/mp4" />
  </video>
</div>

<div data-b3-widget="sign-in"></div>

<script>
  const REQUIRED_TOKENS = 100; // Require 100 tokens

  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: async wallet => {
      const balance = await getTokenBalance(wallet.address, "TOKEN_ADDRESS");

      if (balance >= REQUIRED_TOKENS) {
        document.getElementById("token-gated-video").style.pointerEvents = "auto";
        document.getElementById("token-gated-video").style.filter = "none";
      } else {
        alert(`You need ${REQUIRED_TOKENS} tokens. You have ${balance}.`);
      }
    },
  });
</script>

<style>
  .token-gate {
    filter: grayscale(100%) blur(4px);
    pointer-events: none;
    transition: all 0.5s;
  }
</style>
```

**Real-World Examples**:

- Premium tool access for token holders
- Course materials for stakers
- Early access content for top holders

---

## 3. 💸 Creator Tipping Widget

**Use Case**: One-click tips for creators (writers, artists, streamers)

```html
<article>
  <h1>Great Article Title</h1>
  <p>Amazing content...</p>
</article>

<!-- Tip button -->
<div class="tip-section">
  <div data-b3-widget="sign-in"></div>
  <button id="tip-button" disabled>💰 Tip Creator</button>
</div>

<script>
  let userWallet = null;

  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: wallet => {
      userWallet = wallet;
      document.getElementById("tip-button").disabled = false;
    },
  });

  document.getElementById("tip-button").addEventListener("click", async () => {
    if (!userWallet) return alert("Please sign in first");

    // Use AnySpend for easy payments
    const result = await window.B3SDK.anyspend.sendPayment({
      amount: 5, // $5 tip
      recipient: "creator-wallet-address",
      currency: "USDC",
    });

    if (result.success) {
      alert("Thank you! Creator has been tipped $5");
    }
  });
</script>
```

**Real-World Examples**:

- Blog tipping buttons
- Livestream super chats
- Social media creator support

---

## 4. 🎮 Tournament Entry Widget

**Use Case**: Quick tournament registration and entry fee payment

```html
<div class="tournament-card">
  <h2>Weekly Fortnite Tournament</h2>
  <p>Entry Fee: $10 USDC</p>
  <p>Prize Pool: $500</p>

  <div data-b3-widget="sign-in"></div>
  <button id="enter-tournament" disabled>Enter Tournament</button>
</div>

<script>
  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: async wallet => {
      document.getElementById("enter-tournament").disabled = false;
    },
  });

  document.getElementById("enter-tournament").addEventListener("click", async () => {
    const result = await window.B3SDK.tournaments.enter({
      tournamentId: "weekly-fortnite-123",
      entryFee: 10,
      currency: "USDC",
    });

    if (result.success) {
      window.location.href = "/tournament/lobby";
    }
  });
</script>
```

**Real-World Examples**:

- Gaming tournament signups
- Fantasy sports entry
- Betting pool participation

---

## 5. 🛒 Inline Collectible Purchase

**Use Case**: Buy NFT collectibles directly from content

```html
<div class="collectible-showcase">
  <img src="limited-edition-art.jpg" alt="Limited Edition Art" />
  <h3>Exclusive Digital Art - 0.1 ETH</h3>
  <p>Only 100 available</p>

  <div data-b3-widget="sign-in"></div>
  <button id="buy-collectible" disabled>Purchase Now</button>
</div>

<script>
  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: wallet => {
      document.getElementById("buy-collectible").disabled = false;
    },
  });

  document.getElementById("buy-collectible").addEventListener("click", async () => {
    const result = await window.B3SDK.nft.mint({
      contractAddress: "0xCollectibleContract",
      price: "0.1",
      currency: "ETH",
    });

    if (result.success) {
      alert("Collectible purchased! Check your wallet.");
    }
  });
</script>
```

**Real-World Examples**:

- Blog post collectibles
- Limited edition merchandise
- Event tickets as NFTs

---

## 6. 👤 Inline Profile Card

**Use Case**: Display user's B3 profile info inline on page

```html
<div id="user-profile" style="display: none;">
  <img id="profile-avatar" src="" alt="Avatar" />
  <h3 id="profile-name"></h3>
  <p id="profile-bio"></p>
  <p>Level: <span id="profile-level"></span></p>
</div>

<div data-b3-widget="sign-in"></div>

<script>
  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: async wallet => {
      // Fetch B3 profile
      const profile = await window.B3SDK.profile.get(wallet.address);

      // Display profile
      document.getElementById("user-profile").style.display = "block";
      document.getElementById("profile-avatar").src = profile.avatar;
      document.getElementById("profile-name").textContent = profile.name;
      document.getElementById("profile-bio").textContent = profile.bio;
      document.getElementById("profile-level").textContent = profile.level;
    },
  });
</script>
```

**Real-World Examples**:

- Gaming profile displays
- Community member cards
- Leaderboard entries

---

## 7. 🎫 Subscription Widget

**Use Case**: Monthly/annual subscription payments

```html
<div class="subscription-plan">
  <h2>Premium Membership</h2>
  <p>$9.99/month - Cancel anytime</p>
  <ul>
    <li>✅ All premium articles</li>
    <li>✅ Early access to content</li>
    <li>✅ Members-only Discord</li>
  </ul>

  <div data-b3-widget="sign-in"></div>
  <button id="subscribe-button" disabled>Subscribe Now</button>
</div>

<script>
  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: wallet => {
      document.getElementById("subscribe-button").disabled = false;
    },
  });

  document.getElementById("subscribe-button").addEventListener("click", async () => {
    const result = await window.B3SDK.subscriptions.create({
      plan: "premium-monthly",
      price: 9.99,
      interval: "month",
      currency: "USDC",
    });

    if (result.success) {
      alert("Subscription activated! Welcome to Premium.");
      window.location.reload();
    }
  });
</script>
```

**Real-World Examples**:

- Newsletter subscriptions
- Premium content memberships
- Course access subscriptions

---

## 8. 🏆 Live Leaderboard Widget

**Use Case**: Show rankings and scores inline

```html
<div class="leaderboard-widget">
  <h3>Top Players This Week</h3>
  <div data-b3-widget="sign-in"></div>
  <ol id="leaderboard-list"></ol>
  <button id="refresh-leaderboard">🔄 Refresh</button>
</div>

<script>
  async function loadLeaderboard() {
    const rankings = await window.B3SDK.leaderboard.get({
      gameId: "my-game",
      period: "week",
      limit: 10,
    });

    const list = document.getElementById("leaderboard-list");
    list.innerHTML = rankings
      .map(
        player => `
      <li>
        <img src="${player.avatar}" width="32" />
        ${player.name} - ${player.score} pts
      </li>
    `,
      )
      .join("");
  }

  window.B3Widget.init({
    partnerId: "your-partner-id",
    onWalletConnected: () => {
      loadLeaderboard();
    },
  });

  document.getElementById("refresh-leaderboard").addEventListener("click", loadLeaderboard);
</script>
```

**Real-World Examples**:

- Gaming leaderboards
- Prediction market rankings
- Community contribution scores

---

## 🎯 Implementation Tips

1. **Start Simple** - Begin with sign-in, add features incrementally
2. **Error Handling** - Always handle wallet connection failures
3. **Loading States** - Show spinners during blockchain operations
4. **Mobile First** - Test on mobile devices (B3 modals are responsive)
5. **Analytics** - Track widget events for conversion optimization
6. **A/B Testing** - Test different placements and CTAs

---

## 📚 Additional Resources

- **Full API Docs**: https://docs.b3.fun
- **Live Demo**: http://localhost:3000 (when running `pnpm dev:widget`)
- **Support**: Open an issue in the B3 SDK repo

---

**Have a unique use case?** Share it with the B3 team!
