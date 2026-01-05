# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Build plugin (TypeScript → JavaScript via esbuild)
npm run watch        # Build with file watching

streamdeck validate com.joshroman.macos-memory.sdPlugin   # Validate manifest
streamdeck pack com.joshroman.macos-memory.sdPlugin       # Package for distribution
```

## Architecture

Stream Deck plugin for monitoring macOS memory metrics using the Elgato Stream Deck SDK (`@elgato/streamdeck`).

### Source Structure

```
src/
├── plugin.ts                    # Entry point - registers all actions with Stream Deck
├── utils/
│   └── memory-stats.ts          # macOS memory data via vm_stat/sysctl commands
└── actions/
    ├── base-memory-action.ts    # Abstract base class for all metric actions
    ├── swap-monitor.ts          # Concrete action (pattern for all others)
    ├── memory-used.ts
    ├── app-memory.ts
    ├── wired-memory.ts
    ├── compressed-memory.ts
    ├── cached-files.ts
    ├── physical-memory.ts
    └── memory-selector.ts       # Custom action with Property Inspector
```

### Key Patterns

**Action Registration**: Each action extends `BaseMemoryAction` and is decorated with `@action({ UUID: "..." })`. Actions are registered in `plugin.ts` via `streamDeck.actions.registerAction()`.

**Metric Configuration**: All metrics are defined in `METRIC_CONFIGS` (memory-stats.ts) with getValue, getPercent, getColor functions. To add a new metric, add config there and create a simple action class.

**Display Rendering**: Actions generate SVG with progress rings dynamically via `generateImage()` in base class. Color thresholds (green/orange/red) are per-metric.

**Polling**: Each visible action instance polls every 2 seconds via `setInterval`, cleaned up on `onWillDisappear`.

### Plugin Output

Built JavaScript goes to `com.joshroman.macos-memory.sdPlugin/bin/plugin.js`. The `.sdPlugin` folder contains the complete plugin with manifest, images, and Property Inspector HTML.

## SDK Version Migration (Pending)

Current: SDK v2, MinVersion 6.6
Required by Jan 2026: SDK v3, MinVersion 6.9, DRM compatible

Migration checklist:
1. `npm i @elgato/streamdeck@latest`
2. Update manifest: `"SDKVersion": 3`, `"MinimumVersion": "6.9"`
3. Rebuild and test
