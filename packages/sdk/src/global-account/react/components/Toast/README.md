# B3 Toast System

A custom toast notification system that renders inside the B3DynamicModal with full Sonner API compatibility.

## Features

- ✅ **Modal-Integrated**: Toasts appear inside the modal at the bottom
- ✅ **Sonner API Compatible**: Drop-in replacement for `sonner` package
- ✅ **Theme Support**: Respects light/dark theme from B3Provider
- ✅ **Auto-Dismiss**: Configurable duration with manual dismiss
- ✅ **Animated**: Smooth entry/exit with Framer Motion
- ✅ **TypeScript**: Full type safety

## Usage

### Basic Usage

```typescript
import { toast } from "@b3dotfun/sdk/global-account/react";

// Success toast
toast.success("Transaction completed!");

// Error toast
toast.error("Transaction failed");

// Info toast
toast.info("Processing transaction...");

// Warning toast
toast.warning("Low balance");
```

### With Options

```typescript
// Custom duration (in milliseconds)
toast.success("Message", { duration: 5000 });

// Infinite duration (won't auto-dismiss)
toast.error("Critical error", { duration: Infinity });
```

### Manual Dismiss

```typescript
// Dismiss specific toast
const toastId = toast.success("Loading...");
toast.dismiss(toastId);

// Dismiss all toasts
toast.dismiss();
```

## Architecture

### Components

#### `ToastProvider`

Wraps the application to provide toast context. Already integrated into `B3Provider`.

```typescript
import { ToastProvider } from "@b3dotfun/sdk/global-account/react";

<ToastProvider>
  <App />
</ToastProvider>
```

#### `Toast`

Renders a single toast notification with type-specific styling and icons.

#### `ToastContainer`

Renders a list of toasts with animations. Used internally by `B3DynamicModal`.

### Context

#### `useToastContext()`

Access toast context directly in components.

```typescript
import { useToastContext } from "@b3dotfun/sdk/global-account/react";

function MyComponent() {
  const { toasts, addToast, removeToast, clearAll } = useToastContext();

  return <div>Active toasts: {toasts.length}</div>;
}
```

### Global API

#### `toast`

Global singleton API matching Sonner's interface.

**Methods:**

- `toast.success(message, options?)` - Show success toast
- `toast.error(message, options?)` - Show error toast
- `toast.info(message, options?)` - Show info toast
- `toast.warning(message, options?)` - Show warning toast
- `toast.dismiss(toastId?)` - Dismiss toast(s)

**Options:**

- `duration?: number` - Auto-dismiss duration in ms (default: 4000)

## Toast Types

| Type      | Color  | Icon      | Usage                  |
| --------- | ------ | --------- | ---------------------- |
| `success` | Green  | Checkmark | Successful operations  |
| `error`   | Red    | X         | Failed operations      |
| `info`    | Blue   | Info      | Informational messages |
| `warning` | Yellow | Warning   | Warnings               |

## Theming

Toasts automatically adapt to the theme set in `B3Provider`:

```typescript
<B3Provider theme="dark">
  {/* Toasts will use dark theme */}
</B3Provider>
```

**Light Theme:**

- Lighter backgrounds
- Darker text
- Softer borders

**Dark Theme:**

- Darker backgrounds
- Lighter text
- Glowing borders

## Integration

### In B3DynamicModal

Toasts are automatically rendered at the bottom of the modal:

```
┌─────────────────────────┐
│   Modal Content         │
│                         │
│   [Content Area]        │
│                         │
├─────────────────────────┤ ← Border separator
│   [Toast 1]             │
│   [Toast 2]             │
└─────────────────────────┘
```

The modal automatically expands to accommodate toasts.

### Position

Toasts are positioned:

- At the bottom of the modal
- Above the modal border
- Below main content
- Full width with padding

## Examples

### Success After Transaction

```typescript
const handleTransaction = async () => {
  try {
    const tx = await sendTransaction();
    toast.success(`Transaction successful! Hash: ${tx.hash}`);
  } catch (error) {
    toast.error(`Transaction failed: ${error.message}`);
  }
};
```

### Loading State

```typescript
const handleLongOperation = async () => {
  const toastId = toast.info("Processing...", { duration: Infinity });

  try {
    await longOperation();
    toast.dismiss(toastId);
    toast.success("Operation completed!");
  } catch (error) {
    toast.dismiss(toastId);
    toast.error("Operation failed");
  }
};
```

### Multiple Toasts

```typescript
// Show multiple toasts at once
toast.success("Account created");
toast.info("Sending welcome email...");
toast.warning("Complete your profile");
```

## Migration from Sonner

### Before

```typescript
import { toast } from "@b3dotfun/sdk/global-account/react";

toast.success("Success!");
```

### After

```typescript
import { toast } from "@b3dotfun/sdk/global-account/react";

toast.success("Success!"); // Same API!
```

See `MIGRATION_GUIDE_TOAST.md` for detailed migration instructions.

## Fallback Behavior

If `ToastProvider` is not in the component tree, the toast API automatically falls back to Sonner (if available) or logs to console. This ensures graceful degradation.

## Testing

```typescript
import { render, screen } from "@testing-library/react";
import { ToastProvider } from "@b3dotfun/sdk/global-account/react";
import { toast } from "@b3dotfun/sdk/global-account/react";

test("shows toast notification", async () => {
  render(
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );

  toast.success("Test message");

  // Toast will be visible in the component tree
});
```

See `__tests__/toast.test.tsx` for more examples.

## Troubleshooting

### Toasts not appearing

1. Ensure `ToastProvider` is in component tree (already done in `B3Provider`)
2. Check that modal is open (toasts only show in modal)
3. Verify theme is set correctly

### Toasts appearing outside modal

If toasts appear outside the modal, you may be:

1. Using Sonner directly instead of our toast API
2. Missing the `ToastProvider` wrapper

### Styling issues

1. Check that theme prop is passed to `B3Provider`
2. Verify Tailwind CSS is configured correctly
3. Ensure all required CSS classes are available

## API Reference

### Types

```typescript
type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  createdAt: number;
}

interface ToastOptions {
  duration?: number;
}
```

### Functions

```typescript
// Add toast
function toast.success(message: string, options?: ToastOptions): string;
function toast.error(message: string, options?: ToastOptions): string;
function toast.info(message: string, options?: ToastOptions): string;
function toast.warning(message: string, options?: ToastOptions): string;

// Remove toast
function toast.dismiss(toastId?: string): void;
```

### Hooks

```typescript
function useToastContext(): {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
};
```

## Performance

- Lightweight context-based state management
- Automatic cleanup of dismissed toasts
- No memory leaks with timeout management
- Smooth animations using Framer Motion
- Minimal re-renders with selective context usage

## Accessibility

- Toast messages use semantic colors
- Icons provide visual indicators
- Text is readable in both themes
- Close buttons are keyboard accessible
- ARIA attributes for screen readers (coming soon)

## Future Enhancements

- [ ] Queue management (limit simultaneous toasts)
- [ ] Custom actions in toasts (undo, retry, etc.)
- [ ] Progress indicators
- [ ] Sound/haptic feedback
- [ ] Persistence across navigation
- [ ] ARIA live regions for accessibility
- [ ] Custom toast components
- [ ] Position variants (top, bottom, etc.)
