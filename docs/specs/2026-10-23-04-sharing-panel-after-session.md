# Sharing panel after the first session is saved

Depends on: nothing beyond what is merged
Group: Konseling

## What we want

On Konseling, the student picked on "Persetujuan konseling" has both
"Catat sesi" and the panel "Publikasi data kesehatan mental". When
Konselor saves the first session of a student who had no session and no
screening yet, the page says "Sesi konseling dicatat." and "Riwayat sesi"
lists the new session, but the panel below still says "Belum ada asesmen
atau sesi konseling untuk mahasiswa ini." and offers no sharing. "Sesi 30
hari terakhir" also keeps its old number. Only after the page is read
again does the panel offer its choices and the number go up. "Sharing a
counselling summary" says the panel offers its choices for a student with
at least one session, so the same screen disagrees with itself until a
reload. After this work, saving a session updates every part of the page
that depends on the student's sessions.

## Who it is for

Konselor, who records sessions and shares a summary.

## What should happen

- When Konselor saves the first session of a student with no session and
  no screening, then without reading the page again the panel
  "Publikasi data kesehatan mental" offers the same choices it offers
  after a reload, and "Sesi 30 hari terakhir" counts the new session when
  its date falls in the last 30 days.
- When Konselor changes a session note or saves a later session, then
  the panel and the number show the same as after a reload.
- When saving a session is refused (for example the consent was
  withdrawn meanwhile), then the panel and the number stay as they were.
- Nothing else on the page changes in what it shows or who may see it.

## Not included

- Any change to what the panel offers, to the sharing itself, or to who
  may see it.
- Other pages of the app.

## Decided

1. The page is read again the way it already is after other saves on
   Konseling that change more than one part, such as "Tandai selesai":
   the server draws Konseling again after a session is kept or changed,
   which brings "Sesi 30 hari terakhir" and the other numbers up to date.
   The panel "Publikasi data kesehatan mental" reads the picked student's
   sharing again, as it already does when their consent changes. No new
   way of reloading is added.
2. A change refused because someone else changed the session first keeps
   nothing, so the page is not drawn again and the panel is not read
   again; "Riwayat sesi" shows the other change, as today.
3. A session saved from "Tandai selesai" on a schedule card also draws the
   page again, so the number counts it. The panel is not read again for
   it, as "Riwayat sesi" is not either: the student picked on
   "Persetujuan konseling" may be someone else, and picking the student
   again reads both.
4. Reading the sharing again after a save clears the panel's last message,
   as picking the student again does.

## Steps

- [x] 1. Saving or changing a session updates the panel "Publikasi data
  kesehatan mental" and "Sesi 30 hari terakhir" on the same page, with a
  check.
