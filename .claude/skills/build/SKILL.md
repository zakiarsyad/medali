---
name: build
description: Use when the owner says "build", "build it", "go" or "continue" for an approved spec, reports a problem with a PR made this way, or says a PR is out of date, has a conflict or needs updating. Builds the whole spec, reviews and fixes it, proves it works, and hands back a ready PR with its links.
---

# Build

The goal is one ready PR for an approved spec, with a PR link and a preview
link for the owner. Claude never merges.

## Steps

1. Tidy first: do steps 1 to 3 of the clean-up skill, quietly.
2. Find the spec. Look in `docs/specs/` on `main` and on the pushed
   branches; a new spec lives on its branch until its PR is merged. If
   there is no spec, stop and say that "spec" comes first. If more than
   one spec has steps left, ask which one.
3. Check the other branches and the open PRs. If one already covers the
   same area of the app, stop and tell the owner. If this spec needs work
   that is not merged yet, stop and say what it waits for.
4. Tell the owner which spec this is and how long it will take.
5. Switch to the branch made by spec.
6. Read `docs/BUILDING-RULES.md`. Build every step of the spec, in order,
   following it and `CLAUDE.md`. Write the test for a rule before the
   rule. Use a helper agent for the building. Give it only the spec and
   the rules it needs.
7. Make one commit per step. The commit that does a step ticks it in the
   spec.
8. Review and fix: follow `REVIEW.md` in this folder. Push no code until a
   review finds nothing more.
9. Take the latest `main` into the branch, so the checks and the proof
   show what `main` will look like after the merge.
10. Run the full set of checks once. Fix what fails.
11. Push, and open the PR as a draft. Write the PR description in its four
    parts.
12. Take the proof: follow `PROOF.md` in this folder.
13. Post the approval comment: the review result, then the proof.
14. Mark the PR ready.
15. Hand back to the owner, in a few lines:
    - the PR link and the preview link,
    - what to try on the preview, for each role affected,
    - anything out of scope, each as a suggested new piece of work.

## When something is unclear

If the spec does not answer something, stop and ask, with a suggestion. Do
not guess. Keep going with any part that does not depend on the answer.

## When the owner reports a problem

1. If it is part of this spec: fix it in the same PR. Put the PR back to
   draft, review only what changed, update the proof for the screens
   affected, update the approval comment, and mark it ready again.
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
   screens affected, update the approval comment, and mark it ready again.

## Scope

Build only what the spec says. Do not tidy, rename or improve anything
else, even when it looks wrong. List it in the hand-back as a suggested new
piece of work.
