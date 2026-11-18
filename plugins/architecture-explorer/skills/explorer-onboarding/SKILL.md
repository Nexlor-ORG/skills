---
name: explorer-onboarding
description: >
  This skill should be used when the user asks to "get started with the architecture explorer",
  "onboard me to the architecture explorer", "how do I use the architecture explorer",
  "show me a demo map", "what does this plugin do", or has just installed the plugin and asks
  what to do next. It walks a new user through a first run: a setup check, the sample map,
  how to read a map, and mapping their own repository.
metadata:
  version: "0.1.0"
---

# Onboard a new user

Take someone from "just installed" to a published map of their own repository. Keep it conversational and short. One step at a time; do not paste this whole guide at them.

Plugin root: `${CLAUDE_PLUGIN_ROOT}`. If that text appears unexpanded, the root is the folder two levels above this file.

## Step 1: Say what it is, in three sentences

The plugin reads a code repository without changing it and builds one interactive page that explains the system: what the parts are, how they connect, what the product does, and how people move through it. The page can be shared as a private link, and viewers can ask Claude questions about it. Nothing in the repository is run, installed or modified.

## Step 2: Check the tools

Run the setup check and report it in one or two lines. On any failure, switch to the `explorer-setup` skill and come back.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/doctor.cjs"
```

## Step 3: Offer the sample map

Ask whether they want to see a finished map first. If yes, build the sample (a made-up help desk product) in a working folder outside any repository:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/build.cjs" "${CLAUDE_PLUGIN_ROOT}/examples/lumen-desk/architecture.json" WORK/lumen-desk.html
```

Publish it with the Artifact tool (`capabilities: {"sample": {}}`, `icon: "map"`) and give them the link. Say that it is sample data. If there is no Artifact tool, give the local file path instead and say there is no link.

## Step 4: Show how to read a map

Point at these, briefly, in this order:

| Tab | What it answers |
|---|---|
| Overview | What are the big pieces, and which talk to each other? Start here. |
| Complete | Every component and relationship. Click one to see what it does, why it exists and where it lives in the code. |
| AI | Only the AI machinery: agents, models, tools. Hidden when a system has no AI. |
| Business | Everything except the AI machinery. |
| Features & Functions | What the product does, down to the function and file behind each capability. |
| User Journeys | How each kind of user gets something done, step by step, with the branches. |

Then the three habits worth forming:

- **Click through.** Anything shown as a chip is a link to that item in its own view, with a Back button.
- **Dashed outline** means "from docs, not traced in code" on components, and "flagged, legacy or not wired in" on features and journeys.
- **Ask Claude** (bottom-left of the canvas) answers from the map only. It asks permission the first time and uses the viewer's own Claude usage.

## Step 5: Map their repository

Ask which repository. Then hand over to the `map-architecture` skill. Before starting, tell them:

- it is read-only and runs none of their code;
- it takes a while on a large repository, and the first result is a draft worth correcting;
- the published page is private until they share it from the page's Share menu.

## Step 6: After the first map

Offer, do not push:

- **Correct it.** They know things the code does not say. Corrections go into the data and the page is rebuilt.
- **Keep it current.** "Update the architecture map" rescans what changed and republishes to the same link.
- **Share it.** Sharing is done by them, from the artifact's Share menu. Teammates can use the plugin's `ONBOARDING.md` to get going.

## Tone

Plain language. Do not explain the file format, the scripts or the validation rules unless asked. If they ask what could go wrong, be direct: the map is only as good as the scan, anything marked inferred is a best reading, and the layout is checked from still pictures rather than a live browser.
