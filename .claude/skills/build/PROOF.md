# Proof

The proof is the PR's preview link. The owner tries the change there. No
pictures are taken as proof.

1. Open the PR's preview yourself first, and confirm the change works
   there. Nothing extra runs locally. If another open PR has deployed
   since, the preview's data no longer matches this PR. Build the preview
   again from the hosting page, without a new push. This uses one of the
   day's builds, so do it only when the owner is about to try the preview.
2. Cover every role the change affects, and every tab and pop-up of the
   screen.
3. Look at the preview of `main` only where "before" matters, such as a
   fix.
4. For a change with no screen, show the request and the answer, and only
   where the answer differs from `main`.
5. Sample data only. Never real people's data.
6. Proof covers this PR only.
7. If the preview is down or did not build, say so and fix that first. If
   the day's builds are used up, say so and wait for the next day. Do not
   push again to try. A PR without a working preview is not ready.

## The proof part of the approval comment

The proof goes in the approval comment, after the review result.

- The preview link.
- One line saying what was confirmed on it.
- The result of the automatic checks.
- Requests and answers go in a fold-out section.
