# Testing Custom Currencies

## Quick Test

The `CurrencySelector` component now properly reacts to custom currencies being added. Here's how to test:

### Option 1: Use the Debug Panel (Easiest)

Add the debug panel to your app temporarily:

```tsx
import { CurrencyDebugPanel } from '@b3dotfun/sdk/shared/react/stores/debug-currency';

function YourApp() {
  return (
    <>
      {/* Your app content */}
      <CurrencyDebugPanel />
    </>
  );
}
```

The debug panel will appear in the bottom-right corner with buttons to:
- Add BTC currency
- Add GOLD currency
- View all currencies
- See exchange rates
- Monitor actions in real-time

### Option 2: Use the Quick Test Button

Even simpler - just add this button:

```tsx
import { QuickCurrencyTest } from '@b3dotfun/sdk/shared/react/stores/debug-currency';

function YourApp() {
  return (
    <>
      {/* Your app content */}
      <QuickCurrencyTest />
    </>
  );
}
```

Click the button to add BTC, then check your CurrencySelector dropdown!

### Option 3: Add Currencies Programmatically

In your app initialization:

```tsx
import { useCurrencyStore } from '@b3dotfun/sdk/shared/react/stores/currencyStore';

// At app startup or in a useEffect
function initCurrencies() {
  const store = useCurrencyStore.getState();
  
  store.addCurrency({
    code: 'BTC',
    symbol: '₿',
    name: 'Bitcoin',
    showSubscripts: true,
  });
  
  store.setExchangeRate('BTC', 'USD', 50000);
  store.setExchangeRate('BTC', 'B3', 10000);
}

// Call it
initCurrencies();
```

### Option 4: Browser Console

Open your browser console and run:

```javascript
// Get the store
const store = window.__ZUSTAND_STORE__;

// Or directly access
const { useCurrencyStore } = await import('@b3dotfun/sdk/shared/react/stores/currencyStore');
const store = useCurrencyStore.getState();

// Add a currency
store.addCurrency({
  code: 'BTC',
  symbol: '₿',
  name: 'Bitcoin',
  showSubscripts: true,
});

store.setExchangeRate('BTC', 'USD', 50000);

// Check it was added
console.log('All currencies:', store.getAllCurrencies());
console.log('Custom currencies:', store.customCurrencies);
```

## What to Look For

After adding a currency, you should see:

1. **In the CurrencySelector dropdown:**
   - A separator line after the built-in currencies
   - Your custom currencies listed below (e.g., "Bitcoin" with "₿" symbol)

2. **In the console:**
   ```javascript
   store.getAllCurrencies()
   // Should include: [..., 'BTC', 'GOLD', ...]
   
   Object.keys(store.customCurrencies)
   // Should show: ['BTC', 'GOLD', ...]
   ```

3. **When selected:**
   - Values should convert based on your exchange rates
   - The currency symbol should display correctly

## Troubleshooting

### Currency not showing in selector?

1. Check the store state:
   ```javascript
   console.log(useCurrencyStore.getState().customCurrencies);
   ```

2. Make sure the component is re-rendering (it should automatically with proper selectors)

3. Check localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('currency-storage'))
   ```

### Exchange rates not working?

1. Check if rates were set:
   ```javascript
   const store = useCurrencyStore.getState();
   console.log('BTC → USD:', store.getExchangeRate('BTC', 'USD'));
   console.log('USD → BTC:', store.getExchangeRate('USD', 'BTC')); // Should be inverse
   ```

2. Use the `useCurrencyConversion` hook:
   ```tsx
   const { getExchangeRate, formatCurrencyValue } = useCurrencyConversion();
   console.log('Rate:', getExchangeRate('BTC', 'USD'));
   console.log('Formatted:', formatCurrencyValue(1000));
   ```

## Key Fix Applied

The `CurrencySelector` component was updated to use **individual state selectors** instead of destructuring:

**Before (wouldn't react to changes):**
```tsx
const { customCurrencies } = useCurrencyStore();
```

**After (properly reactive):**
```tsx
const customCurrencies = useCurrencyStore(state => state.customCurrencies);
```

This ensures Zustand properly subscribes to changes in the nested `customCurrencies` object.

## Files for Testing

- `packages/sdk/src/shared/react/stores/debug-currency.tsx` - Debug UI components
- `packages/sdk/src/shared/react/stores/test-custom-currency.ts` - Test functions
- `packages/sdk/src/shared/react/stores/example-usage.tsx` - Full examples

## Clean Up After Testing

```tsx
const store = useCurrencyStore.getState();
store.removeCurrency('BTC');
store.removeCurrency('GOLD');

// Or clear localStorage
localStorage.removeItem('currency-storage');
```
