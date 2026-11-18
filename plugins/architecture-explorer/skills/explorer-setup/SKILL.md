---
name: explorer-setup
description: >
  This skill should be used when the user asks to "set up the architecture explorer",
  "check the explorer tools", "run the explorer doctor", "is the architecture explorer ready",
  or when a map-architecture script fails with a missing tool, a missing template or a Node error.
  It checks the tools the plugin depends on, explains what each is for, and fixes what it can.
metadata:
  version: "0.1.0"
---

# Set up the Architecture Explorer tools

Confirm the plugin can run end to end on this machine, and tell the user what is and is not available here.

Plugin root: `${CLAUDE_PLUGIN_ROOT}`. If that text appears unexpanded, the root is the folder two levels above this file.

## 1. Run the setup check

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.cjs"
```

It checks Node.js, the page template, that the template makes no network requests, that the design tokens match the template, and then runs the whole pipeline (validate, build, smoke test, extract, snapshot) on the sample map in a temporary folder that it removes. It installs nothing and makes no network requests.

Report the result as a short list: what passed, what failed, what was skipped.

## 2. Fix what failed

| Failure | Cause | What to do |
|---|---|---|
| `node: command not found`, or Node older than 18 | Node.js missing or old | Tell the user to install a current Node.js. Do not install it for them unless they ask. |
| Explorer template missing or markers missing | The plugin folder is incomplete or the template was edited by hand | Reinstall the plugin. If the template was edited on purpose, use the `explorer-design-system` skill. |
| Template makes network requests | Someone added a remote script, font or fetch | Remove it. The page must stay self-contained. |
| Design tokens out of step | `template/explorer.html` and `design-system/tokens.json` disagree | Use the `explorer-design-system` skill to bring them back in step. |
| Validate, build or smoke fails on the sample | A script or the template is broken | Run the failing script alone to see the full message, with `EXPLORER_DEBUG=1` for a stack trace. |

Never work around a failed check by skipping it.

## 3. Check the two things the script cannot

These depend on the app Claude is running in, not on this machine.

1. **Publishing.** Maps are published with the Artifact tool. If this session has no Artifact tool, say so: maps can still be built as a local file, but there will be no link to share.
2. **Ask Claude chat.** The chat works only on a published artifact that declares the `sample` capability, and only for viewers whose Claude plan allows it. It cannot be tested from the scripts. The first time a viewer asks a question, Claude asks them for permission, and each question uses that viewer's Claude usage.

## 4. Pictures (optional)

`snapshot.cjs --png` renders still pictures with macOS Quick Look so the layout can be looked at before publishing. On other systems the `.svg` files it writes can be opened in any browser; say that the layout check is manual there.

## 5. What Claude will ask permission for

Tell the user what to expect during a scan, so the prompts are not a surprise:

- reading and searching files in the repository (read-only);
- running the plugin's own `node` scripts;
- writing working files to a folder outside the repository;
- publishing a private artifact.

It will not ask to install anything, run the project's code, or read `.env` files, because the scan rules forbid all three.

## Tools at a glance

| Script | Use |
|---|---|
| `doctor.cjs` | this setup check |
| `validate.cjs <data> [--repo <root>]` | checks the map data; with `--repo`, that cited files and lines exist |
| `build.cjs <data> <page>` | builds the page from data |
| `smoke.cjs <page>` | opens every item and cross-link, and the chat with a stand-in for Claude |
| `snapshot.cjs <page> <dir> [--light] [--png]` | still pictures of every canvas |
| `extract.cjs <page> <data>` | recovers the data from a built or published page |
