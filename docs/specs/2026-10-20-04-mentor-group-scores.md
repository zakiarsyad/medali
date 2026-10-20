# Scores on the mentor group and mentor pages

Depends on: Mentor groups, Mentor list, Character assessment
Group: Pengasuh

## What we want

The Pengasuh pages get the character numbers they were waiting for. The
group list and the mentor list show the average MEDALI score. A group
page and a mentor page show the medal chart and the MEDALI scores of
each member. Staff then see at a glance how a group is doing.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur and Pegawai UPK: every group
  and mentor.
- Ketua Program Studi: the groups and mentors of their program only.

## What should happen

- When one of the four roles looks at Kelompok pengasuhan, then each
  row also shows "Rerata MEDALI": the average of the latest assessment
  of its active members, to one decimal, or "-" when nobody is assessed.
- When they open a group, then they also see the medal chart of the
  members' averages per MEDALI value, the assessment before as a dashed
  line, "Rerata kelompok" with the predikat, and a bar with how many
  members hold each predikat, as in the prototype.
- When they look at "Anggota kelompok", then each member also shows the
  six MEDALI values, Rerata and the predikat, the lowest Rerata first,
  or "Belum diasesmen". For Pegawai UPK a member is not a link.
- When they look at the tab Pengasuh, then each mentor also shows
  "Rerata": the average over all their mentees.
- When they open a mentor who has mentees, then they see the medal chart
  of the mentees' averages per MEDALI value, the assessment before as a
  dashed line, "Rerata binaan" and the predikat. "Mahasiswa binaan"
  shows the same member columns. With no mentees: "Tidak ada mahasiswa
  binaan saat ini."
- When a group has members with scores 80 and 70 and one not assessed,
  then its Rerata MEDALI is 75.0. Confirmed by a check.
- When a new assessment is saved, then the numbers follow on the next
  load.
- When Ketua Program Studi asks by hand for the numbers of a group or
  mentor outside their program, or Pengasuh or Mahasiswa for any, then
  it is refused. Confirmed by a check.
- When the pages are opened on a phone, then the new columns fold into
  the cards and the chart fits the width.
- When the lists are opened on the preview, then they still show within
  about 1 second with the new numbers.

## Not included

- "Perlu pembinaan" on the group page: it needs Character coaching
  list, which is not built yet, and comes with it.
- The MEDALI and nilai karakter columns and filters on the Mahasiswa
  list (Scores in the student detail).
- The evaluation columns (Mentor evaluation) and "Catatan pengasuhan 90
  hari" (Mentoring notes).
- The mentor's own dashboard (Mentor dashboard overview).
- The limit of 70 under a discipline penalty (Score limit under a
  discipline penalty).

## Decisions

1. The averages use the scores as they are stored. The limit of 70
   under a discipline penalty is its own piece of work.
2. Members on Cuti are not counted in a group's average: active members
   only.
3. An average is shown even when very few members are assessed, as the
   prototype does for these four roles.
4. A group or mentor with nobody assessed shows "-" instead of an
   average of sample numbers.
5. The averages are worked out by the server for the rows a role may
   see, not in the browser.

## Steps

- [x] 1. The rule for a group's and a mentor's average, with checks.
- [x] 2. "Rerata MEDALI" on the group list and "Rerata" on the mentor
  list.
- [x] 3. The medal chart and the member columns on the group page.
- [x] 4. The medal chart and the member columns on the mentor page.
