# AnySpend Demo JS

A simple HTML/CSS/JavaScript application for testing AnySpend quote functionality.

## Features

- Get quotes for ETH to USDC swaps on Base (Base → Base)
- Clean, modern UI with responsive design
- Real-time quote results with formatted amounts
- Uses mainnet for all quotes
- Simple interface with only the swap amount as input

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm dev
```

3. Open your browser and navigate to the localhost URL shown in the terminal (typically `http://localhost:5173`)

## Usage

1. The form is pre-configured for ETH → USDC swaps on Base:

   - **Source**: ETH on Base (Chain ID: 8453)
   - **Destination**: USDC on Base (Chain ID: 8453)
   - **Source Amount**: Enter the amount of ETH to swap (e.g., 0.00001)

2. Click **"Get Quote"** to fetch the quote

3. The destination amount will be filled automatically with the USDC amount you'll receive

## Configuration

The app is pre-configured with fixed values:

- **Source**: ETH on Base (Chain ID: 8453)
- **Destination**: USDC on Base (Chain ID: 8453)
- **Default Amount**: 0.00001 ETH (automatically converted to wei)

## Example Token Addresses

### Ethereum (Chain ID: 1)

- ETH: `0x0000000000000000000000000000000000000000`
- USDC: `0xA0b86a33E6417fad5206B3d64a5D50e55f9B679e`

### Base (Chain ID: 8453)

- ETH: `0x0000000000000000000000000000000000000000`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Technologies Used

- Vanilla HTML/CSS/JavaScript with ES modules
- Vite for development server and build tooling
- B3 SDK for AnySpend functionality
