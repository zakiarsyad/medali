---
name: clean-up
description: Use when the owner says "clean up", "tidy up", "stop everything" or "I'm done for today". Its first three steps also run quietly at the start of spec and build. Removes merged work, stops what is running, and says what is left.
---

# Clean up

## Steps

1. Look for changes in the repo folder that are not saved in a commit. On a
   work branch, save them as a commit on that branch. On `main`, stop and
   tell the owner; nothing should be changed there.
2. Switch to `main` and bring it up to date.
3. Delete each local branch whose PR is merged. Leave every other branch
   alone.
4. Stop every app, server and Docker container that Claude started.
5. Tell the owner in a few lines:
   - what was removed,
   - what was left, and why,
   - for unfinished work: which spec, which step, the PR link, and what
     is still to do, so a new session can pick it up.

When this runs quietly at the start of spec or build, do steps 1 to 3 only
and say nothing unless something was removed.

## Never

- Never delete a branch whose PR is not merged.
- Never throw away changes that are not saved in a commit.
- Never touch the `proof-pictures` branch.
- Write no handover file. The spec and the PR already hold what the next
  session needs.
