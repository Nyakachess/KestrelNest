# 8. Visual system v2: the logo palette

Status: accepted, 2026-10-25

## Context

The first site lifted its styles from the early design pages, which used the pre-logo brand sheet. Kestrel's own product moved to a visual system built around the official wordmark (design scope v1), and the Nest redesign screens were drawn in it.

## Decision

Nest adopts design scope v1 as applied in `docs/design/design-scope-v1.md`: the wordmark in the header, the logo palette as CSS tokens with the first brand sheet behind `data-palette="classic"`, Clash Display and Satoshi, and the component set in `site/src/styles/`. The raw logo cyan is never used for text, and the orange fill appears on one large button per page at most.

## Consequences

- Token names from the first design remain as aliases, so a page that still uses them renders in the new palette.
- The acceptance screens are kept outside git; `docs/screenshots/` holds captures of the real site and is regenerated when the site changes.
- A page is done when it matches the screens at 1280 and still works at 390 and 310.
