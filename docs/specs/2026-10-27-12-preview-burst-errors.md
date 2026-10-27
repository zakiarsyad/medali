# Preview of main still errors when many people open a page at once

Depends on: nothing
Group: Groundwork
Kind: fix, found while finishing "Preview errors when many people open a page at once"

## What we want

The change for "Preview errors when many people open a page at once" is
merged: on both previews each copy of the app keeps at most five
database connections, closes idle ones after 10 seconds, and uses the
database's shared-connection address. Still, when twenty requests at
once are sent to a main screen of the preview of `main`, part of them
get the error screen, and right after, one person at a time can get it
too. So the cause guessed there was not the whole cause. The app should
keep working, and answer within about 1 second, with twenty requests at
once, as the launch audit asks.

Seen on 2026-10-27 on the preview of `main`, right after the merge
built, signed in as the sample Kepala Unit, twenty requests at once to
each screen, two rounds:

- Round 1: Dashboard, Penilaian karakter, Pengaturan and Asrama: 20 of
  20 got the page. Dashboard's middle answer took 1.7 seconds.
- Round 2: Penilaian karakter 19 of 20, Asrama 5 of 20; the others got
  the error screen. Dashboard and Pengaturan 20 of 20.
- Right after, a single request to Penilaian karakter got the error
  screen.
- On a local computer the same bursts got the page every time.

## Who it is for

Everyone who uses the preview, and the owner, who tries merged work there.

## What should happen

- When twenty requests at once are sent to the main screen of each area
  of the preview of `main`, signed in, two rounds, then every one gets
  the page and none the error screen. Confirmed by a small script run
  once after the merge.
- When those twenty requests are sent, then the middle one is answered
  within about 1 second, Dashboard included.
- When one person opens a page right after such a burst, then it opens
  normally.
- When the app runs on the campus server, then it behaves as today.

## Not included

- A paid hosting or database plan.
- Data the size of the real campus.
- Any change to what a screen shows.
- Undoing the connection change already merged, unless the cause found
  shows it does harm.

## Decisions

1. The cause. The app's production build was run on this computer with
   the settings of the preview of `main`, at most five connections that
   close when idle, first straight to the database and then through a
   shared-connection pool of the same kind the database service uses.
   Two rounds of twenty requests to Dashboard, Penilaian karakter,
   Pengaturan and Asrama got the page every time, so the error does not
   show on this computer. The hosting's own logs could not be read from
   here. On the preview of `main` the same bursts gave:
   - Dashboard 11 and 2 of 20, Penilaian karakter 13 and 3 of 20: the
     rest an error of the app itself, after 0.3 to 1.5 seconds, from
     many copies of the app at once. Pengaturan and Asrama 20 of 20.
   - Five requests at once to Dashboard or Penilaian karakter: one or
     two of five failed.
   - Forty requests at once to Pengaturan: 16 of 40 failed in the first
     round, when new copies of the app opened their connections, and
     none in the second, when the copies kept theirs.
   - One request every 2 seconds to Dashboard, with no burst: 15 of 15
     got the page.

   So a page fails only when many copies of the app open connections at
   the same moment, and most often on the screens that ask the database
   many things at once, which open the most connections. Of the three
   differences named in the issue, how many copies run at once is the
   one these results point to: twenty copies with five connections each
   ask for about a hundred connections at once, about as many as the
   smallest database of the free plan takes, and copies that the
   hosting has put to sleep keep theirs until they wake. The time a
   request may take is not reached (the errors come within 1.5 seconds),
   and the plan's limits are those connections.
2. So on both previews each copy of the app now keeps one connection
   instead of five, still closed after 10 seconds idle and still through
   the shared-connection address. Twenty copies then ask for about
   twenty connections. One connection still sends a page's questions
   one after another without waiting for each answer. On this computer,
   with all twenty requests in one copy, the middle answer of Dashboard
   went from about 0.6 to 1.2 seconds, and a single request took under
   0.1 seconds. The hosting spreads such a burst over many copies, and
   the smallest free database runs on a quarter of a processor, so more
   connections in one copy gain little there. Whether the middle answer
   stays within about 1 second is confirmed after the merge.
3. No transaction in the app asks the database a second way while it is
   open, so one connection per copy cannot leave a request waiting on
   itself.
4. The campus server does not change. It runs one copy of the app all
   the time, keeps up to ten connections, and never closes idle ones, as
   today. A local computer does not change either.
5. The bursts are confirmed on the preview of `main` after the merge,
   since a PR has no preview. Before the merge, checks confirm the
   limits each place gets, and the bursts are run on this computer with
   the production build and the settings of the preview of `main`.

## Steps

- [x] 1. On both previews each copy of the app keeps one database
  connection; the campus server and a local computer keep today's
  connection.
