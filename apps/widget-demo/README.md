# B3 Widget Demo

Live demonstration site for the B3 Widget SDK. Shows how to integrate B3 authentication and content gate widgets into any website.

> **📖 First time?** See [GETTING_STARTED.md](./GETTING_STARTED.md) for complete E2E setup instructions.

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Install SDK dependencies (if not already done)
cd packages/sdk
pnpm install

# 2. Go to demo app
cd ../../apps/widget-demo
pnpm install

# 3. Start dev mode (builds widget + watches + serves)
pnpm dev:widget

# Open http://localhost:3000
```

That's it! **One command does everything.**

### Development Modes

**Active Widget Development** (recommended):

```bash
pnpm dev:widget
```

- Builds widget SDK (initial)
- Watches SDK source files & auto-rebuilds
- Watches bundle & auto-copies
- Runs dev server with hot reload
- **Use this when**: Actively editing SDK code
- **Full hot-reload**: Edit SDK → rebuild → copy → browser updates!

**Demo-Only Development**:

```bash
pnpm dev:full
```

- Builds widget once
- Runs dev server
- No watching
- **Use this when**: Only editing demo HTML/CSS

### Build for Production

```bash
# Build static site
pnpm build

# Preview production build
pnpm preview
```

## 📁 Structure

```
widget-demo/
├── index.html              # Full-featured demo with docs
├── examples/
│   ├── basic.html         # Minimal sign-in example
│   └── paywall.html       # Content gating example
├── vite.config.js         # Vite configuration
├── railway.json           # Railway deployment config
└── package.json
```

## 🌐 Live Examples

### 1. Full Demo (`/`)

- Comprehensive documentation
- Sign-in widget
- Content gate widget with article
- Event logging
- Code examples
- Configuration reference

### 2. Basic Example (`/examples/basic.html`)

- Minimal implementation
- Just sign-in functionality
- Shows simplest possible setup

### 3. Content Gate Example (`/examples/content-gate.html`)

- Real-world article scenario
- Content gating with blur effect
- Automatic unlock on sign-in
- Optional payment requirement

## 🚢 Railway Deployment

This site is configured for one-click deployment to Railway:

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Auto-Deploy**: Railway will detect `railway.json` and deploy automatically
3. **Environment**: No environment variables needed for demo

### Railway Configuration

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start"
  }
}
```

The `start` command runs `vite preview` which serves the built static files.

## 🔗 Widget SDK Setup

### For Development

The demo currently points to CDN URLs that don't exist yet:

```html
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

To test locally:

1. Build the widget SDK:

```bash
cd ../../packages/sdk
pnpm build:widget
```

2. Copy built files to demo's public folder:

```bash
mkdir -p ../../apps/widget-demo/public/widget
cp bundles/widget/* ../../apps/widget-demo/public/widget/
```

3. Update HTML to use local files:

```html
<script src="/widget/b3-widget.js"></script>
```

### For Production

Once the widget is deployed to CDN, the demo will automatically work with:

```html
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

## 🎯 Usage Examples

### Minimal Setup

```html
<!DOCTYPE html>
<html>
  <head>
    <link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
  </head>
  <body>
    <div data-b3-widget="sign-in"></div>

    <script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
    <script>
      window.B3Widget.init({
        partnerId: "your-partner-id",
      });
    </script>
  </body>
</html>
```

### With Content Gate

```html
<article id="article">
  <p>Paragraph 1...</p>
  <p>Paragraph 2...</p>
  <p>Paragraph 3...</p>
  <p>This will be blurred...</p>
</article>

<div data-b3-widget="content-gate" data-b3-gate-selector="#article" data-b3-gate-threshold="3"></div>
```

## 🛠️ Tech Stack

- **Vite** - Build tool and dev server
- **Vanilla JavaScript** - No framework dependencies
- **Railway** - Deployment platform

## 📝 Notes

- This is a **static site** - no server-side logic
- All widget functionality comes from the B3 Widget SDK
- The SDK bundle includes React and all dependencies
- No build dependencies pollute the SDK package

## 🔗 Related

- **Widget SDK**: `../../packages/sdk/src/widget/`
- **SDK Docs**: `../../packages/sdk/src/widget/README.md`
- **Build Config**: `../../packages/sdk/vite.widget.config.ts`

## 📞 Support

For widget SDK issues, see the main SDK documentation.
For demo site issues, open an issue in the repo.
