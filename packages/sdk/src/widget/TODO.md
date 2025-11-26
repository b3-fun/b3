# B3 Widget System - Development TODO

## Core Infrastructure ✅ COMPLETED
- [x] Create widget types and configuration system
- [x] Create widget manager for detection and lifecycle
- [x] Create widget renderer with React root management
- [x] Create widget entry point (index.ts)
- [x] Set up Vite build configuration for widget bundle
- [x] Add widget build scripts to package.json

## Priority: Sign-In & Paywall 🚀 IN PROGRESS

### Sign-In Widget
- [x] Basic SignInWidget component
- [ ] Test sign-in flow with all strategies
- [ ] Verify JWT token is accessible after sign-in
- [ ] Test callbacks fire correctly
- [ ] Verify sign-in state persists across page refresh

### Paywall Widget
- [x] Basic PaywallWidget component with blur effect
- [x] Content detection by selector/class
- [x] Blur effect after threshold paragraphs
- [x] Unlock UI overlay
- [x] Integration with sign-in state
- [ ] Test with various content structures (articles, blogs, etc.)
- [ ] Handle edge cases (scripts, tables, complex layouts)
- [ ] Add smooth transitions for unlock animation
- [ ] Test paywall with payment requirement (optional)
- [ ] Add customizable messaging

### Event System & Callbacks
- [x] Core event emission infrastructure
- [x] Sign-in success/error callbacks
- [x] Paywall locked/unlocked callbacks
- [x] Wallet connected/disconnected callbacks
- [ ] Test all callback scenarios
- [ ] Document callback API
- [ ] Add TypeScript examples for callbacks

## Documentation & Testing 📚 PENDING

### Documentation
- [ ] Create comprehensive README.md for widgets
- [ ] CDN usage guide with examples
- [ ] Sign-in widget API documentation
- [ ] Paywall widget API documentation
- [ ] Configuration options reference
- [ ] Callback/event system guide
- [ ] Migration guide for existing SDK users

### Demo & Testing
- [ ] Create HTML demo page (sign-in + paywall)
- [ ] Test on plain HTML site
- [ ] Test on WordPress site
- [ ] Test on Webflow site
- [ ] Test multiple widgets on same page
- [ ] Test widget doesn't break existing SDK functionality
- [ ] Performance testing (bundle size, load time)
- [ ] Browser compatibility testing

## Future Modal Support 🔮 FUTURE

These modal types are stubbed but not priority:
- [ ] Manage Account Widget
- [ ] Link Account Widget
- [ ] AnySpend Payment Widget
- [ ] Order History Widget
- [ ] Stake B3 Widget
- [ ] NFT Purchase Widget
- [ ] Tournament Widget
- [ ] BondKit Widget
- [ ] Signature Mint Widget
- [ ] Buy Spin Widget
- [ ] Avatar Editor Widget
- [ ] Profile Editor Widget
- [ ] Deposit Widgets (Hype, Upside)
- [ ] Collector Club Widget

## Build & Deployment 🚀 PENDING

- [ ] Build widget bundle with `pnpm build:widget`
- [ ] Test bundle in browser (file:// protocol)
- [ ] Optimize bundle size (code splitting, tree shaking)
- [ ] Generate source maps for debugging
- [ ] Set up CDN deployment process
- [ ] Create versioned CDN URLs (v1, v2, etc.)
- [ ] Set up automated releases

## Open Questions ❓

1. Should paywall support partial payments (micropayments)?
2. Should we add analytics/tracking to widgets?
3. Should widgets support custom styling/theming?
4. Should we provide framework-specific wrappers (Vue, Svelte, Angular)?
5. How should we handle multi-language support?

## Notes

- Widget system is designed to not affect existing SDK functionality
- All widgets are isolated with their own React roots
- B3Provider wraps each widget instance independently
- Paywall automatically unlocks when user signs in (unless payment required)

