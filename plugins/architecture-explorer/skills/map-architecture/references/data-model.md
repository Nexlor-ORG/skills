# Data model: `architecture.json`

One JSON object. `scripts/validate.cjs` enforces everything marked required and every limit below. A complete working example is `examples/lumen-desk/architecture.json`.

Ids: letters, digits, `-` and `_` only. Every id is unique across components, overview blocks, features, capabilities, functions, journeys and steps, because any of them can be cited in a chat answer. Suggested prefixes: `e-` entry, `c-` scheduled job, `s-` service, `a-` agent, `m-` model, `t-` tool, `d-` data store, `x-` external, `ov-` overview block, `f-` feature, `fn-` function, `j-` journey. Give each journey's steps their own short prefix. Do not start any id with `arch`.

Source references are repo-relative paths with an optional line: `src/App.tsx:42`.

## Top level

| Field | Required | Notes |
|---|---|---|
| `version` | no | `1` |
| `project` | yes | see below |
| `graph` | yes | `{ nodes: [], edges: [] }` |
| `flows` | yes | traced paths through the graph; may be empty |
| `notes`, `featureNotes`, `journeyNotes` | yes | arrays of `[heading, text]`; may be empty |
| `roles` | yes | at least one |
| `features` | yes | at least one |
| `userJourneys` | yes | at least one |
| `overview` | yes | see below |
| `topIntegrations` | no | display names for the Integrations list; defaults to the external components |
| `chat` | no | `{ "starters": [up to 4 questions, 70 characters each] }` shown in the empty chat |
| `stats` | no | do not write it; `build.cjs` derives it |

### `project`

| Field | Required | Notes |
|---|---|---|
| `name` | yes | product name; becomes the page title |
| `tagline` | yes | one sentence on what the product is |
| `date` | yes | scan date, `YYYY-MM-DD` |
| `summary` | no | two or three sentences on how it is built; shown on the Complete view |
| `slug` | no | |

## Components: `graph.nodes[]`

2 to 60 components.

| Field | Required | Notes |
|---|---|---|
| `id` | yes | |
| `label` | yes | at most 27 characters |
| `sub` | yes | at most 33 characters: a route, a file, a schedule |
| `kind` | yes | `entry`, `cron`, `service`, `agent`, `model`, `tool`, `store`, `external` |
| `group` | yes | domain name, such as "Billing"; used for "Also in ..." |
| `v` | yes | `ai`, `biz` or `both`: which focused view shows it. The Complete view shows all. |
| `sourceRef` | yes | main source reference |
| `refs` | no | further source references |
| `detail` | yes | what it does |
| `why` | yes | why it exists |
| `status` | no | `confirmed` (default), `documented`, `inferred` |

At least one component must have `v` of `biz` or `both`. With no `ai` or `both` component the AI tab is hidden.

## Relationships: `graph.edges[]`

At most 120. No duplicates of the same `from` and `to`. Every component appears in at least one.

| Field | Required | Notes |
|---|---|---|
| `from`, `to` | yes | component ids |
| `kind` | yes | `calls`, `reads`, `writes`, `triggers` |
| `label` | yes | what happens, about 40 characters shows fully |
| `status` | no | `confirmed` (default), `documented`, `inferred` |

Conventions: an entry point `calls` a service; a service `reads` or `writes` a store; a schedule, webhook sender or router `triggers` what it starts; an agent `calls` its model and its tools.

## Flows: `flows[]`

`{ "name", "desc", "nodes": [component ids in order] }`. Shown as "Trace a flow" buttons on the Complete view.

## Roles: `roles[]`

| Field | Required | Notes |
|---|---|---|
| `id`, `name` | yes | |
| `basis` | yes | `role` (exists in code) or `persona` (inferred) |
| `d` | yes | who this is |
| `goals`, `can`, `cannot` | yes | one sentence each |
| `entry` | yes | where they start |
| `src` | yes | at least one source reference |
| `status` | no | `partial` if the role is feature-flagged |

## Features: `features[]`

