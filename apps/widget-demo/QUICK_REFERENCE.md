# 📖 Quick Reference

> **TL;DR**: `pnpm dev:widget` from `apps/widget-demo/` does everything.

---

## 🚀 Commands

```bash
# Active development (recommended)
pnpm dev:widget          # Full hot-reload setup

# Other modes
pnpm dev:full            # Build once + serve
pnpm dev                 # Serve only
pnpm build               # Production build
pnpm preview             # Preview production
```

---

## 📁 Key Files

### Demo App
```
apps/widget-demo/
├── index.html                    # Main demo
├── examples/
│   ├── basic.html               # Sign-in only
│   └── content-gate.html        # Content gating
├── QUICK_REFERENCE.md           # This file ⬅️
├── GETTING_STARTED.md           # Setup guide
├── WIDGET_EXAMPLES.md           # 8+ example use cases
└── README.md                    # Project overview
```

### SDK
```
packages/sdk/
├── src/widget/
│   ├── index.tsx                # Entry point
│   ├── renderer.tsx             # React roots
│   ├── manager.ts               # Lifecycle
│   ├── TODO.md                  # Development status ⬅️
│   └── components/widgets/
│       ├── SignInWidget.tsx
│       └── ContentGateWidget.tsx
├── vite.widget.config.ts        # Build config
└── WIDGET_QUICKSTART.md         # SDK quick start
```

---

## 🌐 URLs (Dev Mode)

- **Main Demo**: http://localhost:3000
- **Basic Example**: http://localhost:3000/examples/basic.html
- **Content Gate**: http://localhost:3000/examples/content-gate.html

---

## 🎯 Widget Usage

### Minimal Sign-In

```html
<div data-b3-widget="sign-in"></div>

<script>
  window.B3Widget.init({ partnerId: "your-id" });
</script>
```

### Content Gate

```html
<article id="article">
  <p>Para 1</p> <p>Para 2</p> <p>Para 3</p>
  <p>Blurred...</p>
</article>

<div 
  data-b3-widget="content-gate"
  data-b3-gate-selector="#article"
  data-b3-gate-threshold="3"
></div>
```

### With Callbacks

```javascript
window.B3Widget.init({
  partnerId: "your-id",
  onWalletConnected: (wallet) => {
    console.log("Connected:", wallet.address);
  },
  onSignIn: (user) => {
    console.log("Signed in:", user);
  }
});
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Widget not loading | `cd packages/sdk && pnpm build:widget` |
| Changes not showing | Hard refresh browser (Cmd+Shift+R) |
| Port 3000 in use | `pnpm dev -- --port 3001` |
| Build errors | Check `packages/sdk/src/widget/` for lints |

---

## 📚 Documentation

- **Setup Guide**: `GETTING_STARTED.md`
- **Widget Examples**: `WIDGET_EXAMPLES.md` ⬅️ 8+ real use cases
- **Project README**: `README.md`
- **SDK Quickstart**: `../../packages/sdk/WIDGET_QUICKSTART.md`
- **Development TODO**: `../../packages/sdk/src/widget/TODO.md`

---

## ✅ Status

- ✅ Sign-in widget - **Mainnet ready**
- ✅ Content gate widget - **Mainnet ready**
- ✅ Hot-reload dev setup - **Working**
- ✅ Build pipeline - **Working**
- 🧪 Testing - **In progress** (see `TODO.md`)
- 📦 CDN deployment - **Pending**

---

## 💡 Next Steps

1. **Test locally**: `pnpm dev:widget`
2. **Try examples**: See `WIDGET_EXAMPLES.md`
3. **Add your use case**: Customize for your needs
4. **Deploy**: See `README.md` for Railway deployment

---

**Need help?** Check the docs above or open an issue.


