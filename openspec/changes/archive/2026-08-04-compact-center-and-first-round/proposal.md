## Why

The first round and magic-ring symbol still occupy more of the center than the surrounding chart needs. They can be reduced together while preserving the twelve-o'clock origin, balanced first increase, seam clearance, and separator safety.

## What changes

- Reduce the magic-ring symbol radius from 6px to 5px.
- Reduce the compact numbered first-round radius from about 30.6px to about 28.6px.
- Let the first ordinary round above shaping retain a little more bounded seam room so the smaller center does not increase its ancestry drift.
- Update geometry regressions and the rendering specification.

## Impact

- Affected capability: `crochet-chart-rendering`
- Affected code: magic-ring symbol geometry, inner numbered-round sizing, round-layout tests
- No pattern syntax, settings, persistence, or release artifact changes
