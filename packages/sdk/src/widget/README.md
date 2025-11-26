# B3 Widget SDK

> Embeddable authentication and payment widgets for any website

The B3 Widget SDK allows you to add Web3 authentication, paywalls, and payment features to any website—no React required. Simply drop in a few lines of HTML and JavaScript.

## 🚀 Quick Start

### 1. Include the SDK

```html
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

### 2. Initialize with Your Partner ID

```html
<script>
  window.B3Widget.init({
    partnerId: 'your-partner-id',
    environment: 'production',
    theme: 'light'
  });
</script>
```

### 3. Add Widgets to Your Page

```html
<!-- Sign In Button -->
<div data-b3-widget="sign-in"></div>

<!-- Paywall for Premium Content -->
<article id="article">
  <p>Your content here...</p>
</article>

<div data-b3-widget="paywall" 
     data-b3-paywall-selector="#article"
     data-b3-paywall-threshold="3"></div>
```

That's it! Your website now has Web3 authentication and content gating.

## 📚 Widget Types

### Sign In Widget

Renders a button that opens the B3 authentication modal.

```html
<div data-b3-widget="sign-in" 
     data-b3-button-text="Sign In with B3"
     data-b3-with-logo="true"></div>
```

**Attributes:**
- `data-b3-button-text` - Custom button text (default: "Sign In")
- `data-b3-logged-in-text` - Text when authenticated (default: "Manage Account")
- `data-b3-with-logo` - Show B3 logo (default: true)

### Paywall Widget

Gates content behind authentication or payment.

```html
<div data-b3-widget="paywall"
     data-b3-paywall-selector="#article"
     data-b3-paywall-threshold="3"
     data-b3-paywall-blur="8px"
     data-b3-paywall-height="400px"
     data-b3-paywall-require-payment="false"
     data-b3-paywall-price="5.00"
     data-b3-paywall-message="Unlock this content"
     data-b3-paywall-button-text="Sign in to Continue"></div>
```

**Attributes:**
- `data-b3-paywall-selector` - CSS selector for content to lock (required)
- `data-b3-paywall-class` - Alternative: CSS class name
- `data-b3-paywall-threshold` - Number of paragraphs before blur (default: 3)
- `data-b3-paywall-blur` - CSS blur amount (default: "8px")
- `data-b3-paywall-height` - Visible content height (default: "400px")
- `data-b3-paywall-require-payment` - Require payment vs sign-in only (default: false)
- `data-b3-paywall-price` - Price if payment required
- `data-b3-paywall-currency` - Currency (default: "USD")
- `data-b3-paywall-message` - Custom unlock message
- `data-b3-paywall-button-text` - Custom button text

**How It Works:**
1. Finds content using the selector or class
2. Shows first N paragraphs (threshold)
3. Blurs remaining content
4. Adds gradient overlay
5. Shows unlock UI
6. Automatically unlocks when user signs in

## ⚙️ Configuration

### Global Configuration

```javascript
window.B3Widget.init({
  // Required
  partnerId: 'your-partner-id',
  
  // Optional
  environment: 'production', // or 'development'
  theme: 'light', // or 'dark'
  clientType: 'rest', // or 'socket'
  automaticallySetFirstEoa: true,
  
  // RPC URLs for custom chains
  rpcUrls: {
    8453: 'https://mainnet.base.org',
    // ... other chains
  },
  
  // Toaster configuration
  toaster: {
    position: 'bottom-right',
    style: {
      // Custom CSS
    }
  },
  
  // Callbacks (see below)
  onSignIn: (data) => { /* ... */ },
  onPaymentSuccess: (data) => { /* ... */ },
  // ... more callbacks
});
```

### Callbacks

The widget system provides comprehensive callbacks for all events:

```javascript
window.B3Widget.init({
  partnerId: 'your-partner-id',
  
  // Widget lifecycle
  onReady: (widgetId, widgetType) => {
    console.log(`Widget ${widgetType} is ready`);
  },
  
  // Authentication
  onSignIn: (data) => {
    console.log('User signed in:', data.address);
    console.log('JWT token:', data.jwt);
    // Track conversion, update UI, etc.
  },
  
  onSignInError: (error) => {
    console.error('Sign in failed:', error.message);
    // Handle error, show message, etc.
  },
  
  // Wallet events
  onWalletConnected: (wallet) => {
    console.log('Wallet connected:', wallet.id);
  },
  
  onWalletDisconnected: () => {
    console.log('Wallet disconnected');
  },
  
  // Paywall events
  onPaywallLocked: (data) => {
    console.log('Content locked:', data.contentId);
    // Track analytics, show prompt, etc.
  },
  
  onPaywallUnlocked: (data) => {
    console.log('Content unlocked:', data.contentId);
    // Track conversion, update analytics, etc.
  },
  
  // Payment events
  onPaymentSuccess: (data) => {
    console.log('Payment successful:', data);
    // Grant access, update database, etc.
  },
  
  onPaymentError: (error) => {
    console.error('Payment failed:', error);
  },
  
  // Global event handler (receives ALL events)
  onEvent: (event) => {
    console.log('Event:', event.type, event.data);
  }
});
```

### Event Types

All events follow this structure:

```typescript
interface WidgetEvent {
  type: 'ready' | 'sign-in-success' | 'sign-in-error' | 
        'payment-success' | 'payment-error' | 
        'wallet-connected' | 'wallet-disconnected' | 
        'paywall-unlocked' | 'paywall-locked' | 
        'account-linked' | 'account-unlinked';
  widgetId: string;
  widgetType: string;
  data?: any;
  timestamp: number;
}
```

## 🎯 Use Cases

### 1. Premium Content / Paywalls

Gate blog posts, articles, or videos behind authentication or payment:

```html
<article id="premium-article">
  <h1>Premium Article</h1>
  <p>First paragraph is visible...</p>
  <p>Second paragraph is visible...</p>
  <p>Third paragraph is visible...</p>
  <p>This paragraph will be blurred...</p>
  <p>And this one too...</p>
