# Proof

1. Compare the two preview links: the preview of `main` is "before", the
   preview of this PR is "after". Both hold the same sample data. Nothing
   extra runs locally. If another open PR has deployed since, push again
   first, so the shared PR database matches this PR.
2. For a change on screen, take screenshots in pairs at laptop width
   (1440 wide): `main` on the left, this PR on the right, same page,
   same state.
3. Add one phone-size picture (390 wide) of each changed screen on this
   PR, to show it works on a phone. Split a long page into several
   pictures.
4. For a new screen there is no "before". Show the new screen only, at
   both sizes.
5. As few pictures as tell the story. No two pictures showing the same
   thing. Save the pictures to files with a script, and look only at the
   ones going into the comment, once each.
6. For a change with no screen, show the request and the answer, and only
   where the answer differs from `main`.
7. Cover every role the change affects, and every tab and pop-up of the
   screen.
8. Sample data only. Never real people's data.
9. Proof covers this PR only.
10. If there is no preview yet, or one is down, use the local setup: take
    the `main` pictures, switch to the branch, then take the branch
    pictures. Stop the app afterwards.

## Where pictures go

Pictures are never added to the PR's own commits. Put them on the
`proof-pictures` branch, in a folder named `pr-<number>/`. That branch is
never merged. Make it once, empty, if it does not exist yet.

In the comment, point each picture at the exact saved version, not at the
branch name, so it cannot change later:

`https://github.com/<owner>/<repo>/blob/<commit id>/pr-<number>/<file>?raw=true`

## The proof comment

- One line saying what was run.
- Each picture gets a short title of about 12 words.
- Pictures sit in a table inside a fold-out section: `main` | this PR for
  the pairs, one column for the phone pictures.
- Requests and answers go in their own fold-out section.
