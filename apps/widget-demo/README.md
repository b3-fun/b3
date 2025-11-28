# B3 Widget Demo

Live demo showing how to embed B3 authentication and content gating into any website.

## 🚀 Quick Start

```bash
# From this directory
pnpm dev:widget
```

**One command does everything:**

- Builds widget SDK
- Watches for changes & auto-rebuilds
- Runs dev server with hot reload
- Opens http://localhost:3000

## 📁 Examples

- **`/`** - Full demo with docs and event logging
- **`/examples/basic.html`** - Minimal sign-in only
- **`/examples/content-gate.html`** - Article with content gating

## 🛠️ Scripts

```bash
pnpm dev:widget    # Full dev mode with hot reload (recommended)
pnpm dev:full      # Build once + serve (no watching)
pnpm dev           # Serve only (assumes widget already built)
pnpm build         # Build static site
pnpm preview       # Preview production build
```

## 📦 Structure

```
widget-demo/
├── index.html              # Full demo
├── examples/
│   ├── basic.html         # Sign-in only
│   └── content-gate.html  # Content gating
├── public/widget/         # Built SDK (gitignored)
└── scripts/
    ├── dev-widget.sh      # Dev build script
    └── watch-bundle.js    # Hot reload watcher
```

## 🔗 Related

- Widget SDK: `../../packages/sdk/src/widget/`
- Getting Started: `./GETTING_STARTED.md`
- Build Config: `../../packages/sdk/vite.widget.config.ts`
