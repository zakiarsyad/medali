# Penetapan angkatan baru after a mentor is replaced

Depends on: New intake assignment, Mentor replacement, Penetapan angkatan
baru after a student is placed or moved on Pengguna baru mahasiswa

## What we want

Once an angkatan is fixed, a mentor of one of its groups can be replaced
on Pengasuh > Evaluasi dan penggantian. Pengasuh > Penetapan angkatan
baru does not follow: it still names the mentor who was chosen on the
day the angkatan was fixed, and "Batalkan penetapan" keeps that mentor
in the draft. After this work the tab names the mentor each group has
today, and a cancel keeps that mentor.

Seen in an audit, on a local computer with sample data, as Kepala Unit,
Direktur / Wakil Direktur and Ketua Program Studi:

- Angkatan 2026 was fixed with three groups. The mentor of KP 26-D3AK-01
  was then replaced, and the replacement took effect the same day.
- Every other screen named the new mentor at once.
- Penetapan angkatan baru still showed the old mentor for that group,
  with "sejak" and the day the angkatan was fixed, for all three roles.
- After "Batalkan penetapan", the draft held the old mentor for that
  group, marked "(tidak bisa dipilih lagi)", while the note under the
  groups said "Semua kelompok sudah punya pengasuh yang berbeda dan siap
  ditetapkan."

## Who it is for

- Kepala Unit and Pegawai UPK, who prepare and fix a penetapan.
- Direktur / Wakil Direktur and Ketua Program Studi, who read it.

## What should happen

- When one of these roles opens an angkatan that is fixed, then each
  group shows the mentor it has today, and "sejak" shows the day that
  mentor started with the group. Ketua Program Studi still sees only
  the groups of their program.
- When a replacement of a group's mentor takes effect, today or once
  its date has come, then the tab names the new mentor the next time it
  is opened. A replacement that still waits for its date changes
  nothing on the tab.
- When Kepala Unit presses "Batalkan penetapan" and confirms, then the
  draft that stays holds, for each group, the mentor the group had at
  that moment. Confirmed by a check.
- When Kepala Unit then presses "Tetapkan" again without changing
  anything, then every group has the same mentor as before the cancel.
  Confirmed by a check.
- When the mentor a group had at the cancel can no longer be chosen,
  then the draft shows that mentor as "(tidak bisa dipilih lagi)" as
  today, and the note under the groups does not say the groups are
  ready to be fixed.
- When a penetapan is still a draft or submitted, then nothing changes:
  it shows and saves the mentors that were chosen, as today.
- When the tab is opened on a phone, then there is still no sideways
  scroll.

Already met on `main` before this spec: a draft and a submitted
penetapan behave as the sixth case says, and the tab has no sideways
scroll on a phone. Both stay untouched. No case about a fixed angkatan
or a cancel was met.

## Not included

- The members and the counts of a fixed angkatan, which "Penetapan
  angkatan baru after a student is placed or moved on Pengguna baru
  mahasiswa" brought up to date.
- "Riwayat penggantian" and the number "Penggantian tahun ini" for a
  group that was ended by "Batalkan penetapan". They leave such a group
  out, as today.
- What a replaced mentor becomes, Cadangan or Tidak aktif, after the
  group is ended by a cancel. It stays as the replacement set it.
- A line in "Riwayat proses" for each replacement. Replacements keep
  their own history.

## Better than the prototype

The prototype keeps one mentor per group, so it has no such difference.
This brings the app back to that.

## Decided

1. A fixed angkatan shows the mentor of today, not the mentor of the day
   it was fixed, as every other screen does and as the prototype does.
2. A cancel keeps the mentor of today in the draft, the same way the
   issue this one depends on keeps the members of today.

Decided while building, because the issue did not say:

3. For a fixed angkatan the tab reads the mentor of today of the group
   in force, and "sejak" is the first day of that mentor's time with the
   group. For a draft, a submitted or a cancelled one it reads the
   mentor that was chosen, as today, with no "sejak".
4. A cancel writes the mentor of today of each group in force into the
   draft before it ends the groups, so the draft and the ended groups
   say the same.
5. When a draft names a mentor who can no longer be chosen, the note
   under the groups says so with the sentence that "Tetapkan" already
   uses for it, and leaves out the sentence that says the groups are
   ready. "Tetapkan" stays refused for it, as today.
6. No table is added or changed.
7. A group in force always has one mentor of today. Should one ever
   have none, the tab shows the mentor that was chosen for it, with no
   "sejak", rather than no mentor at all.

## Steps

- [x] 1. A fixed angkatan shows the mentor of today of each group, with
  "sejak" the day that mentor started, with its checks.
- [x] 2. "Batalkan penetapan" keeps the mentor of today in the draft,
  and the note does not call a draft ready while it names a mentor who
  can no longer be chosen, with its checks.
