---
name: set-up
description: Use when someone says "set up", "install" or "get me started", or the app will not start on this computer. Checks the tools this repo needs, installs what is missing, starts the app with sample data, and says what still needs the person.
---

# Set up

The goal is a computer that goes from nothing to the app running locally
with sample data.

## What the computer needs

Only these five.

1. Claude Code
2. Git
3. The GitHub command-line tool (`gh`)
4. Node.js, at the version the repo names in `.nvmrc`. It brings pnpm,
   the tool that installs the app's libraries.
5. Docker, which runs the database. Any app that runs Docker works, such
   as Docker Desktop or OrbStack. If there is none, install Docker
   Desktop.

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
   - Docker: Docker Desktop, with the computer's installer. Open it once
     so that it runs.
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
6. Create the local settings file: copy `.env.example` to `.env.local`,
   and fill in each value with the local one written above it in the
   example. A local run needs no real keys.
7. Install the app's libraries with `pnpm install`. Then run
   `pnpm db:setup`: it starts the database in Docker, brings its tables up
   to date, and fills it with sample data. Filling rebuilds the tables and replaces all data in
   the local database with the sample data, so on a computer that already
   has data, ask first. Then start the app with `pnpm dev`; it starts the
   database too, and brings its tables up to date.
8. Open http://localhost:3000 and confirm the page shows with the menu.
   Show the person "Ganti peran" under "Masuk sebagai" in the side menu:
   it switches between the sample accounts, one per role.
9. Tell the person in a few lines what was installed, what works, and what
   still needs them.

## Never

- Never ask for a password or a key in the chat.
- Never install anything beyond the five tools, and what step 2 names to
  get them, without the owner's OK.
- Never change the computer's settings beyond these installs.