| Field | Required | Notes |
|---|---|---|
| `id`, `name` | yes | |
| `dom` | yes | product domain; features are laid out in rows by domain, in first-seen order |
| `aud` | yes | `user`, `internal` or `admin` |
| `d` | yes | what it is |
| `why` | yes | business value |
| `roles` | yes | role ids |
| `entry` | yes | entry points as text: routes, triggers |
| `rules` | no | business rules, one sentence each |
| `deps` | yes | ids of features it depends on; may be empty |
| `src` | yes | source references |
| `note` | no | implementation note, for example why it is partial |
| `subs` | yes | capabilities, at least one |

### Capabilities: `features[].subs[]`

`{ "id", "name", "d", "functions": [...] }`, at least one function.

### Functions: `features[].subs[].functions[]`

| Field | Required | Notes |
|---|---|---|
| `id` | yes | |
| `name` | yes | the real name in code: function, hook, RPC, endpoint |
| `d` | yes | what it does |
| `src` | yes | where it is defined. With `--repo`, a one-word name is checked to appear within 3 lines. |
| `nodes` | yes | component ids it runs on; at least one |
| `trig` | no | what triggers it |
| `in`, `out` | no | inputs and output, as text |
| `rules` | no | business logic, one sentence each |
| `tables` | no | tables or stores touched |
| `calls` | no | ids of other functions it calls |
| `ai` | no | id of the agent it uses; must also be in `nodes` |
| `status` | no | `implemented` (default) or `partial` |

Leave an optional field out when the code does not settle it. The page shows "Not identified".

## Journeys: `userJourneys[]`

| Field | Required | Notes |
|---|---|---|
| `id`, `name` | yes | |
| `role` | yes | the role that starts it |
| `also` | no | other role ids that can take it |
| `dom` | yes | product domain, for the domain filter |
| `outcome` | yes | what is true at the end; no closing full stop |
| `d` | yes | one or two sentences |
| `status` | no | `implemented` (default) or `partial` |
| `steps` | yes | see below |

### Steps: `userJourneys[].steps[]`

List main-path steps in order. Put a branch step directly after the step it branches from and give it `"col": 1`.

| Field | Required | Notes |
|---|---|---|
| `id` | yes | |
| `n` | yes | step name, at most 34 characters |
| `t` | yes | `action`, `screen`, `decision`, `system`, `ai`, `external`, `success`, `error` |
| `d` | yes | what happens |
| `src` | yes | source reference for the screen, check or handler |
| `f` | yes | id of the feature this step belongs to |
| `ui` | no | the screen or route |
| `fns` | no | function ids that run at this step |
| `nodes` | no | extra component ids not already implied by `fns` |
| `next` | main path | ids of the next step or steps on the same path |
| `lbl` | no | label for the `next` line, such as "Yes" |
| `alt` | no | `[[step id, label]]` alternative branches |
| `err` | no | `[[step id, label]]` error branches |
| `col` | no | `1` for a branch step; omit on the main path |

Rules: the first step is on the main path; every step is reachable from it; a `decision` has at least two exits; a `success` step has no exits; the last main-path step is a `success`; branch labels are at most 24 characters. A branch step may end the journey (no `next`) or rejoin the main path.

## Overview: `overview`

```json
{
  "groups": [["use", "Apps and scheduled jobs"], ["core", "Backend"], ["ext", "Outside services"]],
  "blocks": [{ "id": "ov-app", "col": 0, "icon": "screen", "k": "entry", "name": "Web app", "d": "...", "nodes": ["e-shell"] }],
  "links":  [{ "a": "ov-app", "b": "ov-db", "label": "What passes between them." }]
}
```

- Exactly three groups, left to right. Each column needs at least one block.
- `col`: 0, 1 or 2. Blocks are drawn top to bottom in the order listed; reorder within a column to reduce line crossings.
- `icon`: `screen`, `server`, `globe`, `bolt`, `db`, `spark`, `key`.
- `k`: a component kind; sets the icon colour.
- `name`: at most 30 characters. `d`: at most three lines of 48 characters.
- Every component belongs to exactly one block.
- `links`: one per pair of blocks whose components are related, no more and no fewer. `a` and `b` in either order. The label says what passes between them.
