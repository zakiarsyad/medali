# Preview errors when many people open a page at once

Depends on: nothing
Group: Groundwork
Kind: fix, found by "App-wide audit: Launch"

## What we want

When about twenty people open a main screen of the preview of `main` at
the same moment, part of them get the error screen instead of the page,
and for some minutes after that even one person at a time often gets the
error screen. The errors come back fast, so they are not a slow first
start of the hosting. The app should keep working, and answer within
about 1 second, with twenty requests at once, as the launch audit asks.

Seen on the preview of `main`, signed in with sample accounts, twenty
requests at once to the main screen of each area, two rounds:

- Tugas saya: 20 and 18 of 20 got the error screen; Profil saya: 10 and
  10; Penilaian: 6 and 15; Pengaturan: 5 and 2; Asrama: 0 and 6.
- Right after, one request every 2 seconds: Tugas saya failed 4 of 6
  times and Penilaian karakter 5 of 6. Ten minutes later all worked.
- Dashboard took 1.8 seconds in the middle of the first round.
- The same screens on a local computer worked every time.

Seen again on 2026-10-27 while starting this work: after a first round in
which every request was answered, whole rounds of twenty failed, each
error coming back in about a tenth of a second.

## Who it is for

Everyone who uses the preview, and the owner, who tries merged work there.

## What should happen

- When twenty requests at once are sent to the main screen of each area
  of the preview of `main`, signed in, then every one gets the page and
  none the error screen. Confirmed by a small script run once.
- When those twenty requests are sent, then the middle one is answered
  within about 1 second, Dashboard included.
- When one person opens a page right after such a burst, then it opens
  normally.
- When the app runs on the campus server, then it behaves as today.

## Not included

- A paid hosting or database plan.
- Data the size of the real campus.
- Any change to what a screen shows.

## Decisions

1. The cause. The hosting's logs could not be read from this computer,
   so the cause was taken from what was seen: the errors come back in a
   tenth of a second, the way a database refuses a new connection when it
   has too many, and they stop by themselves after some minutes, when
   the hosting puts its idle copies of the app away. Each copy of the app
   on the hosting kept up to ten connections open and never closed idle
   ones. So, on both previews, each copy now keeps at most five
   connections, closes one that has been idle for 10 seconds, and
   connects through the database's shared-connection address, which
   lets many copies share a few real connections. The address is the
   database's own address with `-pooler` added to its first part, as the
   database service names it; an address that already has it, or that is
   not at that service, is used as it is.
2. The build step that changes the tables keeps the address Vercel
   gives, as today: it runs once per build. Which address that is, the
   database's own or the shared one, could not be read from this
   computer, since Vercel keeps the key; when it is the shared one
   already, the fewer connections that close when idle are the change
   that counts.
3. The campus server does not change. It runs one copy of the app all
   the time, keeps up to ten connections, and never closes idle ones, as
   today. A local computer does not change either.
4. The burst is confirmed on the preview of `main` after the merge, since
   a PR has no preview. Before the merge, checks confirm which address
   and limits each place gets, and the burst is run on this computer.

## Steps

- [x] 1. On both previews the app connects through the shared-connection
  address, with at most five connections that close when idle; the
  campus server and a local computer keep today's connection.
