# Getting started with Architecture Explorer

Architecture Explorer turns a code repository into one interactive page that explains the system: its parts, how they connect, what the product does, and how people move through it. It reads the code and changes nothing.

## Your first ten minutes

1. **Install the plugin** from the `.plugin` file or plugin folder you were given, then start a new Claude session in the repository you want to map.
2. **Say "get started with the architecture explorer".** Claude checks that the tools work on your machine and offers to show you a finished sample map.
3. **Open the sample** and click around (see "Reading a map" below).
4. **Say "map the architecture of this repo".** Claude scans the code, builds the page, checks it and gives you a private link. On a large repository this takes a while.
5. **Correct it.** You know things the code does not say. Tell Claude what is wrong or missing and it rebuilds the page at the same link.

## What Claude will and will not do

| It will | It will not |
|---|---|
| Read and search files in the repository | Change, create or delete anything in the repository |
| Run the plugin's own checking scripts | Run your code, tests, builds or migrations |
| Write working files to a temporary folder outside the repository | Install anything |
| Publish a private page to your Claude account | Read `.env` files, keys or other secrets |
| | Send your code to any outside service |

You will be asked to approve file reads, the plugin's scripts and the publish step.

## Reading a map

Start on **Overview**: a handful of blocks showing the big pieces and which of them talk to each other. Hover a line to see what passes between two blocks. Click a block to see what is inside.

Then go deeper with the other tabs:

- **Complete** shows every component. Click one for what it does, why it exists, and the file and line it lives at.
- **AI** and **Business** are the same map, filtered.
- **Features & Functions** starts from what the product does and drills down to the function behind each capability.
- **User Journeys** follows each kind of user through a task, including the branches where things go wrong.

Three things to know:

- **Chips with a coloured dot are links.** They jump to that item in its own view. A "Back to ..." button at the top-left retraces your steps.
- **A dashed outline is a warning.** On a component it means "described in docs, not traced in code". On a feature or journey it means "feature-flagged, legacy or not wired in".
- **"Not identified" means the code did not settle it.** The map does not guess.

## Asking questions

**Ask Claude**, at the bottom-left of the canvas, answers questions about the system from the map and links its answers back into the views. The first time, Claude asks your permission. Each question uses your own Claude usage, and Claude sees only the map's text and your question.

Good questions: "How does a payment become an active subscription?", "Which parts would I touch to add a new email reminder?", "What can a member not do?".

## Keeping it useful

- **Update it.** Say "update the architecture map" after significant changes. The link stays the same.
- **Share it.** The page is private to you until you share it from its Share menu.
- **Trust it appropriately.** The map is a reading of the code on the scan date shown in its header. Check the cited file before relying on a detail.

## If something does not work

Say "check the explorer tools". Claude runs a setup check and tells you what is missing. The only requirement on your machine is Node.js 18 or newer.
