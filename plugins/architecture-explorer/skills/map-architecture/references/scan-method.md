# Scan method

Work from the outside in, then from the product down. Record a `path:line` for every item as you go; adding them afterwards is slow and error-prone.

## Order of investigation

1. **Orientation.** Read the README, any agent instruction file (`CLAUDE.md`, `AGENTS.md`), the package manifest and the top-level folder list. Note the stack and the deployable units. Repo docs are a lead, not proof.
2. **Entry points.** Routes and pages, API endpoints, webhooks, CLI commands, queue consumers, public functions. Find the router or the framework's routing convention and enumerate from there.
3. **Scheduled work.** Cron definitions, scheduled functions, database schedulers, workflow files that run on a timer.
4. **Services.** The modules entry points call to do real work: auth and access checks, domain logic, payment, notification. Follow imports from each entry point one or two levels.
5. **Data stores.** Schemas and migrations, ORMs, key-value and file stores. Group tables into stores a person would name ("Billing subscriptions"), not one component per table.
6. **Outside integrations.** SDK imports, HTTP clients, webhook receivers, environment variable *names*. One component per provider.
7. **AI.** Search for model SDKs, model names, prompt strings, tool or function-calling definitions, MCP configuration, agent loops. For each distinct prompt-plus-purpose record an agent, the model it uses, any tools it can call, and what triggers it. If there is no AI, there are no agent, model or tool components and the AI tab hides itself.
8. **Relationships.** For each pair that interacts, one relationship with a kind (`calls`, `reads`, `writes`, `triggers`) and a short label saying what happens.
9. **Roles.** Role enums, permission checks, guards, policies. A role that exists in code has `basis: "role"`. A kind of person the product clearly serves but the code does not name (a visitor, a customer with no account) is `basis: "persona"`.
10. **Features.** Product areas a user or operator would name. Not folders. For each: capabilities (what it lets someone do) and the functions that implement each capability, with the real function name and where it lives.
11. **Journeys.** For each role, the end-to-end paths that matter: first use, the core loop, AI-assisted work, collaboration, admin, billing, recovery from errors. Trace each from the route through guards and handlers. Every decision and error branch must point at the condition in code that causes it.
12. **Overview.** Last, group every component into 8 to 16 blocks in three columns: what people and timers use, the system's own backend, outside services.

## Certainty

- `confirmed`: seen in code. The default; omit the field.
- `documented`: stated in repo docs but not traced in code. Drawn with a dashed outline.
- `inferred`: follows from other evidence. Say so in the label or detail.

For features, functions and journeys, `partial` means feature-flagged, legacy, or present but not wired in. Explain which in the description or an implementation note.

## Choosing components

- Aim for 25 to 60. Fewer than 15 usually means services were skipped; more than 60 will not validate.
- One component per thing a newcomer needs to know exists. Merge near-duplicates ("4 sync functions") and name the merge in `sub`.
- Every component needs at least one relationship. An orphan is either missing a relationship or does not belong on the map.
- `v` decides which view shows it: `ai` for AI machinery, `biz` for everything else, `both` for the few components that matter to both stories.

## Writing

The reader is someone joining the project.

- `label`: the name a teammate would say out loud. At most 27 characters.
- `sub`: where or what, in a few words: a route, a hook name, a schedule. At most 33 characters.
- `detail`: what it does, two to four sentences, in plain words. Include the one rule or guard that would surprise someone.
- `why`: the business reason it exists, one sentence.
- Relationship and link labels: what passes between the two, not "calls X".
- Step names: what happens, as the user would describe it. At most 34 characters.
- Use the same word for the same thing everywhere.
- State uncertainty where it applies, once. Do not hedge everything.

## Scan notes

Use the three notes lists (`notes`, `featureNotes`, `journeyNotes`) for what the diagrams cannot show: duplicated implementations, dead code, things the repository cannot answer (which of two webhooks is registered), and anything deliberately left out. Each note is a short heading and one or two sentences.

## Checks before writing data

- Every component, function, role and step has a source reference that you opened.
- No value from the "nothing sensitive" list is in any description.
- Each journey's main path reads as a story from first step to a success step.
- Each overview link is backed by at least one relationship between components of the two blocks (the validator enforces this both ways).
