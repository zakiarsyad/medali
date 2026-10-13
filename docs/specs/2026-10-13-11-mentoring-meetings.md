# Mentoring meetings and attendance

Depends on: Mentor groups, Academic period
Group: Pengasuhan

## What we want

The Pengasuhan menu gets the tab "Pertemuan dan daftar hadir". Each
group meets its mentor four times a semester. For every meeting the
mentor records the date, the topic and who came: Hadir, Izin, Sakit or
Alpa. This attendance later feeds the attendance part of the character
grade.

## Who it is for

- Fill in and change: Pengasuh, for the groups they hold today.
- Read only: Kepala Unit and Direktur / Wakil Direktur (every group),
  Ketua Program Studi (groups of their study program).

## What should happen

- When Pengasuh opens the tab, then they see the intro, the numbers
  "Pertemuan terlaksana" ((n) / 4 for the running semester), "Anak
  asuh", "Rerata kehadiran pengasuhan" and "Pengasuh", and four cards
  "Pertemuan 1" to "Pertemuan 4", each "Belum diisi" or "Terlaksana"
  with date, topic and the counts of hadir, izin, sakit and alpa.
- When a Pengasuh holds no group, then they see "Anda belum memegang
  kelompok pengasuhan."
- When someone can see more than one group, then "Kelompok pengasuhan"
  lets them choose one, by code or mentor name.
- When Pengasuh presses "Isi daftar hadir", then "Daftar hadir pertemuan
  (n)" opens with Tanggal (today), Topik (free text with suggested
  topics) and one row per member (name, NIM, kelas akademik) set to
  Hadir; a member on Cuti is not listed and not counted, with "Tandai
  semua hadir" and a running count.
- When they press "Simpan daftar hadir", then the message says "Daftar
  hadir pertemuan (n) disimpan.", the card becomes Terlaksana and the
  numbers update.
- When the date is in the future, outside the running semester, or the
  topic is empty, then nothing is saved and the message says why.
- When they press "Ubah daftar hadir" on a saved meeting and save, then
  the new list replaces the old one, and who changed what is kept in a
  log that cannot be edited. Confirmed by a check.
- When they leave the form with unsaved changes, then they are asked
  first.
- When the average is worked out, then each member's own share is
  hadir divided by hadir plus alpa, Izin and Sakit left out, and the
  number is the average of those shares over the members who have at
  least one Hadir or Alpa, as in the prototype. Confirmed by a check.
- When a read-only role opens the tab, then they see the line that only
  mentors fill this in, and "Lihat daftar hadir" on saved meetings.
- When Pengasuh sends a list for a group they do not hold, a member who
  is not in the group, or a fifth meeting, or any other role sends a
  list, then the server refuses it. Confirmed by a check.
- When "Simpan daftar hadir" is pressed twice, or the same meeting is
  saved from two windows, then one list is kept and the second window is
  told the meeting changed. Confirmed by a check.
- When the form opens on a phone, then each member is a card with four
  large choices and no sideways scroll; on the preview the tab shows
  within about 1 second.

No case was met on `main` before this spec: the tab was empty. All of
it is built here.

## Not included

- Counting these meetings in Nilai kehadiran (Mentoring meetings in
  the attendance score).
- The reminder on the mentor's dashboard (Mentor dashboard overview).
- Removing a saved meeting; the prototype has none.
- Closing a semester, and any deadline for changing a list.
- Four meetings a semester are the prototype's values, to be confirmed
  by the campus before launch.

## Better than the prototype

- A future date and an empty topic are refused.
- Changes to a saved list are logged, because they feed a score.
- Leaving with unsaved changes asks first.
- The group choice can be searched instead of one long list.

## Decided

1. Four meetings a semester is fixed, for every group, as in the
   prototype.
2. No deadline for changing a saved list is enforced now. The mentor of
   the group may change it, and every change is logged.
3. The running period and its dates are read from "Academic period".
   This spec has no rule of its own. The four meetings are counted per
   period, as in the prototype.
4. A member on Cuti is not listed and not counted.
5. After a mentor is replaced, the new mentor may change the meetings
   the old one filled in. The log shows who.

## Decisions made while building

The issue did not say, so these were decided:

6. There are two rights: reading attendance (Kepala Unit, Direktur /
   Wakil Direktur, Ketua Program Studi, Pengasuh) and filling it in
   (Pengasuh). Each reads within their own rows: Pengasuh the groups
   they hold today, Ketua Program Studi the groups of their program.
7. The list holds the members who are Aktif. A member on Cuti or Non
   aktif is not listed. "Anak asuh" counts the same members, so the
   numbers agree with the list.
8. The four meetings can be filled in any order, and their dates need
   not follow their numbers, as in the prototype.
9. Topik starts with the prototype's suggestion for that meeting number
   and can be changed freely. The suggestions are the prototype's seven
   topics. Topik holds 1 to 200 characters, counted without the blanks
   around it.
10. Tanggal may be any day from the first day of the running period up
    to today, and not after the period's last day.
11. When no period is running, the tab says so and nothing can be filled
    in.
12. When a saved list is changed, the form lists the members who are
    Aktif in the group today. A member who joined after the list was
    saved starts as Alpa, as in the prototype, and the mentor can change
    it. A mark saved earlier for a student who has since left the group
    or is no longer Aktif stays as it was saved and is not shown in the
    form.
13. A member with no mark in a saved meeting is not counted for that
    meeting in the average. The prototype counts them as Alpa; that
    would lower the share of a student for a meeting held before they
    joined.
14. "Rerata kehadiran pengasuhan" is shown as a whole percent, and "-"
    when no member has a Hadir or an Alpa yet.
15. The log gets one line for each save: who, when, and the date, the
    topic and each member's mark before and after. The first save has
    nothing before.
16. A second save of the same meeting is told apart from a change by
    what the form loaded: a form that was opened on an older state of
    the meeting is refused, nothing is saved, and the message says the
    meeting changed and to load the page again.
17. A Pengasuh with one group sees no "Kelompok pengasuhan" choice.
18. The sample data has meetings 1 and 2 of the running period for every
    sample group, by the mentor of that day.

## Steps

- [ ] 1. Meetings, their attendance and the change log are stored, with
  two sample meetings per sample group.
- [ ] 2. The rights to fill in and to read attendance are added to the
  permission list, with their checks.
- [ ] 3. The tab with the numbers, the group choice and the four cards.
- [ ] 4. Pengasuh fills in and saves an attendance list.
- [ ] 5. Changing a saved list, with the log and the two-window case.
- [ ] 6. Read-only view, refusals and the phone layout.
