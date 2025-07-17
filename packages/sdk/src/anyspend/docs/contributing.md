# Contributing to AnySpend

We welcome contributions to make AnySpend even better! This guide will help you get started with contributing to the project.

## 🤝 Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new functionality
- **Code Contributions**: Submit pull requests with improvements
- **Documentation**: Help improve our docs and examples
- **Community Support**: Help other developers in Discord

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20.15.0+
- **pnpm** (preferred) or npm/yarn
- **Git**
- **TypeScript** knowledge

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/b3.git
   cd b3
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your configuration
   vim .env.local
   ```

4. **Start Development**
   ```bash
   # Start the development server
   pnpm dev
   
   # In another terminal, build the SDK
   pnpm sdk:build --watch
   ```

### Project Structure

```
packages/sdk/
├── src/
│   ├── anyspend/           # AnySpend module
│   │   ├── components/     # React components
│   │   ├── hooks/          # React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── global-account/     # Global account module
│   └── shared/            # Shared utilities
├── docs/                  # Documentation
└── tests/                 # Test files
```

## 📝 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 2. Make Your Changes

Follow our coding standards:

```typescript
// ✅ Good: Use descriptive names
function calculateSwapQuote(fromToken: Token, toToken: Token, amount: string) {
  // Implementation
}

// ❌ Bad: Vague names
function calc(a: any, b: any, c: string) {
  // Implementation
}
```

### 3. Write Tests

```typescript
// Example test
import { render, screen } from '@testing-library/react';
import { AnySpendNFTButton } from '../components/AnySpendNFTButton';

describe('AnySpendNFTButton', () => {
  it('renders with correct NFT information', () => {
    const mockNFT = {
      name: 'Test NFT',
      price: '1000000000000000000',
      // ... other properties
    };

    render(<AnySpendNFTButton nftContract={mockNFT} />);
    
    expect(screen.getByText('Test NFT')).toBeInTheDocument();
  });
});
```

### 4. Run Tests and Linting

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type checking
pnpm type-check
```

### 5. Build and Test

```bash
# Build the SDK
pnpm sdk:build

# Test in example apps
cd examples/next-app
pnpm dev
```

## 📋 Coding Standards

### TypeScript Guidelines

1. **Use Strict Types**
   ```typescript
   // ✅ Good
   interface CreateOrderRequest {
     recipientAddress: string;
     orderType: 'swap' | 'custom';
     srcAmount: string;
   }

   // ❌ Bad
   interface CreateOrderRequest {
     recipientAddress: any;
     orderType: string;
     srcAmount: number;
   }
   ```

2. **Export Types**
   ```typescript
   // Always export types for public APIs
   export interface QuoteRequest {
     srcChain: number;
     dstChain: number;
     // ...
   }
   ```

3. **Use Generic Types**
   ```typescript
   // ✅ Good
   function createApiCall<T>(endpoint: string): Promise<T> {
     return fetch(endpoint).then(res => res.json());
   }
   ```

### React Component Guidelines

1. **Functional Components with TypeScript**
   ```tsx
   interface Props {
     nftContract: NFTContract;
     onSuccess?: (txHash: string) => void;
   }

   export function AnySpendNFTButton({ nftContract, onSuccess }: Props) {
     // Component implementation
   }
   ```

2. **Use Custom Hooks**
   ```tsx
   // Extract complex logic into hooks
   function useNFTPurchase(nftContract: NFTContract) {
     const [isPurchasing, setIsPurchasing] = useState(false);
     
     const purchase = useCallback(async () => {
       setIsPurchasing(true);
       try {
         // Purchase logic
       } finally {
         setIsPurchasing(false);
       }
     }, [nftContract]);

     return { purchase, isPurchasing };
   }
   ```

3. **Error Boundaries**
   ```tsx
   // Wrap components that might fail
   <ErrorBoundary fallback={<ErrorFallback />}>
     <AnySpendComponent />
   </ErrorBoundary>
   ```

### API Design Guidelines

