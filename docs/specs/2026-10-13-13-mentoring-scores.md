# Mentoring scores

Depends on: Mentoring meetings and attendance, Mentoring notes, Academic period
Group: Pengasuhan

## What we want

The Pengasuhan menu gets the tab "Nilai pengasuhan". Once a semester the
mentor gives each mentee a score from 0 to 100 for how they took part in
mentoring, guided by a short rubric and by the mentee's attendance at
the meetings. This score later becomes the "nilai pengasuhan" part of
the character grade.

## Who it is for

- Score: Pengasuh, for the groups they hold today.
- Read only: Kepala Unit and Direktur / Wakil Direktur (every group),
  Ketua Program Studi (groups of their study program).

## What should happen

- When Pengasuh opens the tab, then they see the intro, the numbers
  "Sudah dinilai pengasuh" ((n) / members, and how many are left),
  "Rerata nilai pengasuhan" and "Pertemuan terlaksana", "Panduan
  penilaian" (85–100 Sangat aktif, 75–84 Aktif dan konsisten, 65–74
  Cukup aktif, 0–64 Kurang aktif, each with its sentence), and the table
  "Nilai anak asuh".
- When they look at the table, then each row shows the mentee, NIM,
  "Kehadiran pengasuhan" (for example 3/4), a box for the score, and
  "Keterangan": the rubric sentence for the score, and "Belum dinilai"
  or "Diinput (date)".
- When they type a score, then the row shows "Belum disimpan" and the
  button reads "Simpan (n) nilai"; with nothing changed it is off.
- When they press it, then the message says "(n) nilai pengasuhan
  disimpan." and the numbers update.
- When a score is not a whole number from 0 to 100, then nothing is
  saved and the row says so.
- When they leave with unsaved scores, then they are asked first.
- When a saved score is changed, then a log line keeps who, when, and
  the score before and after. It cannot be edited or deleted. Confirmed
  by a check.
- When a Pengasuh holds no group, then they see "Anda belum memegang
  kelompok pengasuhan."
- When someone can see more than one group, then they choose one as on
  the attendance tab.
- When a read-only role opens the tab, then they see the line that only
  mentors fill this in, and the scores without boxes.
- When they press a mentee's name, then the student detail opens, as
  "Mentoring notes" gives it to each of these roles.
- When Pengasuh sends a score for a student outside their groups, or any
  other role sends a score, then the server refuses it. Confirmed by a
  check.
- When the same score is saved from two windows, then the second is told
  it changed and shown the latest. A student has one score per semester;
  the database enforces it. Confirmed by a check.
- When the tab opens on a phone, then each mentee is a card with no
  sideways scroll; on the preview it shows within about 1 second.

No case was met on `main` before this spec: the tab was empty. All of
it is built here.

## Not included

- Using the score in Nilai karakter, and the number "Bobot di nilai
  karakter" (Character grade list).
- The reminder on the mentor's dashboard (Mentor dashboard overview).
- Closing a semester, and any deadline for giving a score.
- The rubric's score bands are the prototype's values, to be confirmed
  by the campus before launch.

## Better than the prototype

- A score outside 0–100 is refused with a message, not silently changed.
- Every change is logged, as the rules ask for scores.
- Leaving with unsaved scores asks first.
- The average does not mix in made-up scores.

## Decided

1. No deadline for giving or changing a score is enforced now. The score
   is for the running period read from "Academic period", and the mentor
   may give or change it while that period runs.
2. A saved score cannot be emptied again, only changed.
3. The four meetings need not be filled in before scoring. The tab only
   shows how many are done.
4. Kepala Unit cannot correct a mentor's score. They read only, as in
   the prototype.

## Decisions made while building

5. A score belongs to the student and the semester, not to a group. A
   student who moves to another group keeps their score, and the mentor
   who holds them then may change it.
6. The log gets a line for the first save of a score too, with nothing
   before, as the log of attendance lists does.
7. The sample data has scores of the running period for part of the
   sample groups: every Aktif member of one group, the first half of
   the next, nobody of the third, and so on. They are given 5 days ago
   by the mentor of that day, or on the first day of the period or of
   the group's first mentor when that is later. A group that has no
   mentor yet has none.
8. Two rights are added to the one list: reading mentoring scores
   (Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi,
   Pengasuh) and giving them (Pengasuh). Each reads within their own
   rows: Pengasuh the groups they hold today, Ketua Program Studi the
   groups of their program.
9. The table holds the members who are Aktif, as the attendance list
   does. A member on Cuti or Non aktif is not listed, and "Sudah dinilai
   pengasuh" counts the same members, so the numbers agree with the
   table.
10. "Kehadiran pengasuhan" shows the meetings a member is marked Hadir
    at, over the meetings they are marked Hadir or Alpa at, among the
    saved meetings of the running period. Izin, Sakit and a meeting
    without a mark for them are left out, as in the average of the
    attendance tab, and it shows "-" while no meeting counts. The
    prototype counts a member without a mark as Alpa.
11. "Rerata nilai pengasuhan" is the average of the saved scores of the
    members in the table, with one decimal, and "-" while none is saved.
    The line under it says it is of the saved scores, where the
    prototype says it includes sample data.
12. The number "Bobot di nilai karakter" is left out, and so is the
    weight in the intro, as "Not included" says. The intro is otherwise
    the prototype's sentence, which says the score becomes a part of the
    character grade. That use is not built here.
13. "Diinput" shows the day with its year, as the other screens show a
    day. The prototype leaves the year out.
14. The group choice works as on the attendance tab: the first group is
    shown, the newest angkatan first, until another is chosen; an
    address that names a group the account may not read shows that
    first group and nothing of the group it named; a Pengasuh with one
    group sees no choice; a role that only reads and has no group in
    its rows sees "Belum ada kelompok pengasuhan yang dapat Anda lihat."
15. When no period is running, the tab says so and shows no scores, as
    the attendance tab does.
16. The student detail opened from a name shows the same as when it is
    opened from "Catatan pendampingan", with the notes for those who may
    read them. Closing it goes back to the scores of the same group. A
    name is a link only for a student whose detail the account may
    open.

## Steps

- [x] 1. Scores and their change log are stored, one per student per
  semester, with sample scores for part of the sample groups.
- [x] 2. The rights to score and to read scores are added to the
  permission list, with their checks.
- [x] 3. The tab with the numbers, the rubric and the table, read only.
- [ ] 4. Pengasuh types and saves scores.
- [ ] 5. Changed scores, the log and the two-window case.
- [ ] 6. Refusals and the phone layout.
