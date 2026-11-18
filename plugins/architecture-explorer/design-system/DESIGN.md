# Architecture Explorer design system

The explorer is a working tool for reading a system, not a poster. Everything below serves one job: let someone who has never seen a codebase find a part, understand it, and follow it to the next part.

`tokens.json` in this folder is the machine-readable copy of the tokens. `scripts/doctor.cjs` fails if it and `template/explorer.html` disagree.

## Principles

1. **One page, six views, one vocabulary.** A component looks the same in every view. A colour, a dashed outline or a chip means the same thing wherever it appears.
2. **Colour is information.** Colour says what kind of thing an item is. It is never decoration.
3. **Detail on demand.** The canvas shows names and structure. Descriptions, rules and source references live in the details panel, one click away.
4. **Honest about gaps.** What was not traced in code is drawn differently (dashed) and what is unknown is written as "Not identified". Nothing is filled in to look complete.
5. **Calm by default.** Lines are quiet until something is hovered or selected; then only what is connected stays lit.
6. **Self-contained.** No remote fonts, scripts or images. The page works as a single file.

## Colour

Dark is the default theme. Every colour is a token defined in both dark and light.

The page decides which theme to show in this order: the viewer's pick from the Light/Dark button in the header, then their Claude theme if they set one, then their system setting. A small script at the top of the page sets `data-mode` on the root element before anything is drawn, and the light tokens live under `:root[data-mode="light"]`. The pick is remembered in the viewer's browser only. Picking the theme the page would show anyway clears the pick, so the page goes back to following Claude and the system.

### Surfaces and text

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0c0f17` | `#f4f6fb` | Page background |
| `--panel` | `#121724` | `#ffffff` | Canvas and details panel |
| `--surface` | `#182031` | `#ffffff` | Cards, blocks, chat, raised controls |
| `--line` | `#27314a` | `#d5dbe8` | Borders and dividers |
| `--fg` | `#e7eaf3` | `#161b28` | Primary text |
| `--muted` | `#8e98b0` | `#586279` | Secondary text, labels |
| `--accent` | `#7c8cff` | `#2d3fd4` | The one accent |
| `--edge` | `#5d6a8a` | `#8a94ab` | Lines at rest |
| `--edge-hi` | `#f2f4fb` | `#161b28` | Lines connected to the selection |

Neutrals lean slightly blue, towards the accent, in both themes. Do not introduce warm greys.

### Kind colours

| Token | Dark | Light | Architecture | Journeys |
|---|---|---|---|---|
| `--c-entry` | `#5aa5ff` | `#1d6bd0` | Entry points | User action |
| `--c-cron` | `#ff9a4d` | `#c25a14` | Scheduled jobs | |
| `--c-service` | `#52cc92` | `#1b8a54` | Business services | System process |
| `--c-agent` | `#b392ff` | `#7448d2` | AI agents | AI interaction; the "uses AI" dot |
| `--c-model` | `#ff7fb8` | `#c93680` | AI models | |
| `--c-tool` | `#45d3e3` | `#0c8b9c` | Agent tools | Screen |
| `--c-store` | `#f1c84c` | `#9a7300` | Data stores | Decision |
| `--c-external` | `#9ca5b8` | `#5b6578` | Outside integrations | External service |
| `--c-feat` | `#7c8cff` | `#2d3fd4` | Features, journeys | |
| `--c-cap` | `#bcd45e` | `#5f7a10` | Capabilities | |
| `--c-fn` | `#cfd6e6` | `#4a5468` | Functions | |
| `--c-ok` | `#34d399` | `#0e8a5f` | | Success |
| `--c-err` | `#ff6b6b` | `#c7362f` | | Error step, error path |

A card takes its kind colour as its border and dot, and an 11% tint of it over `--surface` as its fill. Colour is never the only signal: every card also carries its kind as text in the panel, and step types have distinct shapes.

### The accent

`--accent` is used for exactly four things: the active tab, a selected overview block, highlighted overview lines, and the outline of a panel's primary action. Using it anywhere else weakens all four.

## Type

