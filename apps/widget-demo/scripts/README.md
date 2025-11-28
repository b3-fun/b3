# Widget Demo Scripts

Development scripts for the B3 Widget Demo app.

## 🚀 Quick Commands

### For First Time & Active Development ⭐

```bash
pnpm dev:widget
```

**What it does**:
1. Builds widget SDK (initial build)
2. Copies to demo's `public/widget/`
3. Starts **3 watchers in parallel**:
   - **SDK** - Rebuilds when widget source changes
   - **COPY** - Copies bundle when it changes
   - **DEMO** - Vite dev server with hot reload

**When to use**: 
- ✅ First time running demo
- ✅ Active widget development
- ✅ Want hot reload when SDK changes

**Full hot-reload flow**:
```
Edit packages/sdk/src/widget/...
  ↓
SDK rebuilds (Vite watch)
  ↓
Bundle watcher copies to demo
  ↓
Vite hot-reloads browser
  ↓
See changes! 🎉
```

### For Demo-Only Work

```bash
pnpm dev:full
```

**What it does**:
1. Builds widget once
2. Starts dev server
3. No watching

**When to use**: 
- ✅ Only editing demo HTML/CSS
- ✅ Widget SDK not changing
- ✅ Faster startup (no watcher)

### Manual Control (Advanced)

```bash
# Just build + copy widget
pnpm widget:build

# Just watch bundle (assumes already built)
pnpm widget:watch

# Build + watch (no demo server)
./scripts/dev-widget.sh --watch
```

## 📜 Script Details

### `dev-widget.sh`

**Purpose**: Build SDK widget and copy to demo

**Usage**:
```bash
./scripts/dev-widget.sh          # Build + copy once
./scripts/dev-widget.sh --watch  # Build + copy + watch
```

**What it does**:
1. Builds widget SDK (`pnpm build:widget` in sdk/)
2. Copies bundle to `public/widget/`
3. Optionally watches for changes (requires `fswatch` on Mac)

**Requires**: Bash, pnpm, fswatch (optional, for watch mode)

### `watch-bundle.js`

**Purpose**: Watch SDK bundle directory and auto-copy on changes

**Usage**:
```bash
./scripts/watch-bundle.js
# or
pnpm widget:watch
```

**What it does**:
1. Watches `packages/sdk/bundles/widget/`
2. Auto-copies to `public/widget/` when files change
3. Debounces rapid changes (100ms)

**Requires**: Node.js (no extra dependencies!)

**Cross-platform**: Works on Mac, Linux, Windows

## 🔄 Development Workflows

### Workflow 1: Full Stack Widget Development

You're editing both SDK and demo simultaneously:

```bash
# Single terminal - everything runs in parallel!
cd apps/widget-demo
pnpm dev:widget
```

**Result**: 
- Edit `packages/sdk/src/widget/...` → SDK rebuilds → Bundle auto-copies → Vite hot-reloads → See changes!
- Edit `apps/widget-demo/index.html` → Vite hot-reloads → See changes!

**All in one command!** The script runs 3 processes:
1. **SDK watcher** - Rebuilds on source changes
2. **Bundle copier** - Copies when bundle changes  
3. **Vite dev server** - Serves demo with hot reload

### Workflow 2: Demo-Only Development

You're just editing demo HTML/styles:

```bash
pnpm dev:full  # Build widget once, start dev server
```

**Result**: Fast startup, no SDK watching

### Workflow 3: Test Production Build

```bash
pnpm widget:build  # Ensure latest widget
pnpm build         # Build demo
pnpm preview       # Test production build
```

## 🛠️ Script Comparison

| Command | Builds SDK | Copies Bundle | Watches SDK | Watches Bundle | Starts Dev Server |
|---------|-----------|---------------|-------------|----------------|-------------------|
| `pnpm dev:widget` | ✅ (initial) | ✅ | ✅ | ✅ | ✅ |
| `pnpm dev:full` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `pnpm widget:build` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `pnpm widget:watch` | ❌ | ✅ | ❌ | ✅ | ❌ |
| `pnpm widget:dev` | ✅ | ✅ | ✅ | ❌ |

## 💡 Tips

### Faster Rebuilds

The SDK build is the slowest part (~30-60s). To speed up:

1. **Use SDK watch mode** (if available):
   ```bash
   cd packages/sdk
   pnpm dev:widget  # Rebuilds only changed files
   ```

2. **Keep watch running**: Leave `pnpm widget:watch` running between SDK builds

### Installing fswatch (Mac)

For better file watching performance on Mac:

```bash
brew install fswatch
```

Without `fswatch`, the script falls back to polling (works, but slower).

### Debugging Issues

**Bundle not copying?**
```bash
# Check if bundle exists
ls ../../packages/sdk/bundles/widget/

# Build SDK if missing
cd ../../packages/sdk && pnpm build:widget
```

**Watcher not detecting changes?**
```bash
# Check watcher is running
ps aux | grep watch-bundle

# Restart watcher
pnpm widget:watch
```

**Demo not updating?**
```bash
# Hard refresh browser
# Mac: Cmd+Shift+R
# Windows/Linux: Ctrl+Shift+R

# Or clear Vite cache
rm -rf node_modules/.vite
```

## 📦 Dependencies

- **concurrently**: Run multiple commands in parallel (for `dev:widget`)
- **vite**: Dev server and build tool
- **fswatch** (optional): Better file watching on Mac

## 🔧 How It Works

### Watch Mode Flow

```
┌─────────────────────────────────────────┐
│  1. SDK Developer edits widget code     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2. Developer runs: pnpm build:widget   │
│     (in packages/sdk)                   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  3. New bundle created in:              │
│     packages/sdk/bundles/widget/        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  4. watch-bundle.js detects change      │
│     (monitoring bundles/widget/)        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  5. Auto-copies to:                     │
│     apps/widget-demo/public/widget/     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  6. Vite detects change in public/      │
│     (hot module reload)                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  7. Browser auto-refreshes!             │
│     Demo shows new widget code          │
└─────────────────────────────────────────┘
```

## 🆘 Troubleshooting

### "Widget bundle not found"

**Problem**: `dev-widget.sh` can't find the bundle

**Solution**:
```bash
cd ../../packages/sdk
pnpm install
pnpm build:widget
```

### "Permission denied"

**Problem**: Scripts aren't executable

**Solution**:
```bash
chmod +x scripts/*.sh scripts/*.js
```

### Watch mode not working

**Problem**: File changes not detected

**Solutions**:
1. Install fswatch: `brew install fswatch` (Mac)
2. Use Node.js watcher: `pnpm widget:watch` (cross-platform)
3. Manual refresh: Run `pnpm widget:build` after each SDK change

---

**Last Updated**: Nov 25, 2025

