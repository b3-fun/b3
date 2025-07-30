# AnySpend Demo (Next.js)

This is a demo application showcasing the integration of AnySpend using Next.js 14 and React.

## Features

- Token Swapping: Swap between any supported tokens
- Fiat Onramp: Buy crypto directly with credit card
- B3 Token Purchase: Direct purchase of B3 tokens
- Server Components: Leverages Next.js 14 server components
- Optimized Performance: Built with the App Router

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

Create a `.env.local` file with:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=f393c7eb287696dc4db76d980cc68328
NEXT_PUBLIC_THIRDWEB_ECOSYSTEM_ID=ecosystem.b3-open-gaming
```

## Project Structure

```
src/
  ├── app/            # Next.js 14 app directory
  │   ├── layout.tsx  # Root layout (server)
  │   ├── page.tsx    # Home page (client)
  │   └── globals.css # Global styles
  └── components/     # Shared components
```

## Tech Stack

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- @b3dotfun/sdk
- @tanstack/react-query

## Development

The project uses Next.js 14 with the App Router. Key commands:

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Architecture

- Uses Next.js 14 App Router
- Proper separation of server and client components
- Client-side state management with React Query
- Styled with Tailwind CSS
- Integration with B3Provider and AnyspendProvider

## Notes

- Configured for optimal server-side rendering
- Uses client boundaries for SDK integration
- Follows Next.js best practices for performance