1. **Consistent Response Formats**
   ```typescript
   interface ApiResponse<T> {
     data: T;
     success: boolean;
     error?: string;
   }
   ```

2. **Use Discriminated Unions**
   ```typescript
   type OrderStatus = 
     | { status: 'pending'; pendingReason: string }
     | { status: 'completed'; completedAt: string }
     | { status: 'failed'; errorDetails: string };
   ```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// Test individual functions
describe('formatTokenAmount', () => {
  it('formats wei to readable amount', () => {
    expect(formatTokenAmount('1000000000000000000', 18)).toBe('1.0');
  });

  it('handles edge cases', () => {
    expect(formatTokenAmount('0', 18)).toBe('0');
    expect(formatTokenAmount('1', 18)).toBe('0.000000000000000001');
  });
});
```

### Integration Tests

```typescript
// Test component interactions
describe('AnySpend Integration', () => {
  it('completes a swap flow', async () => {
    render(
      <AnySpendProvider>
        <AnySpend recipientAddress="0x123..." />
      </AnySpendProvider>
    );

    // Simulate user interactions
    fireEvent.click(screen.getByText('Swap'));
    
    // Wait for async operations
    await waitFor(() => {
      expect(screen.getByText('Swap completed')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests

```typescript
// Test full user flows
describe('E2E: NFT Purchase', () => {
  it('allows user to purchase NFT with crypto', async () => {
    await page.goto('/nft-marketplace');
    await page.click('[data-testid="nft-purchase-button"]');
    
    // Complete purchase flow
    await page.fill('[data-testid="amount-input"]', '0.1');
    await page.click('[data-testid="confirm-purchase"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});
```

## 📖 Documentation Standards

### Code Comments

```typescript
/**
 * Creates a quote for token swapping across chains
 * 
 * @param request - Quote request parameters
 * @param request.srcChain - Source blockchain ID
 * @param request.dstChain - Destination blockchain ID
 * @param request.amount - Amount in smallest unit (wei)
 * @returns Promise resolving to quote data
 * 
 * @example
 * ```typescript
 * const quote = await getQuote({
 *   srcChain: 1,
 *   dstChain: 8333,
 *   amount: "1000000000000000000"
 * });
 * ```
 */
export async function getQuote(request: QuoteRequest): Promise<QuoteResponse> {
  // Implementation
}
```

### README Updates

When adding new features, update relevant documentation:

1. **Component Documentation**: Add to `docs/components.md`
2. **Hook Documentation**: Add to `docs/hooks.md`
3. **Examples**: Add to `docs/examples.md`
4. **Main README**: Update feature list if applicable

## 🚀 Release Process

### Version Bumping

```bash
# Patch version (bug fixes)
pnpm version patch

# Minor version (new features)
pnpm version minor

# Major version (breaking changes)
pnpm version major
```

### Changelog

Update `CHANGELOG.md` with:

```markdown
## [1.2.0] - 2024-01-15

### Added
- New `useAnyspendTokenBalance` hook
- Support for Polygon network
- Enhanced error handling

### Changed
- Improved quote refresh logic
- Updated TypeScript definitions

### Fixed
- Fixed slippage calculation bug
- Resolved React Native build issues

### Deprecated
- `oldMethodName` will be removed in v2.0

### Breaking Changes
- Renamed `createOrder` parameter `type` to `orderType`
```

## 🐛 Bug Reports

### Good Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots/Code**
If applicable, add screenshots or code snippets.

**Environment (please complete):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - SDK Version [e.g. 1.2.0]
 - Network [e.g. mainnet, testnet]

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.

**Implementation ideas**
If you have ideas about how this could be implemented, please share them.
```

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/b3dotfun)
- **GitHub Discussions**: For technical questions
- **GitHub Issues**: For bugs and feature requests

## 🎉 Recognition

Contributors will be recognized in:

- `CONTRIBUTORS.md` file
- Release notes for their contributions
- Discord contributor role
- Annual contributor highlights

Thank you for contributing to AnySpend! 🚀 