# B3 Widget System - Quick Start

## 🎯 What We Built

An embeddable widget system for adding Web3 auth and content gating to **any website** with just a few lines of code.

### ✅ Features

- **Sign-In Widget** - Drop-in B3 authentication
- **Content Gate Widget** - Blur/unlock article content
- **Event System** - Callbacks for all widget events
- **CDN-Ready** - Single bundle loadable from CDN
- **Multiple Widgets** - Support many widgets per page
- **Non-Breaking** - Isolated from existing SDK

---

## 🚀 Test Locally

```bash
# Start dev mode (builds + watches + serves)
cd apps/widget-demo
pnpm dev:widget

# Open http://localhost:3000
```

---

## 📦 Usage

### CDN (Production)

```html
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

### Minimal Setup

```html
<div data-b3-widget="sign-in"></div>

<script>
  window.B3Widget.init({
    partnerId: "your-partner-id",
  });
</script>
```

### With Content Gate

```html
<article id="article">
  <p>Visible paragraph 1...</p>
  <p>Visible paragraph 2...</p>
  <p>Visible paragraph 3...</p>
  <p>This will be blurred...</p>
  <p>This too...</p>
</article>

<div data-b3-widget="content-gate" data-b3-gate-selector="#article" data-b3-gate-threshold="3"></div>
```

---

## 🎯 How It Works

```
┌──────────────────────────────────┐
│       Host Website               │
│  <script src="b3-widget.js">    │
│  window.B3Widget.init(...)       │
│                                  │
│  ┌──────────┐   ┌──────────┐   │
│  │ Sign-In  │   │  Content │   │
│  │ Widget   │   │   Gate   │   │
│  │  React   │   │  React   │   │
│  │  Root    │   │  Root    │   │
│  └──────────┘   └──────────┘   │
└──────────────────────────────────┘
```

- Each widget gets isolated React root
- All share same B3Provider context
- Auto-detects and initializes via data attributes
- Events communicate state changes

---

## 📁 File Structure

```
packages/sdk/src/widget/
├── index.tsx              # Entry point
├── renderer.tsx           # React root manager
├── manager.ts             # Lifecycle manager
├── types.ts               # TypeScript defs
└── components/
    └── widgets/
        ├── SignInWidget.tsx
        ├── ContentGateWidget.tsx
        └── ManageAccountWidget.tsx
```

---

## 🔧 Development

```bash
# Development mode (from apps/widget-demo)
pnpm dev:widget           # Builds + watches + serves

# Production build (from packages/sdk)
pnpm build:widget         # Output: bundles/widget/
```

---

## 📚 Resources

- **Live Demo**: `apps/widget-demo/`
- **Getting Started**: `apps/widget-demo/GETTING_STARTED.md`
- **TODO**: `src/widget/TODO.md`

---

**Built with ❤️ by the B3 team**
