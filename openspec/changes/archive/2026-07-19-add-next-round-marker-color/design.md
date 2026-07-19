## Context

`showNextRoundMarker` (global setting, no frontmatter override — see `crochet-chart-rendering` spec) controls whether `src/layout/round.ts` attaches a `NextRoundMarker` to the `LayoutResult`. `src/render.ts` draws that marker as an SVG `<path>` with `stroke="currentColor"` and class `crochet-weaver-next-round-marker`; `styles.css` sets `color: var(--color-accent)` on that class, so the marker always matches the Obsidian theme's accent color — the same color used for `highlightIncDec`. There is no way to change just the marker's color.

This touches the settings model (`settings-data.ts`), the settings UI (`settings.ts`), translations (`i18n.ts`), shared types (`types.ts`), option resolution (`options.ts`), and rendering (`render.ts`), so it is cross-cutting even though each individual edit is small.

## Goals / Non-Goals

**Goals:**
- Let a user pick a dedicated color for the next-round marker from the plugin settings tab.
- Keep the same global-only precedence `showNextRoundMarker` already uses (no per-chart frontmatter override), so the two settings behave consistently.
- Normalize malformed persisted values the same way every other setting is normalized in `normalizeSettings`.

**Non-Goals:**
- No per-chart frontmatter override for the color (mirrors the existing `showNextRoundMarker` restriction; keeping both marker-related settings global avoids surprising per-chart color drift).
- No change to marker shape, position, or the `showNextRoundMarker` on/off behavior.
- No change to `highlightIncDec` / inc-dec accent coloring.

## Decisions

- **Store the color as a settings string, apply it as an SVG presentation attribute.** `RenderOptions` gains `nextRoundMarkerColor: string`; `render.ts` sets `marker.setAttribute('stroke', options.nextRoundMarkerColor)` instead of relying on `currentColor`. An explicit `stroke` attribute is simpler to test and reason about than threading a CSS custom property through `styles.css`, and matches how `strokeWidth` is already passed as an explicit attribute. The `.crochet-weaver-next-round-marker` CSS color rule is removed since it no longer has any effect once `stroke` is set explicitly.
- **Use Obsidian's built-in `addColorPicker`.** `settings.ts` already builds controls with the `Setting` API (`addToggle`, `addDropdown`); `addColorPicker` is the equivalent for hex colors, so no new UI dependency is needed. Rejected: a text input for arbitrary CSS color — a picker is friendlier for non-technical users and constrains input to valid hex.
- **Add a `color` control type to `CrochetSettingDefinition`.** `SETTING_DEFINITIONS`/`getLocalizedSettingDefinitions` currently only model `dropdown` and `toggle` controls (used for Obsidian's settings search indexing). A `color` variant is added alongside them for consistency, even though `settings.ts` builds the actual color-picker control directly (matching how the existing toggle/dropdown controls are both declared in `settings-data.ts` and built in `settings.ts`).
- **Default value.** Default to a fixed, distinctive hex (`#e8590c`, a warm orange) rather than trying to resolve the user's current theme accent at settings-load time. Existing users will see the marker's default color change from theme-accent to this fixed orange after upgrading — an accepted, minor visual change, and the whole point of the new setting is that the marker's color is no longer tied to the theme accent so it can be tuned independently for visibility.
- **No frontmatter override.** Kept consistent with `showNextRoundMarker`'s existing "global only" rule (see spec scenario "Next round marker setting resolution") rather than introducing a new asymmetry between the two marker settings.

## Risks / Trade-offs

- [Visual change on upgrade: marker color changes from theme-accent to a fixed default] → Mitigation: the new color is user-editable immediately in settings; the change is additive (no data loss) and documented in the proposal.
- [Invalid/malformed persisted hex value] → Mitigation: `normalizeSettings` validates with a `^#[0-9a-fA-F]{6}$` check and falls back to the default, matching the pattern used for every other setting.
