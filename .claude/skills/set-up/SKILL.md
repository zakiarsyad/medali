---
name: set-up
description: Use when someone says "set up", "install" or "get me started", or the app will not start on this computer. Checks the tools this repo needs, installs what is missing, starts the app with sample data, and says what still needs the person.
---

# Set up

The goal is a computer that goes from nothing to the app running locally
with sample data.

## What the computer needs

Only these four. Everything else runs inside Docker at a fixed version.

1. Claude Code
2. Git
3. Docker
4. The GitHub command-line tool (`gh`)

Node.js is not needed on the computer. A developer may install it for
faster checks or editor help. If they do, it must be the version the repo
names.

## Steps

1. Check each tool: is it installed, is Docker running, is `gh` signed in.
   Show the result as one short list.
2. Install what is missing. Say what and why in one line, and ask first.
   Use the computer's own installer: Homebrew on a Mac, winget on Windows.
   Install Homebrew first if a Mac does not have it.
3. Walk the person through the steps only they can do, one at a time, and
   wait for each:
   - open Docker the first time and accept its terms,
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
   run needs no real keys.
7. Start the app and load the sample data, with the two commands the repo
   provides.
8. Open the app and sign in as one sample role to confirm it works.
9. Tell the person in a few lines what was installed, what works, and what
   still needs them.

If the repo has nothing to start yet, say so and stop after step 6.

## On Windows

Docker needs a part of Windows called WSL. Docker's installer turns it on
and may ask for a restart. After the restart, the person says "set up"
again and the steps carry on from where they stopped.

## Never

- Never ask for a password or a key in the chat.
- Never install anything beyond the four tools without the owner's OK.
- Never change the computer's settings beyond these installs.