- Text: `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Inter is used when the viewer has it; nothing is downloaded.
- Code, file paths and function names: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.

| Role | Size | Weight |
|---|---|---|
| Page title | 20px | 650 |
| Header counts | 20px, tabular figures | 650 |
| Panel title | 17px, balanced wrapping | 650 |
| Overview block title | 14px | 650 |
| Body, controls | 14px, line height 1.45 | 400 |
| Panel secondary text | 13px | 400 |
| Card label | 12.5px | 600 |
| Overview block description | 12px, 74% opacity | 400 |
| Section label | 11px uppercase, 0.08em tracking | 600 |
| Card sub-label, line label | 10.5px | 400 |

Function names on cards and in panel titles are set in the monospace face so they read as code.

## Shape and spacing

| Thing | Value |
|---|---|
| Page gutter | 16px minimum, widened for device safe areas |
| Gap between regions | 10px |
| Canvas and panel radius | 10px |
| Controls, component cards | 8px radius |
| Overview blocks | 12px radius |
| Pills and chips | fully rounded |
| Panel padding, section gap | 14px 16px, 14px |
| Details panel width | 370px; stacks under the canvas below 900px |

## Components

**Component card** (Complete, AI, Business). 220 by 50. Kind-coloured border and dot, label, one sub-label. Feature, capability and function cards are built the same way at their own sizes; feature cards add a third line of description. Dashed border: taken from documentation rather than traced, or, on features and journeys, flagged, legacy or not wired in. A small purple dot at the right: uses AI.

**Overview block.** 300 wide, height from its content. Neutral border, an icon badge tinted with the kind colour, a 14px title, up to three lines of description, and a "N components" chip when it holds more than one. Outside services use a quieter fill than the system's own blocks.

**Journey step.** 250 by 50, shaped by type: rectangle with square corners for a screen, hexagon for a decision, pill for success and error, rounded rectangle for everything else. The main path runs down the left column; branches sit in a second column beside the step they leave.

**Lines.**

| Where | Meaning | Drawn as |
|---|---|---|
| Architecture | calls | thin solid, arrowhead |
| | reads | dotted |
| | writes | thick solid |
| | triggers | dashed |
| Journeys | primary path | solid, slightly heavier |
| | alternative | dashed |
| | error | red, dotted |
| Overview | two blocks talk | right-angled, rounded corners, a dot at each end, no arrowhead |

Overview lines never pass through a block. Links that skip the middle column run over the top or under the bottom; two non-adjacent blocks in one column are joined by a loop through the gap beside them. Lane order is chosen to minimise crossings.

**Chips.** Small rounded labels. A chip with a coloured dot is a link to that item in its own view. A chip without a dot is a plain fact.

**Pills.** Filters in the toolbar, each with a count. Pressed pills take the text colour as their border.

**Details panel.** A stack of sections, each with an 11px uppercase label. Order: what it is, what it does, why, source, then connections and cross-links. Source references are monospace with a Copy button.

**Breadcrumbs.** Top-left of the canvas. A "Back to ..." button appears whenever the viewer followed a link into another view, and retraces it.

**Ask Claude.** A button at the bottom-left of the canvas opens a chat docked in that corner, 390 by up to 540, above the canvas and beside the details panel. The viewer's messages are right-aligned bubbles tinted with the accent; answers are plain text with item chips. It shows only where the page can reach Claude.

## States

| State | Treatment |
|---|---|
| Hover on a card | heavier border |
| Selected card | 3px border, stronger tint |
| Selected overview block | accent border, faint accent fill |
| Not related to the hover, selection, filter or search | 13% opacity |
| Related line | full strength; architecture lines switch to `--edge-hi`, overview lines to `--accent` |
| Keyboard focus | 2px accent outline on controls; text-colour border on cards |
| Disabled control | 40% opacity |
| Reduced motion | opacity transitions are removed |

## Wording

- Sentence case everywhere. Tab names and section labels are nouns.
- Descriptions say what something does and why it exists, in words a newcomer would use.
- Unknown values read "Not identified". Empty lists say what is absent ("No AI in this feature.").
- Counts are derived from the data and shown as plain numbers. No percentages of "implementation", no scores.
- The chat's empty state says what Claude can see and that each question uses the viewer's Claude usage.

## Do and do not

Do:

- add a token before adding a colour, in both themes;
- give a new kind of item a colour role and a text label, and a shape if colour alone would carry the meaning;
- look at still pictures in both themes after any visual change.

Do not:

- put a literal colour in a component rule;
- use gradients, glass effects, glows or drop shadows on cards (the chat and the tooltip are the only raised surfaces);
- load anything from outside the page;
- style one map differently from another.
