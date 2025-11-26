#!/usr/bin/env node

/**
 * Widget Bundle Watcher
 * 
 * Watches the SDK bundle directory and auto-copies to demo on changes.
 * Uses Node.js fs.watch (cross-platform, no dependencies)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const projectRoot = path.resolve(__dirname, '../../..');
const sdkBundleDir = path.join(projectRoot, 'packages/sdk/bundles/widget');
const demoPublicDir = path.join(projectRoot, 'apps/widget-demo/public/widget');

// Colors
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

const log = (color, emoji, message) => {
  console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
};

// Copy function
function copyBundle() {
  try {
    // Ensure destination exists
    if (!fs.existsSync(demoPublicDir)) {
      fs.mkdirSync(demoPublicDir, { recursive: true });
    }

    // Copy all files
    const files = fs.readdirSync(sdkBundleDir);
    let copiedCount = 0;

    files.forEach(file => {
      const srcPath = path.join(sdkBundleDir, file);
      const destPath = path.join(demoPublicDir, file);
      
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      }
    });

    const timestamp = new Date().toLocaleTimeString();
    log('green', '✅', `[${timestamp}] Copied ${copiedCount} file(s)`);
  } catch (error) {
    log('red', '❌', `Copy failed: ${error.message}`);
  }
}

// Check if bundle directory exists
if (!fs.existsSync(sdkBundleDir)) {
  log('red', '❌', 'Widget bundle not found!');
  console.log('');
  log('yellow', '💡', 'Build the widget first:');
  console.log('   cd packages/sdk');
  console.log('   pnpm build:widget');
  process.exit(1);
}

// Initial copy
log('blue', '📦', 'Initial bundle copy...');
copyBundle();

console.log('');
log('yellow', '👀', 'Watching for changes...');
log('yellow', '💡', 'Press Ctrl+C to stop');
console.log('');

// Watch for changes
const watcher = fs.watch(sdkBundleDir, { recursive: false }, (eventType, filename) => {
  if (filename && filename.endsWith('.js') || filename.endsWith('.css') || filename.endsWith('.map')) {
    log('blue', '🔄', `Detected change: ${filename}`);
    
    // Debounce - wait 100ms for multiple file changes
    clearTimeout(watcher.debounceTimer);
    watcher.debounceTimer = setTimeout(() => {
      copyBundle();
    }, 100);
  }
});

// Handle errors
watcher.on('error', (error) => {
  log('red', '❌', `Watcher error: ${error.message}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  log('blue', '👋', 'Stopping watcher...');
  watcher.close();
  process.exit(0);
});

