/**
 * B3 Widget SDK - Entry Point
 * Super simple approach - just initialize widgets
 */

import "./renderer"; // Side effect: registers widget system

// This file is intentionally minimal
// The actual widget initialization happens in renderer.ts
// which sets up window.B3Widget when loaded

export * from "./types";
