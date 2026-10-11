---
name: build
description: Use when the owner says "build", "build it", "go" or "continue" for an approved spec, reports a problem with a PR made this way, or says a PR is out of date, has a conflict or needs updating. Builds the next step of the spec, reviews and fixes it, proves it works, and hands back a ready PR with its links.
---

# Build

The goal is one ready PR for the next step of an approved spec, with a PR
link and a preview link for the owner. Claude never merges.

## Steps

1. Tidy first: do steps 1 to 3 of the clean-up skill, quietly.
2. Find the spec and its next unticked step. Look in `docs/specs/` on
   `main` and in the open draft PRs; a new spec lives in its draft PR
   until step 1 is merged. If there is no spec, stop and say that "spec"
   comes first. If more than one spec has steps left, ask which one.
3. Check the other open PRs. If one already covers this step or the same
   area of the app, stop and tell the owner. If this step needs work that is not
   merged yet, stop and say which PR it waits for.
4. Tell the owner which step this is and how long it will take.
5. Switch to the branch. Step 1 uses the branch and draft PR made by spec.
   A later step gets a new branch from the latest `main`, never from
   another branch.
6. Read `docs/BUILDING-RULES.md`. Build this step only, following it and
   `CLAUDE.md`. Write the test for a rule before the rule. Use a helper
   agent for the building. Give it only the spec, this step and the rules
   it needs.
7. Tick the step in the spec.
8. Push as soon as there is something to see. A later step opens its own
   draft PR here. Write the PR description in its four parts.
9. Review and fix: follow `REVIEW.md` in this folder.
10. Take the latest `main` into the branch, so the checks and the proof
    show what `main` will look like after the merge.
11. Run the full set of checks once. Fix what fails.
12. Take the proof: follow `PROOF.md` in this folder.
13. Post the approval comment, then the proof comment.
14. Mark the PR ready.
15. Hand back to the owner, in a few lines:
    - the PR link and the preview link,
    - what to try on the preview, for each role affected,
    - how many steps of the spec are left,
    - anything out of scope, each as a suggested new piece of work.

## When something is unclear

If the spec does not answer something, stop and ask, with a suggestion. Do
not guess. Keep going with any part that does not depend on the answer.

## When the owner reports a problem

1. If it is part of this spec: fix it in the same PR. Put the PR back to
   draft, review only what changed, update the proof for the screens
   affected, update the two comments, and mark it ready again.
2. If it is outside this spec: do not fix it here. Suggest it as a new
   piece of work.

## When a PR is behind `main` or conflicts with it

1. Take the latest `main` into the branch. No rebase and no force push.
2. If there is no conflict: run the full checks. Redo the proof only for
   screens that the incoming changes also touch. Then mark the PR ready
   again.
3. If there is a conflict: keep what both changes meant to do. Never drop
   the other person's work to make the conflict go away.
4. If the two changes truly disagree, such as the same rule changed two
   ways, stop and ask the owner which one stands.
5. For a clash in database table changes, remake this PR's change file.
   Do not edit it by hand.
6. After sorting out a conflict: put the PR back to draft, run the full
   checks, review only what the merge changed, update the proof for the
   screens affected, update the two comments, and mark it ready again.

## Scope

Build only what the step says. Do not tidy, rename or improve anything
else, even when it looks wrong. List it in the hand-back as a suggested new
piece of work.
