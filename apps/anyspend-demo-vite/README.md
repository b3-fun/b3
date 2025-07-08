# AnySpend Demo (Vite)

This is a demo application showcasing the integration of AnySpend using Vite and React.

## Features

- Token Swapping: Swap between any supported tokens
- Fiat Onramp: Buy crypto directly with credit card
- B3 Token Purchase: Direct purchase of B3 tokens
- Seamless Integration: Uses B3Provider and AnyspendProvider

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

### Environment Variables

Create a `.env` file with:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=eb17a5ec4314526d42fc567821aeb9a6
NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID=ecosystem.b3dotfun
```

## Project Structure

```
src/
  ├── pages/           # Page components
  │   ├── HomePage.tsx
  │   ├── OnrampExamplePage.tsx
  │   ├── OnrampFlowPage.tsx
  │   └── OnrampOrderStatusPage.tsx
  ├── App.tsx         # Main app component
  ├── main.tsx        # Entry point
  └── index.css       # Global styles
```

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- @b3dotfun/sdk
- @tanstack/react-query

## Development

The project uses Vite for fast development and building. Key commands:

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

## Notes

- Uses Vite's CommonJS plugin for compatibility
- Includes node polyfills for web3 compatibility
- Configured for optimal development experience
