# B3 Monorepo 🚀

This monorepo contains all B3's applications, services, and shared packages. Built with pnpm workspaces for optimal development experience.

## 📦 Repository Structure

### Applications (`/apps`)

- **global-accounts**

  - Documentation & demo site for Global Accounts
  - Showcases B3's account features and integration examples

- **global-accounts-demos**
  - Interactive demo application
  - Supports two game modes:
    - Memory Game (default)
    - Battle Mode
  - Switch modes via `VITE_APP_TYPE` environment variable

### Services (`/services`)

- **Cloudflare Workers**
  - `partner-session-keys`: Manages synchronization of:
    - Ecosystem wallet metadata
    - Session key management
    - Cross-platform state persistence

### Packages (`/packages`)

- Future home for B3's shared packages and libraries
- Coming soon!

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- [pnpm](https://pnpm.io) package manager

### Installation

```bash
# Install dependencies
pnpm install

# Install and login to wrangler
npm i -g wrangler
wrangler login
```

### Development

```bash
# Run all workspace projects in parallel
pnpm dev

# Run specific workspace
pnpm --filter <workspace-name> dev

# Examples:
pnpm --filter global-accounts dev # use name from specific workspaces package.json
pnpm --filter global-accounts-demo dev:battle  # For battle game mode

# to run b3-api
cp ./doppler.yaml.template ./doppler.yaml
pnpm run env
pnpm --filter b3-api dev
```

### Available Scripts

Each workspace may have its own specific scripts. Common ones include:

- `dev`: Start development server
- `build`: Build for production
- `lint`: Run linting
- `preview`: Preview production build
- `publish-clean`: Publish b3-api (use: `pnpm --filter b3-api publish-clean`)

## 🛠️ Technology Stack

- Package Management: pnpm
- Build Tool: Vite
- Framework: React
- Type Safety: TypeScript
- Cloud: Cloudflare Workers

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]
