# A check that every screen and action asks who is using it

Depends on: nothing beyond what is merged
Group: Groundwork
Kind: fix, found by "App-wide audit: Groundwork"

## What we want

Every screen and every action must ask who is using the app before it
shows or changes anything. Today they all do: the audit tried each of
the 38 page addresses and each of the 16 actions other than the start
of sign-in by hand, on a local run with "Ganti peran" off, without a
sign-in and with made-up cookies, and all were refused.

But no check holds new work to this. The checks confirm that every
screen is in the permission list, and that nobody counts as signed in
without a valid sign-in where "Ganti peran" is off. A new screen or a
new action that is in the list but forgets to ask would pass every
check, and on the campus server it would be open to anyone. After this
work a check fails when that happens.

## Who it is for

Everyone who builds on this repo, and through them every person whose
data the app will hold.

## What should happen

- When a screen is added that does not go through the one place that
  checks the account and the page, then a check fails and names the
  screen.
- When an address the server answers itself, such as a file download,
  does not ask who is using it, then a check fails and names it.
- When an action that changes data is added that does not ask whether
  the account may do it before anything else, then a check fails and
  names the action.
- When the check runs on the app as merged, then it passes with no
  change to any screen or action.
- When something must work without a sign-in, then it is named in one
  short list inside the check, with the reason beside it. Today that is:
  the sign-in page, the start of "Masuk dengan Google", the address
  Google sends a person back to, "Keluar", and the two pages "Halaman
  tidak ditemukan" and "Akses ditolak". "Ganti peran" stays in that
  list only as a screen that is not found where it is off.
- When the check is tried against a made-up screen and a made-up action
  that do not ask, then it finds both, so it cannot pass by finding
  nothing.

## Not included

- Any change to what a role may see or do.
- Any change to a screen or an action that is merged.
- A check of which rows a role sees. Each area has its own.

## Decided

The issue had no open questions.

Decided while building, because the issue did not say:

1. The check reads the code of each screen, address and action. It
   does not run them. It knows the shapes the merged app uses. Code
   written in a shape it cannot read fails the check, so a new shape
   is never passed by mistake. The check is then taught the new shape
   in the same piece of work.
2. The first address of the app, which only sends each account on to
   its first page, is named in the list too. It asks who is using the
   app, but it is no page of the permission list, so it cannot go
   through the place that checks the account and the page. It shows no
   data.
3. The frame around every screen, which holds the menu, and the frame
   around the whole app are named in the list too. They are part of
   every screen, also of the sign-in page. Any other new kind of file
   among the screens fails the check until it is named in the list
   with a reason.
4. A screen or an address may read its own address before it asks who
   is using it. It may read nothing else first.
5. An action counts as asking only when the first thing it does is to
   ask whether the account may do a named action, and to refuse when
   there is no account or the account may not. An action written
   inside another file, where the check cannot see it, fails the
   check.
6. "Ganti peran" is in the list with its screen and its action. The
   check also confirms that both ask whether "Ganti peran" is on.
7. Each name in the list must still exist. A name left behind after
   its screen or action is gone fails the check.

## Steps

- [ ] 1. A check that every screen, every address the server answers
  itself and every action asks who is using it, with the short list of
  those that need no sign-in.
