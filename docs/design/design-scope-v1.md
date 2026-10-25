# Design scope v1, the logo palette, as applied to Nest

Nest follows the Kestrel Contributors and Staff design scope v1: the official Kestrel Collective wordmark, a palette drawn from it, two type families, and a small component set. This file is the part of that scope Nest uses. The acceptance screens (`nest-redesign-screens.zip`, fourteen captures at 1280 and 390) are kept outside git; the current captures of the real site live in `docs/screenshots/`.

## Wordmark

`site/public/kestrel-logo.png`, 36px tall in the header next to a 1px divider and the product label "Nest" in Clash Display. Never recoloured, stretched or cropped. Under 330px wide only the logo shows.

## Palette

Tokens live in `site/src/styles/tokens.css`. The raw logo cyan is never used for text.

| Token            | Value     | Use                                                              |
| ---------------- | --------- | ---------------------------------------------------------------- |
| `--brand`        | `#24C2CE` | Logo cyan: focus and progress fills, code-panel highlights. Never text. |
| `--primary`      | `#0A6E78` | Primary buttons, links, labels, stat numbers, selected states.   |
| `--primary-deep` | `#0B3A40` | The code panel and other dark surfaces.                          |
| `--primary-soft` | `#E6F6F7` | Pills, inline code, progress tracks, the 404 numerals.           |
| `--accent`       | `#E35D06` | The one large accent button, the eyebrow dot, the current stage. |
| `--accent-ink`   | `#A8460A` | Orange text: eyebrow pills, "Next" and "Skip in" tags.           |
| `--accent-soft`  | `#FCEBDD` | Eyebrow pill and the "Next" box.                                 |
| `--foreground`   | `#12262A` | Body and heading text.                                           |
| `--ink-2`        | `#35505A` | Lead paragraphs, intros, section prose.                          |
| `--muted-fg`     | `#5A6B70` | Hints, metadata, mono labels on cards.                           |
| `--background`   | `#F7F9F9` | Page background. Cards and the header are white on top of it.    |
| `--border`       | `#DFE6E7` | Hairlines, card borders. `--border-strong` `#B3C6C9` for dashed and secondary buttons. |
| `--success`      | `#2E7D5B` | The external-evidence marker only.                               |

Classic palette: `<html data-palette="classic">` switches every token to the first brand sheet (deep green `#0E5450`, orange `#E8622C`).

## Type

Clash Display 600 for the display headline (`.display`, up to 60px), page titles (`.h-page`), section statements (`.h-statement`), card titles and stat numbers. Satoshi for everything else: body 15, lead 16 to 18, small 13, never smaller. A system monospace at 11px uppercase with 0.12em tracking for labels and eyebrows, and 12 to 13px for metadata, handles and chips. Fonts load from Fontshare.

## Foundations

4px spacing base. Cards: white, 1px border, 14px radius, a 1px soft shadow, 20px padding. Radii: 6 small, 8 chips and buttons, 10 inputs and the larger buttons, 14 cards, pill for badges. Buttons: 36 small, 44 regular, 48 large; the orange accent fill is used only at the large size, where white text passes. Focus: a 2px primary outline with a 4px ring at 12%. Content column 1120px; two-column pages use a 7/5 or 8/4 split that stacks under 1000px; the header becomes a top bar with a menu sheet under 900px; 310px is the minimum width.

## Components

Header and footer, eyebrow pill, labels, buttons, cards (plain, dashed empty state, flush with head and foot), chips and pills, the three evidence markers (always a shape and a text label), avatars, person cards, stat cards, the counted-separately rows, the "Next" box, the stepper ladder (overview, and progress with done, next and to-do), the code panel, evidence rows, the feature trio, cohort cards with a progress bar, the back link and the 404 numerals. All in `site/src/styles/`.

## Accessibility

Text meets WCAG AA; cyan is decorative only. Every interactive element has a visible focus ring. Markers never rely on colour alone. Nav marks the current page with `aria-current`. Touch targets are 44px. Motion respects `prefers-reduced-motion`.
