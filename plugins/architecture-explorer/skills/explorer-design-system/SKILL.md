---
name: explorer-design-system
description: >
  This skill should be used when the user asks to "change how the architecture map looks",
  "restyle the explorer", "change the explorer colours", "add a view to the explorer",
  "add a tab to the map", "change the explorer template", "match the map to our brand",
  or when any change to template/explorer.html is needed. It holds the explorer's design
  system and the procedure for changing the shared template safely.
metadata:
  version: "0.1.0"
---

# Change the explorer's look or behaviour

Every map is built from one template, so a change here changes every map built afterwards. Treat the template as a product with a design system, not as a page to tweak.

Plugin root: `${CLAUDE_PLUGIN_ROOT}`. If that text appears unexpanded, the root is the folder two levels above this file.

## Where things are

| File | Holds |
|---|---|
| `design-system/DESIGN.md` | The design system: principles, colour roles, type, shapes, components, states, wording. Read it before any change. |
| `design-system/tokens.json` | Machine-readable colour, type, radius and spacing tokens. Must match the template; `doctor.cjs` fails if not. |
| `template/explorer.html` | The page: styles, markup, and the script that draws every view. The data goes in at the `__ARCH_JSON__` marker. |

## Rules

1. **Tokens, not values.** Colours come from the CSS custom properties on `:root`. Never write a literal colour in a component rule. A new colour is a new token, defined for dark on `:root` and for light under `:root[data-mode="light"]`, and added to `tokens.json`.
2. **Colour means kind.** Each component kind and step type has one colour, used the same way in every view. Do not reuse a kind colour for decoration.
3. **One accent.** `--accent` marks the active tab, the selected block and highlighted overview lines. Nothing else.
4. **Both themes.** Dark is the default; light must be designed, not inverted. Check both.
5. **Self-contained.** No remote scripts, fonts, images or requests. The only thing that reaches outside the page is `claude.use("sample")` for the chat.
6. **Data stays out.** Nothing about a particular repository goes into the template: no names, no copy, no special cases. If a map needs something, it becomes a field in the data model.
7. **Generic first.** A new view reads the same data shape for every repository and tolerates an empty collection.
8. **Per-map restyling is not supported.** If the user wants their brand, change the tokens for all their maps, and say that it applies to every map built from this copy of the plugin.

## Procedure for a change

1. Read `design-system/DESIGN.md`.
2. Make the change in `template/explorer.html`. Keep the markers `__TITLE__`, `__ARCH_JSON__`, `/*DATA*/` and `/*END*/` exactly once each.
3. If tokens changed, update `design-system/tokens.json` to match, and `DESIGN.md` if a rule or component changed.
4. If the data model changed, update `skills/map-architecture/references/data-model.md`, `scripts/validate.cjs`, and the sample map so it exercises the new field.
5. Run the checks:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.cjs"
```

6. Look at it in both themes. Build the sample, write pictures, and read them:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/build.cjs" "${CLAUDE_PLUGIN_ROOT}/examples/lumen-desk/architecture.json" WORK/sample.html
node "${CLAUDE_PLUGIN_ROOT}/scripts/snapshot.cjs" WORK/sample.html WORK/dark --png
node "${CLAUDE_PLUGIN_ROOT}/scripts/snapshot.cjs" WORK/sample.html WORK/light --light --png
```

7. If the change adds behaviour (a view, a filter, a panel), add it to `scripts/smoke.cjs` so it is opened on every run.
8. Bump `version` in `.claude-plugin/plugin.json` and say in one line what changed. Maps already published keep the old look until they are rebuilt.

## Adding a view

A view needs, at minimum: a tab button with a `data-view` value; a branch in the draw, filter, search, stats, breadcrumb and panel functions; an entry in the chat's context labels; cross-links to and from at least one existing view; stills in `snapshot.cjs`; coverage in `smoke.cjs`. Use the Overview view in the template as the worked example: it was added after the other five.

## What to refuse

- Loading a web font or icon set from a CDN. Use the system font stack and inline SVG.
- Animations beyond the existing opacity transitions. The page respects reduced-motion settings.
- Removing the "Not identified", dashed-outline or scan-note conventions. They are how the map stays honest about what it does not know.
