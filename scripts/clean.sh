# Remove all node_modules, .next, dist, .tsbuildinfo, tsconfig.tsbuildinfo
echo "Removing all node_modules, .next, dist, .tsbuildinfo, tsconfig.tsbuildinfo"
find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
find . -name '.next' -type d -prune -exec rm -rf '{}' +
find . -name 'dist' -type d -prune -exec rm -rf '{}' +
find . -name 'build' -type d -prune -exec rm -rf '{}' +
find . -name 'target' -type d -prune -exec rm -rf '{}' +
find . -name '.tsbuildinfo' -type f -prune -exec rm -rf '{}' +
find . -name 'tsconfig.tsbuildinfo' -type f -prune -exec rm -rf '{}' +

# Install dependencies
echo "Installing dependencies"
pnpm install

echo "Building SDK"
pnpm sdk:build
