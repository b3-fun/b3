#!/bin/bash

# Widget Development Script
# Builds SDK widget, copies to demo, and optionally watches for changes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SDK_DIR="$PROJECT_ROOT/packages/sdk"
SDK_BUNDLE_DIR="$SDK_DIR/bundles/widget"
DEMO_PUBLIC_DIR="$PROJECT_ROOT/apps/widget-demo/public/widget"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to build widget
build_widget() {
    echo -e "${BLUE}🔨 Building widget SDK...${NC}"
    cd "$SDK_DIR"
    pnpm build:widget
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Widget built successfully!${NC}"
        return 0
    else
        echo -e "${RED}❌ Widget build failed!${NC}"
        return 1
    fi
}

# Function to copy bundle
copy_bundle() {
    if [ ! -d "$SDK_BUNDLE_DIR" ]; then
        echo -e "${RED}❌ Widget bundle not found at: $SDK_BUNDLE_DIR${NC}"
        return 1
    fi
    
    mkdir -p "$DEMO_PUBLIC_DIR"
    
    echo -e "${BLUE}📦 Copying bundle to demo...${NC}"
    cp -r "$SDK_BUNDLE_DIR"/* "$DEMO_PUBLIC_DIR/" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Bundle copied to: $DEMO_PUBLIC_DIR${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to copy bundle${NC}"
        return 1
    fi
}

# Function to watch and copy
watch_and_copy() {
    echo ""
    echo -e "${YELLOW}👀 Watching SDK bundle for changes...${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to stop${NC}"
    echo ""
    
    # Use fswatch if available (Mac), otherwise inotifywait (Linux), or fall back to polling
    if command -v fswatch &> /dev/null; then
        # Mac - use fswatch
        fswatch -o "$SDK_BUNDLE_DIR" | while read f; do
            echo -e "${BLUE}📦 Bundle changed, copying...${NC}"
            copy_bundle
        done
    elif command -v inotifywait &> /dev/null; then
        # Linux - use inotifywait
        while true; do
            inotifywait -r -e modify,create "$SDK_BUNDLE_DIR"
            echo -e "${BLUE}📦 Bundle changed, copying...${NC}"
            copy_bundle
        done
    else
        # Fallback - polling every 2 seconds
        echo -e "${YELLOW}⚠️  Install fswatch for better performance: brew install fswatch${NC}"
        LAST_MTIME=$(stat -f %m "$SDK_BUNDLE_DIR/b3-widget.js" 2>/dev/null || echo "0")
        
        while true; do
            sleep 2
            CURRENT_MTIME=$(stat -f %m "$SDK_BUNDLE_DIR/b3-widget.js" 2>/dev/null || echo "0")
            if [ "$CURRENT_MTIME" != "$LAST_MTIME" ]; then
                echo -e "${BLUE}📦 Bundle changed, copying...${NC}"
                copy_bundle
                LAST_MTIME=$CURRENT_MTIME
            fi
        done
    fi
}

# Main script
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}🚀 B3 Widget Development Tool${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for watch flag
WATCH_MODE=false
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    WATCH_MODE=true
fi

# Step 1: Build widget
build_widget || exit 1

echo ""

# Step 2: Copy bundle
copy_bundle || exit 1

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Ready! Start the demo server:${NC}"
echo -e "${GREEN}   cd $PROJECT_ROOT/apps/widget-demo${NC}"
echo -e "${GREEN}   pnpm dev${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Watch mode
if [ "$WATCH_MODE" = true ]; then
    watch_and_copy
fi

