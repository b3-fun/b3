# Getting Started - B3 Widget Demo

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Access to the B3 monorepo

## 🎯 Complete E2E Local Testing

This guide walks you through testing the entire widget system from scratch.

### Step 1: Install Dependencies

```bash
# From root of monorepo

# Install SDK dependencies (if not already done)
cd packages/sdk
pnpm install

# Install demo dependencies
cd ../../apps/widget-demo
pnpm install
```

**Time**: ~20-30 seconds total

### Step 2: Start Dev Mode

```bash
# From apps/widget-demo
pnpm dev:widget
```

**What happens**:

1. ✅ Builds widget SDK bundle (initial build)
2. ✅ Copies to `public/widget/`
3. ✅ Starts **3 parallel watchers**:
   - **SDK** - Watches `packages/sdk/src/widget/**` and rebuilds
   - **COPY** - Watches bundle and auto-copies to demo
   - **DEMO** - Vite dev server with hot reload

**Output:**

```
🔨 Building widget SDK...
✅ Widget built successfully!

📦 Copying bundle to demo...
✅ Bundle copied!

[SDK]   watching for file changes...
[COPY]  👀 Watching for changes...
[DEMO]  ➜  Local: http://localhost:3000/
```

**Time**: ~30-60 seconds first time

**Hot Reload**: Now when you edit SDK widget files, they automatically rebuild and update in the demo! 🔥

### Step 5: Open in Browser

Visit: **http://localhost:3000**

You should see:

- 📘 B3 Widget Demo header
- 🔐 Sign In Widget button (top right)
- 📄 Premium Article with content gate
- 📊 Event Log showing initialization

### Step 6: Test the Flow

1. **Scroll down** to see the article is blurred after 3 paragraphs
2. **Click "Sign In with B3"** in the header
3. **Authenticate** with your wallet or social account
4. **Watch the article unlock** with smooth animation
5. **Check the Event Log** to see all events fired

---

## 🔄 Iterative Development

After the initial setup, your workflow is:

### Option A: Quick Start (Recommended)

```bash
# From apps/widget-demo
pnpm dev:full
```

This automatically copies the latest widget bundle and starts the dev server.

### Option B: Manual Control

```bash
# 1. Make changes to SDK
cd ../../packages/sdk
# ... edit widget code ...

# 2. Rebuild widget
pnpm build:widget

# 3. Copy to demo
cd ../../apps/widget-demo
pnpm copy-widget

# 4. Dev server auto-reloads!
# (If not running, start with: pnpm dev)
```

---

## 📂 Directory Structure After Setup

```
apps/widget-demo/
├── public/
│   └── widget/              # ← SDK bundle lives here (gitignored)
│       ├── b3-widget.js
│       ├── b3-widget.css
│       └── b3-widget.js.map
├── index.html               # Main demo (loads from /widget/)
├── examples/
│   ├── basic.html
│   └── content-gate.html
└── ...
```

---

## 🧪 Testing Different Examples

The demo includes multiple examples:

### Main Demo

```bash
open http://localhost:3000
```

Full-featured demo with documentation, event logging, and code examples.

### Basic Example

```bash
open http://localhost:3000/examples/basic.html
```

Minimal implementation showing just sign-in functionality.

### Content Gate Example

```bash
open http://localhost:3000/examples/content-gate.html
```

Real-world article with content gating and blur effect.

---

## 🐛 Troubleshooting

### "B3 Widget SDK not loaded" Error

**Symptom**: Browser console shows error, widgets don't render

**Cause**: Widget bundle not in `/public/widget/`

**Solution**:

```bash
# Build SDK if not built
cd ../../packages/sdk
pnpm build:widget

# Copy to demo
cd ../../apps/widget-demo
pnpm copy-widget
```

### Widget Bundle is Outdated

**Symptom**: Your SDK changes aren't showing in the demo

**Cause**: Demo is using old bundle from `/public/widget/`

**Solution**:

```bash
# Rebuild SDK
cd ../../packages/sdk
pnpm build:widget

# Copy fresh bundle
cd ../../apps/widget-demo
pnpm copy-widget

# Refresh browser (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
```

### Port 3000 Already in Use

**Symptom**: `Port 3000 is already in use`

**Solution**:

```bash
# Use different port
pnpm dev -- --port 3001
```

### Permission Denied on Script

**Symptom**: `Permission denied: ./scripts/copy-widget-bundle.sh`

**Solution**:

```bash
chmod +x ./scripts/copy-widget-bundle.sh
pnpm copy-widget
```

---

## 🎓 Understanding the Setup

### Why Copy the Bundle?

The demo is a **static site** that loads the widget SDK like any external website would. It doesn't import the SDK as a Node module - instead, it loads it via `<script>` tags:

```html
<script src="/widget/b3-widget.js"></script>
```

This mimics how the widget will be used in production:

```html
<!-- Production -->
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>

<!-- Local dev -->
<script src="/widget/b3-widget.js"></script>
```

### Why Not Link Directly?

We could symlink `public/widget` to `../../packages/sdk/bundles/widget`, but:

- ❌ Doesn't work on all platforms (Windows)
- ❌ Symlinks break easily
- ❌ Can cause permission issues
- ✅ Explicit copy is clearer and more reliable

---

## ✅ Success Checklist

Before reporting issues, verify:

- [ ] SDK bundle built: `ls ../../packages/sdk/bundles/widget/`
- [ ] Bundle copied: `ls public/widget/`
- [ ] Demo deps installed: `ls node_modules/`
- [ ] Dev server running: Check terminal for "ready in X ms"
- [ ] Browser console: No 404 errors for b3-widget.js
- [ ] Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

---

## 📚 Next Steps

- **Customize**: Edit HTML files to try different configurations
- **Test Callbacks**: Modify `window.B3Widget.init()` callbacks
- **Read Docs**: Check `/` route for full API documentation
- **Deploy**: See `DEPLOYMENT.md` for Railway deployment

---

## 🆘 Still Having Issues?

1. **Check console**: Browser DevTools → Console tab
2. **Check network**: Browser DevTools → Network tab (look for 404s)
3. **Verify files**: `ls -la public/widget/` (should show .js and .css)
4. **Fresh start**:

   ```bash
   # Clean everything
   rm -rf node_modules public/widget

   # Rebuild from scratch
   cd ../../packages/sdk
   pnpm build:widget
   cd ../../apps/widget-demo
   pnpm install
   pnpm copy-widget
   pnpm dev
   ```

---

**Last Updated**: Nov 25, 2025
