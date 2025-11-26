#!/bin/bash

# Script to copy widget bundle from SDK to demo's public folder
# Run this after building the widget: pnpm build:widget in packages/sdk

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

SDK_BUNDLE_DIR="$PROJECT_ROOT/packages/sdk/bundles/widget"
DEMO_PUBLIC_DIR="$PROJECT_ROOT/apps/widget-demo/public/widget"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Copying B3 Widget bundle..."
echo ""

# Check if SDK bundle exists
if [ ! -d "$SDK_BUNDLE_DIR" ]; then
    echo -e "${RED}❌ Widget bundle not found at: $SDK_BUNDLE_DIR${NC}"
    echo ""
    echo "Please build the widget first:"
    echo "  cd $PROJECT_ROOT/packages/sdk"
    echo "  pnpm build:widget"
    exit 1
fi

# Create public/widget directory if it doesn't exist
mkdir -p "$DEMO_PUBLIC_DIR"

# Copy files
echo "📦 Source: $SDK_BUNDLE_DIR"
echo "📍 Destination: $DEMO_PUBLIC_DIR"
echo ""

cp -v "$SDK_BUNDLE_DIR"/* "$DEMO_PUBLIC_DIR/" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Widget bundle copied successfully!${NC}"
    echo ""
    echo "Files copied:"
    ls -lh "$DEMO_PUBLIC_DIR"
    echo ""
    echo "You can now run the demo:"
    echo "  cd $PROJECT_ROOT/apps/widget-demo"
    echo "  pnpm dev"
else
    echo -e "${RED}❌ Failed to copy widget bundle${NC}"
    exit 1
fi

