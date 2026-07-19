## Why

The next-round marker (added to help crocheters find the first stitch of the next round) currently always renders in the theme's accent color via `.crochet-weaver-next-round-marker { color: var(--color-accent) }`. That color is shared with the increase/decrease highlight and is not guaranteed to stand out against every Obsidian theme, and users have no way to pick a color that is easiest for them to spot while working a chart. Making the marker color a dedicated setting lets each user pick a color that reads clearly for them.

## What Changes

- Add a `nextRoundMarkerColor` setting (hex color) to `CrochetWeaverSettings`, with its own color-picker control in the settings tab, localized name/description in all supported languages.
- Resolve `nextRoundMarkerColor` into `RenderOptions` (global setting only, same precedence pattern as `showNextRoundMarker` — no per-chart frontmatter override) and use it as the marker's stroke color at render time instead of the shared `currentColor`/accent class.
- Normalize malformed persisted values for `nextRoundMarkerColor` (invalid hex) back to the default.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `crochet-chart-rendering`: the next-round marker now renders using a dedicated, user-configurable color setting instead of the shared accent color.

## Impact

- Affected source areas: `src/settings-data.ts`, `src/settings.ts`, `src/i18n.ts`, `src/types.ts`, `src/options.ts`, `src/render.ts`, `styles.css`.
- Affected Obsidian surfaces: plugin settings tab (new color picker control) and `data.json` persisted settings shape.
- Affected tests: `tests/settings.test.ts`, `tests/options.test.ts`, `tests/render.test.ts`, `tests/i18n.test.ts`.
- No new runtime dependencies. Not a breaking change for existing pattern syntax; existing charts keep rendering, only the marker's default color changes from theme-accent to a fixed default that the user can override.
