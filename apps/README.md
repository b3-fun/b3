## Working with Vite

### 🔍 Common Issue: Multiple Store Instances

When working with our B3 React package in Vite apps, you might encounter some puzzling behavior where state updates don't seem to work correctly across components. This usually happens because Vite's dependency optimization can create multiple instances of our shared stores.

#### What's happening? 🤔

Think of it like having multiple copies of the same radio - each one broadcasting on a slightly different frequency. When one component tries to send a message, the others might be listening to a different "frequency" and miss it entirely!

#### How to fix it ✨

Add this to your `vite.config.ts`:

```typescript
export default defineConfig({
  optimizeDeps: {
    exclude: [
      "@b3dotfun/sdk",  // Ensures single instance of our package
    ]
  }
})
```

This tells Vite to treat our package as a single unit, ensuring all components stay in sync.

#### Still having issues? 🚀

- Double-check your vite.config.ts has the exclude configuration
- Make sure you're using the same version of @b3dotfun/sdk across your app
- Verify that B3ProviderWrapper is properly set up at your app's root

Need help? Feel free to reach out to the team!

### Vite optimizing dependency, leading to store issues

When Vite optimizes dependencies, it can create multiple instances of modules through code splitting and bundling. By excluding @b3dotfun/sdk:
The package is treated as an external dependency and bundled only once
This ensures there's only one instance of the Zustand store in memory
All components (modal, sign-in, etc.) share the same store instance

For example, this happens when we import the B3 React package. Zustand or the Provider can end up having issues.
