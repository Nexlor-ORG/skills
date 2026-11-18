# NEXLOR skills

Claude plugins and skills maintained by NEXLOR. Each plugin lives in its own folder under `plugins/`.

| Plugin | What it does |
|---|---|
| [architecture-explorer](plugins/architecture-explorer) | Scans a code repository read-only and builds an interactive architecture map with an Ask Claude chat |

## Installing in Claude Code

This repository is a plugin marketplace. It is private, so you need access to it on GitHub first.

```
/plugin marketplace add Nexlor-ORG/skills
/plugin install architecture-explorer@nexlor-skills
```

To pick up a new version later:

```
/plugin marketplace update nexlor-skills
```

## Adding a plugin

1. Create `plugins/<plugin-name>/` with a `.claude-plugin/plugin.json` and its `skills/`.
2. Add an entry for it to `.claude-plugin/marketplace.json`.
3. Run `claude plugin validate .` from the repository root, then `claude plugin validate plugins/<plugin-name>`.
