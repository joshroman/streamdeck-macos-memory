# Stream Deck SDK v3 Migration

## Context

This plugin was submitted to the Elgato Marketplace on 2025-01-05 with SDK v2. Starting January 19, 2026, new plugins require SDK v3, Stream Deck 6.9+, and DRM compatibility.

## Current State

| Item | Current | Required |
|------|---------|----------|
| `SDKVersion` | 2 | 3 |
| `Software.MinimumVersion` | "6.6" | "6.9" |
| `@elgato/streamdeck` | 1.2.0 | 2.0.1 |
| Stream Deck CLI | 1.6.0 | 1.6+ ✓ |

## Migration Steps

1. **Update Node.js SDK**
   ```bash
   npm i @elgato/streamdeck@latest
   ```

2. **Update manifest.json** (`com.joshroman.macos-memory.sdPlugin/manifest.json`)
   - Change `"SDKVersion": 2` → `"SDKVersion": 3`
   - Change `"MinimumVersion": "6.6"` → `"MinimumVersion": "6.9"`

3. **Rebuild**
   ```bash
   npm run build
   ```

4. **Test locally**
   - Verify plugin loads in Stream Deck
   - Confirm all 8 actions display correctly
   - Test key press opens Activity Monitor

5. **Validate and package**
   ```bash
   streamdeck validate com.joshroman.macos-memory.sdPlugin
   streamdeck pack com.joshroman.macos-memory.sdPlugin
   ```

6. **Submit update to Maker Console**
   - URL: https://maker.elgato.com
   - Upload new .streamDeckPlugin file as version update

## DRM Compatibility Notes

The plugin should be DRM-compatible because:
- No files are written to the plugin directory at runtime
- Manifest reading is internal SDK behavior (acceptable)
- All dynamic data (SVG generation) is in-memory

## Potential Breaking Changes (SDK 1.x → 2.x)

Review the SDK changelog for any API changes. Key areas to check:
- Action registration pattern
- Event handler signatures
- Logger API changes

## Files to Modify

- `package.json` - dependency version
- `com.joshroman.macos-memory.sdPlugin/manifest.json` - SDK version, min version
- Possibly `src/` files if SDK 2.x has breaking changes

## Reference

- SDK Docs: https://docs.elgato.com/streamdeck/sdk/
- Distribution Guide: https://docs.elgato.com/streamdeck/sdk/introduction/distribution
- GitHub SDK: https://github.com/elgatosf/streamdeck
