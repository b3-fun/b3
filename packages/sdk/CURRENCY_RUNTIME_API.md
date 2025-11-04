# Runtime Currency Registration API

## Overview

The currency system now supports adding custom currencies at runtime with configurable exchange rates. This allows applications to:

- Add custom tokens, game currencies, or any other currency types dynamically
- Set exchange rates between any two currencies
- Use the same formatting and conversion infrastructure for all currencies
- Persist custom currencies and rates across page reloads

## Key Changes

### Store Changes (`currencyStore.ts`)

1. **New Types:**
   - `CurrencyMetadata`: Defines properties for custom currencies (symbol, name, formatting rules)
   - `ExchangeRate`: Represents a conversion rate between two currencies

2. **New State Properties:**
   - `customCurrencies`: Map of custom currency codes to their metadata
   - `customExchangeRates`: Map of currency pairs to exchange rates

3. **New Methods:**
   - `addCurrency(metadata)`: Register a new currency
   - `removeCurrency(code)`: Remove a custom currency
   - `setExchangeRate(from, to, rate)`: Set exchange rate (automatically creates inverse)
   - `getExchangeRate(from, to)`: Get exchange rate between currencies
   - `getAllCurrencies()`: Get all available currencies (built-in + custom)

4. **New Helper Functions:**
   - `getCurrencySymbol(currency)`: Works for both built-in and custom currencies
   - `getCurrencyName(currency)`: Works for both built-in and custom currencies
   - `getCurrencyMetadata(currency)`: Get full metadata for custom currency

### Hook Changes (`useCurrencyConversion.ts`)

1. **Enhanced Rate Resolution:**
   - Checks custom exchange rates first
   - Falls back to Coinbase API rates
   - Supports indirect conversions through base currency

2. **New Return Values:**
   - `getExchangeRate(from, to)`: Get exchange rate between any two currencies
   - `customCurrencies`: Access to all registered custom currencies

3. **Custom Currency Formatting:**
   - Respects `decimals`, `prefixSymbol`, and `showSubscripts` settings
   - Applies correct symbol positioning

### Component Changes (`CurrencySelector.tsx`)

- Updated to display both built-in and custom currencies
- Custom currencies appear in a separate section
- Uses new helper functions for display

## API Reference

### Adding a Currency

```typescript
interface CurrencyMetadata {
  code: string;              // Currency code (e.g., "BTC")
  symbol: string;            // Display symbol (e.g., "₿")
  name: string;              // Human-readable name (e.g., "Bitcoin")
  prefixSymbol?: boolean;    // true for "$100", false for "100 BTC"
  decimals?: number;         // Fixed decimals (undefined = smart formatting)
  showSubscripts?: boolean;  // Enable 0.0₃45 notation for small values
}

// Add a currency
useCurrencyStore.getState().addCurrency({
  code: 'BTC',
  symbol: '₿',
  name: 'Bitcoin',
  showSubscripts: true,
  decimals: 8,
});
```

### Setting Exchange Rates

```typescript
// Set rate: 1 BTC = 50000 USD
useCurrencyStore.getState().setExchangeRate('BTC', 'USD', 50000);

// Inverse rate (1 USD = 0.00002 BTC) is automatically set
```

### Using Custom Currencies

```typescript
const { 
  formatCurrencyValue, 
  getExchangeRate,
  customCurrencies 
} = useCurrencyConversion();

// Format a value (automatically converts based on selected currency)
const formatted = formatCurrencyValue(1000);

// Get specific exchange rate
const rate = getExchangeRate('BTC', 'USD'); // 50000

// Switch to custom currency
useCurrencyStore.getState().setSelectedCurrency('BTC');
```

## Exchange Rate Resolution Priority

1. **Custom Rates** (highest priority)
   - Exact match in `customExchangeRates`
   
2. **API Rates** (from Coinbase)
   - Direct conversion from base currency
   
3. **Indirect Conversion**
   - Convert through base currency: A → Base → B

4. **Same Currency**
   - Always returns rate of 1

## Persistence

All custom currencies and exchange rates are automatically persisted to localStorage under the key `currency-storage` (version 3).

## Migration from Previous Versions

The store version has been incremented to 3. Existing users will have their preferences migrated automatically, but custom currencies will need to be re-registered on app startup.

## Example Use Cases

### Game Currency System

```typescript
// Initialize on app startup
function initializeGameCurrencies() {
  const store = useCurrencyStore.getState();
  
  store.addCurrency({
    code: 'GOLD',
    symbol: '🪙',
    name: 'Game Gold',
    decimals: 0,
  });
  
  store.addCurrency({
    code: 'GEM',
    symbol: '💎',
    name: 'Gems',
    decimals: 0,
  });
  
  // 100 Gold = 1 USD
  store.setExchangeRate('GOLD', 'USD', 0.01);
  
  // 1 Gem = 1 USD
  store.setExchangeRate('GEM', 'USD', 1.0);
}
```

### Cryptocurrency Exchange

```typescript
function addCryptoTokens() {
  const store = useCurrencyStore.getState();
  
  // Add Bitcoin
  store.addCurrency({
    code: 'BTC',
    symbol: '₿',
    name: 'Bitcoin',
    showSubscripts: true,
  });
  
  // Add Dogecoin
  store.addCurrency({
    code: 'DOGE',
    symbol: 'Ð',
    name: 'Dogecoin',
    decimals: 2,
  });
  
  // Set rates
  store.setExchangeRate('BTC', 'USD', 50000);
  store.setExchangeRate('DOGE', 'USD', 0.08);
}
```

### Dynamic Rate Updates

```typescript
// Fetch and update rates from your API
async function updateRates() {
  const response = await fetch('/api/exchange-rates');
  const rates = await response.json();
  
  const store = useCurrencyStore.getState();
  
  for (const [from, toRates] of Object.entries(rates)) {
    for (const [to, rate] of Object.entries(toRates)) {
      store.setExchangeRate(from, to, rate);
    }
  }
}
```

## Testing

All TypeScript types are properly validated. Run type-check with:

```bash
cd packages/sdk && pnpm tsc --noEmit
```

## Files Modified

- `packages/sdk/src/shared/react/stores/currencyStore.ts`
- `packages/sdk/src/shared/react/hooks/useCurrencyConversion.ts`
- `packages/sdk/src/shared/react/components/CurrencySelector.tsx`

## Files Added

- `packages/sdk/src/shared/react/stores/README-CUSTOM-CURRENCIES.md` (User documentation)
- `packages/sdk/src/shared/react/stores/example-usage.tsx` (Code examples)
- `packages/sdk/CURRENCY_RUNTIME_API.md` (This file)
