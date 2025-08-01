# B3 Monorepo 🚀

A comprehensive monorepo containing B3's blockchain infrastructure, applications, and SDK. Built with pnpm workspaces for optimal development experience across Web3 authentication, cross-chain operations, and gaming applications.

## 📦 Repository Structure

### Applications (`/apps`)

- **global-accounts**

  - Documentation and demo site for B3 Global Accounts
  - Interactive examples of B3's authentication features
  - Showcases SignIn, permission management, and NFT minting
  - Features: Hero sections, code examples, request permissions demo
  - **Tech Stack**: React + TypeScript + Vite + Tailwind CSS

- **global-accounts-demos**

  - Interactive gaming applications with blockchain integration
  - **Two Game Modes**:
    - **Memory Game** (default): NFT-based memory matching game
    - **NFT Battle**: Weapon battle game using user's NFT collection
  - Switch modes via `VITE_APP_TYPE` environment variable
  - Features: NFT claiming, wallet integration, game mechanics
  - **Tech Stack**: React + TypeScript + Vite + Styled Components

- **login-minimal-example**
  - Minimal implementation example for B3 Global Accounts
  - Simple authentication flow with wallet connection
  - Permission management and NFT minting examples
  - Perfect starter template for developers
  - **Tech Stack**: React + TypeScript + Vite + Tailwind CSS

### Packages (`/packages`)

- **sdk** (`@b3dotfun/sdk`)
  - Comprehensive TypeScript SDK for B3 ecosystem
  - **Core Modules**:
    - **AnySpend**: Cross-chain swaps, NFT minting, token operations
    - **Global Account**: Authentication, user management, session keys
    - **Shared**: Common utilities, chain configurations, Thirdweb integration
  - **Platform Support**: React Web ✅, React Native ✅
  - **Build Targets**: ESM, CJS, TypeScript declarations
  - **Features**: Full TypeScript support, React hooks, headless services

## 🛠️ Technology Stack

- **Package Management**: pnpm with workspaces
- **Build Tool**: Vite (apps) + TypeScript (SDK)
- **Framework**: React 18/19 with TypeScript
- **Styling**: Tailwind CSS, Styled Components
- **Blockchain**: Thirdweb, Wagmi, Viem
- **State Management**: Zustand, React Query
- **Authentication**: B3 Global Accounts, Privy integration
- **Cross-chain**: AnySpend protocol

## 🚀 Getting Started

### Prerequisites

- Node.js v20.15.0+
- [pnpm](https://pnpm.io) package manager

### Installation

```bash
# Install all dependencies
pnpm install
```

### Development

```bash
# Run all workspace projects in parallel
pnpm dev

# Run specific workspace
pnpm --filter <workspace-name> dev

# Examples:
pnpm --filter global-accounts dev
pnpm --filter global-accounts-demo dev        # Memory game
pnpm --filter global-accounts-demo dev:battle # Battle game
pnpm --filter login-minimal-example dev

# SDK development
pnpm sdk:dev:css  # Watch CSS builds
pnpm sdk:build    # Build SDK
```

### Building

```bash
# Build all applications
pnpm build-all

# Build specific workspace
pnpm --filter <workspace-name> build

# Examples:
pnpm global-accounts:build
pnpm global-accounts-demos:build
pnpm login-minimal-example:build
```

## 🎮 Demo Applications

### Global Accounts Demos

**Memory Game Mode** (default):

- NFT-based memory matching game
- Claim NFTs upon successful completion
- Integrates with B3 Global Accounts for seamless authentication

**NFT Battle Mode**:

- Battle using NFTs from your collection as weapons
- Real-time battle mechanics with scoring system
- Showcases NFT utility in gaming applications

Switch between modes:

```bash
# Development
pnpm --filter global-accounts-demo dev:battle

# Build
pnpm --filter global-accounts-demo build:battle
```

## 📚 SDK Usage

### Installation

```bash
npm install @b3dotfun/sdk
# or
pnpm add @b3dotfun/sdk
```

### Basic Authentication

```tsx
import { B3Provider, SignInWithB3 } from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";

function App() {
  return (
    <B3Provider environment="production" theme="light">
      <SignInWithB3
        chain={{ id: 8333, name: "B3" /* ... */ }}
        partnerId="your-partner-id"
        sessionKeyAddress="0x..."
        onLoginSuccess={account => console.log("Authenticated!", account)}
      />
    </B3Provider>
  );
}
```

### Cross-chain Operations

```tsx
import { AnySpendNFTButton } from "@b3dotfun/sdk/anyspend/react";

function NFTMinting() {
  const nftContract = {
    address: "0x...",
    chainId: 8333,
    name: "My NFT",
    price: "1000000000000000000", // 1 ETH
    // ...
  };

  return <AnySpendNFTButton nftContract={nftContract} recipientAddress="0x..." />;
}
```

## 🔧 Development Scripts

### Root Level

- `pnpm dev` - Run all workspaces in development mode
- `pnpm build-all` - Build all applications and SDK
- `pnpm sdk:build` - Build the SDK package
- `pnpm prettier:check` - Check code formatting
- `pnpm prettier:write` - Format code

### Workspace Level

Each workspace includes:

- `dev` - Start development server
- `build` - Build for production
- `lint` - Run ESLint
- `preview` - Preview production build

## 🌐 Platform Support

| Feature         | React Web | React Native |
| --------------- | --------- | ------------ |
| Global Accounts | ✅        | ✅           |
| AnySpend        | ✅        | ❌           |
| Gaming Demos    | ✅        | ❌           |
| SDK Services    | ✅        | ✅           |

## 🔗 Important Links

- [B3 Documentation](https://docs.b3.fun)
- [B3 Explorer](https://explorer.b3.fun)
- [SDK Documentation](./packages/sdk/README.md)
- [GitHub Repository](https://github.com/b3-fun)
