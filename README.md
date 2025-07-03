# B3 Monorepo 🚀

This monorepo contains all B3's applications, and shared packages. Built with pnpm workspaces for optimal development experience.

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

### Development

```bash
# Run all workspace projects in parallel
pnpm dev

# Run specific workspace
pnpm --filter <workspace-name> dev

# Examples:
pnpm --filter global-accounts dev # use name from specific workspaces package.json
pnpm --filter global-accounts-demo dev:battle  # For battle game mode
```

### Available Scripts

Each workspace may have its own specific scripts. Common ones include:

- `dev`: Start development server
- `build`: Build for production
- `lint`: Run linting
- `preview`: Preview production build

## 🛠️ Technology Stack

- Package Management: pnpm
- Build Tool: Vite
- Framework: React
- Type Safety: TypeScript

## 📝 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines here]
