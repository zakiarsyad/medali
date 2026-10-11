# Review

1. A fresh helper agent does the review, not the one that built the change.
   Give it the change, the spec, and `docs/BUILDING-RULES.md`.
2. Review only what this PR changes.
3. Check it against the spec: every "When …, then …" case is met, for every
   role affected.
4. Check it against the building rules.
5. Look for wrong results, a role seeing or changing what it should not,
   real people's data exposed, a key or password in the code, and work
   outside the spec.
6. Report only problems that matter: something wrong, unsafe, or confusing
   to a user. No opinions about style.
7. Fix what is found, then review again. The next review reads only what
   changed since the last one. Stop when a review finds nothing.
8. A problem outside this PR is not fixed here. Keep it for the hand-back,
   as a suggested new piece of work.
9. No review files. Show the findings in the chat.

## The approval comment

A short list in plain words:

- what was checked,
- what was found and fixed,
- what is left, if anything.

No "round 1, round 2". No code names or file names.
