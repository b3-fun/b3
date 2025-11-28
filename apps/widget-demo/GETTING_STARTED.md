# Getting Started

## 🎯 Local E2E Testing

### One-Time Setup

```bash
# 1. Install dependencies
cd apps/widget-demo
pnpm install

# 2. Start dev mode (builds SDK + watches + serves)
pnpm dev:widget

# 3. Open http://localhost:3000
```

**That's it!** The widget auto-rebuilds when you edit SDK code.

---

## 🔄 Development Workflow

### Active Development (SDK + Demo)

```bash
pnpm dev:widget
```

- ✅ Watches `packages/sdk/src/widget/**`
- ✅ Auto-rebuilds on changes
- ✅ Auto-copies to demo
- ✅ Browser hot-reloads

**Use when**: Editing SDK widget code

### Demo-Only Development

```bash
pnpm dev:full
```

- ✅ Builds widget once
- ✅ Starts dev server
- ❌ No watching

**Use when**: Only editing HTML/CSS

---

## 🧪 Testing

Visit these pages:

1. **Main Demo** - http://localhost:3000
2. **Basic Example** - http://localhost:3000/examples/basic.html
3. **Content Gate** - http://localhost:3000/examples/content-gate.html

Test flow:

1. See blurred content
2. Click "Sign In with B3"
3. Authenticate
4. Watch content unlock
5. Check Event Log

---

## 🐛 Troubleshooting

### Widget not loading?

```bash
# Rebuild and copy
cd packages/sdk
pnpm build:widget

cd ../../apps/widget-demo
ls public/widget/  # Should see b3-widget.js

# Hard refresh browser (Cmd+Shift+R)
```

### Changes not showing?

```bash
# Restart dev mode
pnpm dev:widget

# Or manually rebuild
cd ../../packages/sdk && pnpm build:widget
```

---

## 📚 Next Steps

- Read full demo at `/`
- Check `README.md` for deployment
- See `../../packages/sdk/src/widget/` for SDK code