</article>

<div data-b3-widget="paywall"
     data-b3-paywall-selector="#premium-article"
     data-b3-paywall-threshold="3"
     data-b3-paywall-message="Sign in to read the full article"></div>
```

### 2. Membership Sites

Require sign-in for access:

```html
<div data-b3-widget="sign-in" 
     data-b3-button-text="Member Login"></div>

<div class="members-only-content">
  <!-- Your members-only content -->
</div>

<div data-b3-widget="paywall"
     data-b3-paywall-class="members-only-content"
     data-b3-paywall-threshold="1"
     data-b3-paywall-message="Members only content"></div>
```

### 3. Pay-Per-View Content

Require payment to unlock:

```html
<div data-b3-widget="paywall"
     data-b3-paywall-selector="#video-content"
     data-b3-paywall-require-payment="true"
     data-b3-paywall-price="9.99"
     data-b3-paywall-currency="USD"
     data-b3-paywall-message="Watch the full video"
     data-b3-paywall-button-text="Unlock for $9.99"></div>
```

### 4. Multiple Paywalls on Same Page

Each widget is independent:

```html
<!-- Article 1 -->
<article id="article-1">...</article>
<div data-b3-widget="paywall" 
     data-b3-paywall-selector="#article-1"></div>

<!-- Article 2 -->
<article id="article-2">...</article>
<div data-b3-widget="paywall" 
     data-b3-paywall-selector="#article-2"></div>
```

## 🎨 Styling

The widgets use the B3 design system and respect your `theme` configuration. You can also add custom CSS:

```css
/* Customize widget containers */
.b3-widget-signin {
  /* Your styles */
}

.b3-widget-paywall {
  /* Your styles */
}

/* Customize unlock UI */
.b3-paywall-overlay {
  /* Custom gradient */
}
```

## 🔧 Advanced Usage

### Custom Widget IDs

Assign custom IDs for tracking:

```html
<div data-b3-widget="sign-in" 
     data-b3-widget-id="header-signin"></div>
```

### Event Listeners

Subscribe to specific events:

```javascript
// Returns unsubscribe function
const unsubscribe = window.B3Widget.on('sign-in-success', (event) => {
  console.log('User signed in:', event.data);
});

// Later...
unsubscribe(); // Stop listening
```

### Programmatic Control

```javascript
// Destroy a specific widget
window.B3Widget.destroy('widget-id');

// Destroy all widgets
window.B3Widget.destroyAll();

// Emit custom events
window.B3Widget.emit({
  type: 'custom-event',
  widgetId: 'my-widget',
  widgetType: 'custom',
  data: { foo: 'bar' },
  timestamp: Date.now()
});
```

### Dynamic Widgets

Widgets are automatically detected when added to the DOM:

```javascript
// Add widget dynamically
const div = document.createElement('div');
div.setAttribute('data-b3-widget', 'sign-in');
div.setAttribute('data-b3-button-text', 'Login');
document.body.appendChild(div);

// Widget will be automatically initialized!
```

## 📖 Integration Examples

### WordPress

```php
<!-- In your theme's header.php -->
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
<script>
  window.B3Widget.init({
    partnerId: '<?php echo get_option('b3_partner_id'); ?>',
    environment: 'production',
    theme: 'light'
  });
</script>

<!-- In your theme -->
<div data-b3-widget="sign-in"></div>

<!-- In single post template -->
<?php if (is_single()): ?>
  <div data-b3-widget="paywall"
       data-b3-paywall-selector=".entry-content"
       data-b3-paywall-threshold="2"></div>
<?php endif; ?>
```

### Webflow

1. Add to **Page Settings > Custom Code > Head**:
```html
<link href="https://cdn.b3.fun/widget/v1/b3-widget.css" rel="stylesheet" />
<script src="https://cdn.b3.fun/widget/v1/b3-widget.js"></script>
```

2. Add to **Page Settings > Custom Code > Footer**:
```html
<script>
  window.B3Widget.init({
    partnerId: 'your-partner-id',
    environment: 'production'
  });
</script>
```

3. Add **Embed** elements with widget code

### Shopify

Similar to WordPress—add scripts to theme.liquid and use widget divs in templates.

## 🚨 Important Notes

### Content Preservation

The paywall widget is designed to be non-destructive:
- ✅ Preserves scripts and functionality
- ✅ Maintains table structures
- ✅ Keeps complex layouts intact
- ✅ Only blurs text content

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported (uses ES2015+ features)

### Performance

- Widget bundle size: ~150KB gzipped
- Lazy loads React only when needed
- Multiple widgets share same React context

## 📦 Build From Source

```bash
# Clone repo
cd packages/sdk

# Install dependencies
pnpm install

# Build widget bundle
pnpm build:widget

# Output: bundles/widget/b3-widget.js & b3-widget.css
```

## 🐛 Troubleshooting

### Widgets Not Appearing

1. Check console for errors
2. Verify `partnerId` is correct
3. Ensure scripts loaded before `init()`
4. Check for ad blockers

### Paywall Not Unlocking

1. Verify selector is correct
2. Check authentication state
3. Look for console errors
4. Verify callback is firing

### Multiple Widgets Conflicting

Each widget has its own ID and React root—they shouldn't conflict. Check console for errors.

## 📞 Support

- Documentation: https://docs.b3.fun/widgets
- Discord: https://discord.gg/b3fun
- Email: support@b3.fun

## 📄 License

MIT License - see LICENSE file for details.

