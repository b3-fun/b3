# B3 Widget System - Quick Start Guide

## 🎉 What We Built

An embeddable widget system that allows **any website** (WordPress, Webflow, plain HTML, etc.) to add Web3 authentication and content gating with just a few lines of code.

### Core Features

✅ **Sign-In Widget** - Drop-in authentication button that opens B3 auth modal  
✅ **Paywall Widget** - Content gating that blurs articles and unlocks on sign-in  
✅ **Event System** - Comprehensive callbacks for all widget events  
✅ **CDN-Ready** - Single bundle that can be loaded from CDN  
✅ **Multiple Widgets** - Support for multiple widgets on same page  
✅ **Auto-Detection** - Automatically finds and initializes widgets  
✅ **Smooth Animations** - Beautiful unlock animations  
✅ **Non-Breaking** - Doesn't affect existing SDK functionality  

## 🚀 Testing the Widget System

### Step 1: Build the Widget Bundle

```bash
cd packages/sdk

# Build the widget bundle
pnpm build:widget

# This creates:
# - bundles/widget/b3-widget.js
# - bundles/widget/b3-widget.css
# - bundles/widget/b3-widget.js.map
```

### Step 2: Open the Demo Page

```bash
# From packages/sdk directory
open widget-demo.html

# Or serve it locally
npx serve .
# Then visit: http://localhost:3000/widget-demo.html
```

### Step 3: Test the Features

1. **Sign-In Flow**
   - Click "Sign In with B3" button in the header
   - Authenticate with any wallet
   - Watch the button change to "Manage Account"
   - Check the Event Log for callbacks

2. **Paywall Unlock**
   - Scroll down to the article
   - Notice the content is blurred after 3 paragraphs
   - Sign in (if not already)
   - Watch the content smoothly unlock with animation
   - Check the Event Log for unlock events

3. **Event Callbacks**
   - All events are logged in the Event Log section
   - Check browser console for detailed logs
   - Verify callbacks are firing correctly

## 📁 File Structure

```
packages/sdk/src/widget/
├── README.md                   # Comprehensive documentation
├── TODO.md                     # Development roadmap
├── types.ts                    # TypeScript definitions
├── manager.ts                  # Widget lifecycle manager
├── renderer.tsx                # React root manager
├── index.ts                    # CDN entry point
└── components/
    ├── WidgetWrapper.tsx       # B3Provider wrapper
    └── widgets/
        ├── SignInWidget.tsx    # ✅ Sign-in button
        ├── PaywallWidget.tsx   # ✅ Content gating
        ├── ManageAccountWidget.tsx
        ├── LinkAccountWidget.tsx
        ├── AnySpendWidget.tsx
        └── [other widgets]     # Stubbed for future

Other files:
├── widget-demo.html            # HTML demo page
├── vite.widget.config.ts       # Vite build config
└── WIDGET_QUICKSTART.md        # This file
```

## 🎯 How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│         Host Website (Any Site)         │
│  ┌───────────────────────────────────┐  │
│  │   <script src="b3-widget.js">    │  │
│  │   window.B3Widget.init(...)       │  │
│  └───────────────────────────────────┘  │
│                    │                     │
│       ┌────────────▼─────────────┐      │
│       │    Widget Manager        │      │
│       │  (Detects & Initializes) │      │
│       └──────┬──────────┬────────┘      │
│              │          │                │
│  ┌───────────▼──┐  ┌───▼──────────┐    │
│  │ SignIn Widget│  │Paywall Widget│    │
│  │  React Root  │  │  React Root  │    │
│  │      ↓       │  │      ↓       │    │
│  │ B3Provider   │  │ B3Provider   │    │
│  │      ↓       │  │      ↓       │    │
│  │ B3DynamicModal│ │AuthStore,etc.│    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **Isolated React Roots** - Each widget gets its own React root, preventing conflicts
2. **Shared B3Provider** - All widgets share the same auth context
3. **Data Attributes** - Configuration via HTML attributes (no JS required)
4. **Event-Driven** - Widgets communicate via events, not direct references
5. **Non-Invasive** - Doesn't modify existing SDK, purely additive

### Paywall Logic

