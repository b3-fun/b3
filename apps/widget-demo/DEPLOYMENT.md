# B3 Widget Demo - Deployment Guide

## 🎯 Overview

Static demo site for the B3 Widget SDK. Shows sign-in and content gating features. Railway-ready for one-click deployment.

## 🚀 Quick Deploy to Railway

### Option 1: GitHub Integration (Recommended)

1. Push this repo to GitHub
2. Go to [Railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects `railway.json` and deploys
6. **No environment variables needed** - it's a static site!

### Option 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

## 📦 What Gets Deployed

```
dist/
├── index.html              # Full demo with docs
├── examples/
│   ├── basic.html         # Minimal sign-in
│   └── content-gate.html  # Content gating
└── assets/                 # Bundled JS/CSS
```

## 🔧 Local Development

### 1. Build the Widget SDK First

```bash
# From root of monorepo
cd packages/sdk
pnpm build:widget
```

This creates: `packages/sdk/bundles/widget/b3-widget.js` and `.css`

### 2. Copy Widget Bundle to Demo

```bash
# From apps/widget-demo
pnpm copy-widget

# Or manually:
cp ../../packages/sdk/bundles/widget/* ./public/widget/
```

### 3. Run Dev Server

```bash
pnpm dev
# Open http://localhost:3000
```

### Quick Start (All-in-One)

```bash
pnpm dev:full
# Copies widget bundle and starts dev server
```

## 📁 Directory Structure

```
widget-demo/
├── index.html              # Main demo page
├── examples/
│   ├── basic.html         # Simple sign-in only
│   └── content-gate.html  # Article with gate
├── public/
│   └── widget/            # Local widget bundle (gitignored)
│       ├── b3-widget.js
│       └── b3-widget.css
├── scripts/
│   └── copy-widget-bundle.sh
├── vite.config.js         # Vite configuration
├── railway.json           # Railway deployment config
└── package.json
```

## 🌐 CDN vs Local Development

### Production (CDN)

```html
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

Once the widget is deployed to CDN, the demo will automatically work.

### Development (Local)

```html
<link href="/widget/b3-widget.css" rel="stylesheet" />
<script src="/widget/b3-widget.js"></script>
```

Requires running `pnpm copy-widget` to copy SDK build to `/public/widget/`.

## 🛠️ Build Process

### Development Build

```bash
pnpm dev
# Runs vite dev server with hot reload
```

### Production Build

```bash
pnpm build
# Output: dist/ folder with optimized static files
```

### Preview Production Build

```bash
pnpm preview
# Serves the dist/ folder locally
```

## 🚢 Railway Configuration

### `railway.json`

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

### Start Command

```json
"start": "vite preview --port $PORT --host 0.0.0.0"
```

Railway provides `$PORT` automatically. Vite preview serves the built static files.

## 🔗 URLs

After deployment:

- **Main Demo**: `https://your-app.railway.app/`
- **Basic Example**: `https://your-app.railway.app/examples/basic.html`
- **Content Gate**: `https://your-app.railway.app/examples/content-gate.html`

## 📊 Dependencies

### Runtime

None! It's a static site. The B3 Widget SDK is loaded from CDN (or local for dev).

### Build

- `vite` - Build tool and dev server

That's it! No React, no framework dependencies.

## 🐛 Troubleshooting

### Widget Not Loading

**Symptom**: "B3 Widget SDK not loaded" error in console

**Solutions**:

1. For dev: Run `pnpm copy-widget` to copy SDK bundle
2. For production: Ensure CDN URLs are correct
3. Check browser console for 404 errors

### Build Fails on Railway

**Symptom**: Railway build fails

**Solutions**:

1. Ensure `pnpm-lock.yaml` is committed
2. Check Railway build logs
3. Verify `railway.json` is present

### Port Issues Locally

**Symptom**: Port 3000 already in use

**Solution**:

```bash
# Use different port
vite --port 3001
```

## 📝 Environment Variables

None needed! The demo is a static site with no backend.

However, you may want to configure:

- **Partner ID**: Hardcoded in HTML as `'dbcd5e9b-564e-4ba0-91a0-becf0edabb61'`
- Update in `index.html`, `examples/basic.html`, etc. before deploying

## 🎨 Customization

### Update Partner ID

Find and replace in HTML files:

```javascript
window.B3Widget.init({
  partnerId: "your-actual-partner-id", // ← Change this
  // ...
});
```

### Change Theme

```javascript
window.B3Widget.init({
  partnerId: "your-id",
  theme: "dark", // or 'light'
});
```

### Modify Examples

All examples are standalone HTML files. Edit directly:

- `index.html` - Full featured demo
- `examples/basic.html` - Minimal example
- `examples/content-gate.html` - Article with gate

## 🔄 Updates & Maintenance

### Update Widget SDK

1. Build new SDK version:

```bash
cd ../../packages/sdk
pnpm build:widget
```

2. Copy to demo (for local dev):

```bash
cd ../../apps/widget-demo
pnpm copy-widget
```

3. For production, deploy new widget to CDN first

### Deploy Updates

Railway auto-deploys on git push to main branch.

Or manually:

```bash
railway up
```

## 📞 Support

- **SDK Issues**: See `packages/sdk/src/widget/README.md`
- **Demo Issues**: Open issue in repo
- **Deployment Issues**: Check Railway logs

## ✅ Pre-Deployment Checklist

- [ ] Widget SDK built (`pnpm build:widget` in sdk/)
- [ ] Partner ID updated in HTML files
- [ ] Tested locally with `pnpm dev`
- [ ] Built and tested with `pnpm build && pnpm preview`
- [ ] `railway.json` present
- [ ] Pushed to GitHub

## 🎉 Success!

Once deployed, share these URLs:

- Main demo for full documentation
- Basic example for quick start
- Content gate example for content creators

---

**Last Updated**: Nov 25, 2025
