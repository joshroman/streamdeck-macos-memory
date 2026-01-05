# Stream Deck Swap Monitor - Debug Prompt

## ISSUE RESOLVED (2024-12-24)

### Root Cause
The plugin was crashing because esbuild doesn't support native TypeScript decorators (Stage 3). The `@action` decorator was being left as raw JavaScript syntax in the bundle, causing immediate crashes.

### Solution
1. Changed from decorator syntax to manual decorator application:
   ```typescript
   // Instead of:
   // @action({ UUID: "..." })
   // export class SwapMonitor extends SingletonAction { ... }

   // Use:
   class SwapMonitorBase extends SingletonAction { ... }
   export const SwapMonitor = action({ UUID: "..." })(
       SwapMonitorBase,
       { kind: "class", name: "SwapMonitor" } as ClassDecoratorContext
   );
   ```

2. Updated `tsconfig.json`:
   - `"module": "ESNext"`
   - `"moduleResolution": "bundler"`

### Key Files
- `/Users/joshroman/Projects/streamdeck/src/actions/swap-monitor.ts` - Main action code
- `/Users/joshroman/Projects/streamdeck/src/plugin.ts` - Entry point
- `/Users/joshroman/Projects/streamdeck/com.joshroman.swapmonitor.sdPlugin/bin/plugin.js` - Built output
- `/Users/joshroman/Projects/streamdeck/com.joshroman.swapmonitor.sdPlugin/manifest.json` - Plugin manifest

## Build & Test Commands
```bash
cd ~/Projects/streamdeck
npm run build
streamdeck restart com.joshroman.swapmonitor

# Check logs
tail -20 ~/Library/Logs/ElgatoStreamDeck/StreamDeck.log | grep -i swap
```

## SDK Documentation
The Stream Deck SDK `setImage()` accepts:
- File path (relative to plugin)
- SVG string (raw, no base64 needed)
- Base64-encoded image with data URI

Check Context7 for `/elgatosf/streamdeck` documentation on `setImage` usage.