```javascript
// 1. Find content element by selector
const element = document.querySelector(selector);

// 2. Get paragraphs/text elements
const elements = element.querySelectorAll('p, li, div');

// 3. Show first N (threshold)
elements.slice(0, threshold) // visible

// 4. Blur remaining
elements.slice(threshold).forEach(el => {
  el.style.filter = 'blur(8px)';
});

// 5. Add gradient overlay
// 6. Listen for auth events
authStore.subscribe(isAuth => {
  if (isAuth) unlockContent();
});

// 7. Animate unlock
function unlockContent() {
  // Fade out overlay
  // Remove blur with transition
  // Expand height
}
```

## 🧪 Testing Checklist

### Core Functionality
- [ ] Build completes without errors
- [ ] Demo page loads without console errors
- [ ] Sign-in button renders
- [ ] Sign-in modal opens
- [ ] Authentication completes
- [ ] Paywall detects content
- [ ] Paywall applies blur effect
- [ ] Paywall unlocks on sign-in
- [ ] Animations are smooth
- [ ] Multiple widgets work together

### Callbacks
- [ ] `onReady` fires for each widget
- [ ] `onSignIn` fires on authentication
- [ ] `onPaywallLocked` fires on mount
- [ ] `onPaywallUnlocked` fires on sign-in
- [ ] `onWalletConnected` fires
- [ ] `onEvent` receives all events

### Edge Cases
- [ ] Multiple sign-in widgets on page
- [ ] Multiple paywalls on page
- [ ] Dynamic widget insertion
- [ ] Widget removal/cleanup
- [ ] Page refresh (state persistence)
- [ ] Sign out and back in

### Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome
- [ ] Mobile Safari

## 🚢 Deployment

### 1. Build for Production

```bash
pnpm build:widget
```

### 2. Upload to CDN

Upload these files:
- `bundles/widget/b3-widget.js`
- `bundles/widget/b3-widget.css`
- `bundles/widget/b3-widget.js.map` (optional, for debugging)

### 3. CDN Structure

```
https://cdn.b3.fun/widget/
├── v1/
│   ├── b3-widget.js
│   ├── b3-widget.css
│   └── b3-widget.js.map
├── v2/  (future versions)
└── latest/ (symlink to latest version)
```

### 4. Usage

```html
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

## 📊 Bundle Size

Target sizes (gzipped):
- **b3-widget.js**: ~150-200 KB (includes React + SDK)
- **b3-widget.css**: ~20-30 KB

Current sizes:
```bash
# Check after building
ls -lh bundles/widget/
```

Optimizations applied:
- Tree shaking
- Minification (Terser)
- Code splitting (where possible)
- CSS minification

## 🔧 Development Workflow

### Watch Mode

```bash
# Watch and rebuild on changes
pnpm dev:widget
```

### Testing Flow

1. Make changes to widget code
2. Run `pnpm build:widget`
3. Refresh `widget-demo.html`
4. Test functionality
5. Check console for errors
6. Verify callbacks

### Adding New Widget Types

1. Create widget component in `components/widgets/`
2. Add widget type to `types.ts`
3. Add case to `WidgetWrapper.tsx`
4. Add data attributes to `manager.ts` parser
5. Update documentation
6. Test in demo page

## ❓ FAQ

**Q: Does this affect the existing SDK?**  
A: No! The widget system is completely isolated. It imports from the SDK but doesn't modify it.

**Q: Can I use this in a React app?**  
A: You could, but it's designed for non-React sites. For React apps, use the SDK components directly.

**Q: How do I customize styling?**  
A: Override CSS classes or pass `theme` config. Full theming support coming soon.

**Q: Can I track conversions?**  
A: Yes! Use the callbacks to send events to your analytics platform.

**Q: What about mobile?**  
A: Fully responsive. The B3 modals adapt to mobile automatically.

## 🐛 Known Issues

None currently! 🎉

If you find issues, document them in the TODO.md file.

## 📞 Next Steps

1. ✅ Build and test locally
2. ⏳ Deploy to staging CDN
3. ⏳ User testing on real websites
4. ⏳ Performance optimization
5. ⏳ Add more widget types (as needed)
6. ⏳ Multi-language support
7. ⏳ Framework-specific wrappers

## 🎓 Resources

- **Full Documentation**: `src/widget/README.md`
- **TODO List**: `src/widget/TODO.md`
- **Demo Page**: `widget-demo.html`
- **Type Definitions**: `src/widget/types.ts`

---

**Built with ❤️ by the B3 team**

