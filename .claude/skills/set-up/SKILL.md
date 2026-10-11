---
name: set-up
description: Use when someone says "set up", "install" or "get me started", or the app will not start on this computer. Checks the tools this repo needs, installs what is missing, starts the app with sample data, and says what still needs the person.
---

# Set up

The goal is a computer that goes from nothing to the app running locally
with sample data.

## What the computer needs

Only these four.

1. Claude Code
2. Git
3. The GitHub command-line tool (`gh`)
4. Node.js, at the version the repo names in `.nvmrc`. It brings pnpm,
   the tool that installs the app's libraries.

Docker is not needed yet. It will be needed once the database and the file
storage arrive. Set up does not install it for now.

## Steps

1. Check each tool: is it installed, is Node.js at the version the repo
   names, is `gh` signed in. Show the result as one short list.
2. Install what is missing. Say what and why in one line, and ask first.
   Use the computer's own installer: Homebrew on a Mac, winget on Windows.
   Install Homebrew first if a Mac does not have it.
   - Node.js: if the computer already has a tool that switches Node.js
     versions, use it to install the version in `.nvmrc`. If it has none,
     install `fnm` with the computer's installer, then run `fnm install`
     in the repo folder.
   - pnpm: run `corepack enable pnpm`. Corepack comes with Node.js and
     fetches the pnpm version the repo names.
3. Walk the person through the steps only they can do, one at a time, and
   wait for each:
   - sign in to GitHub by typing `! gh auth login`,
   - type the computer password if an install asks for it.
4. Install Superpowers if it is missing:
   `claude plugin install superpowers@claude-plugins-official --scope project`.
   The repo settings turn it on but do not install it. It loads the next
   time Claude Code starts, so ask the person to restart at the end.
5. Check that Claude Code is up to date. Recent versions start in auto
   mode, where Claude works without asking permission at each step. If the
   session is not in auto mode, tell the person to press Shift+Tab until
   it says "auto". The repo cannot turn this on for them.
6. Create the local settings file from the example in the repo. A local
   run needs no real keys. The repo has no example file yet, so skip this
   step for now.
7. Install the app's libraries with `pnpm install`, then start the app
   with `pnpm dev`. The command that loads the sample data comes with
   later work, so skip that part for now.
8. Open http://localhost:3000 and confirm the page shows. Signing in as a
   sample role comes with later work, so skip that part for now.
9. Tell the person in a few lines what was installed, what works, and what
   still needs them.

## Never

- Never ask for a password or a key in the chat.
- Never install anything beyond the four tools, and what step 2 names to
  get them, without the owner's OK.
- Never change the computer's settings beyond these installs.
