echo "Removing all local build artifacts"
find . -name 'node_modules' -type d -prune -exec rm -rf {} +
find . -name '.turbo' -type d -prune -exec rm -rf {} +
find . -name '.next' -type d -prune -exec rm -rf {} +
find . -name 'dist' -type d -prune -exec rm -rf {} +
find . -name 'build' -type d -prune -exec rm -rf {} +
find . -name 'target' -type d -prune -exec rm -rf {} +
find . -name '.tsbuildinfo' -type f -delete
find . -name 'tsconfig.tsbuildinfo' -type f -delete

# Install
echo "Installing dependencies"
pnpm install

# Build SDK
echo "Building SDK"
pnpm sdk:build
