# Dorm attendance

Depends on: Dorm activities
Group: Asrama

## What we want

BAM counts who is present at each dorm activity on the spot, marks who
is absent, and then announces the absences. Until the announcement,
nothing counts. After it, residents see Hadir or Tidak hadir in their
history and staff see the attendance rate per activity.

## Who it is for

- Count and announce: every BAM role (BPHK, KI, Kerumahtanggaan,
  Kerohanian, Konsumsi, Senipora, Kesehatan).
- Read only: Pengelola Asrama, Kepala Unit, Direktur / Wakil Direktur and
  Ketua Program Studi (their study program only).
- Mahasiswa who live in the dorm, for their own attendance.

## What should happen

- When a BAM role opens Jadwal harian, then below the schedule they see
  "Penghitungan kehadiran" with one chip per activity of that day; the
  latest started activity is chosen at the start.
- When the chosen activity has not started, then the panel says
  "Kegiatan belum dimulai. Penghitungan dapat diisi setelah kegiatan
  dimulai." and nothing can be ticked.
- When it has started, then each participant shows name, NIM and room,
  a "Tidak hadir" box and an optional Catatan, with "Cari nama atau NIM"
  and "Hanya tidak hadir atau bercatatan". The count "(n) dari (m)
  peserta ditandai tidak hadir" updates while ticking.
- When they press "Simpan", then the draft is kept and the panel says
  "Belum diumumkan" with the time of the last draft. Residents see
  nothing of a draft.
- When they press "Umumkan ketidakhadiran" and confirm, then the absences
  are announced, with who and when. After that, a correction goes out
  only through "Umumkan ulang", which also asks first.
- When an activity is announced, then everyone not ticked counts as
  Hadir. Before that, a finished activity shows "Belum diumumkan" and
  counts for no one.
- When staff look at Jadwal harian, then each finished, announced
  activity shows Hadir and Kehadiran as a percentage; "Rincian" shows
  "Pengumuman BAM", the Ringkasan and who was absent, with notes.
- When a resident opens Kegiatan asrama, then they also see the note on
  how attendance is counted, the numbers "Kehadiran kegiatan asrama"
  (percentage of announced activities), "Tercatat tidak hadir" and
  "Kegiatan hari ini", and Riwayat with date, activity, status and
  catatan for the last 25 activities.
- When Pengelola Asrama sends a hand-made count, or a resident asks for
  another resident's attendance, then the server refuses it. Confirmed by
  a check.
- When two BAM members save the same activity at once, then the second
  is refused with "Penghitungan sudah diubah orang lain. Muat ulang."
  One activity has one count, kept by the database. Every change after
  the first announcement is kept in a log that cannot be edited.
  Confirmed by a check.
- When an activity is removed after it was announced, then its count
  stays in residents' Riwayat. Confirmed by a check.
- When BAM counts on a phone, then each participant is one row with name,
  the box and a note, with no sideways scroll.
- When BAM opens a count of about 300 participants on the preview, then
  it shows within about 1 second.

## Not included

- Leave (Izin, ITMK) changing the status (Dorm leave requests), and
  clarification (Dorm attendance clarification).
- The attendance numbers on Dashboard asrama (Dorm dashboard).

## Better than the prototype

- After an announcement, "Simpan" no longer changes what residents see
  without asking; a correction is always an "Umumkan ulang".
- Corrections after an announcement are logged, since an absence can
  lead to a warning letter.
- Leaving a count with unsaved changes asks first, on every way out, not
  only when switching activity.
- Two BAM members cannot overwrite each other's count.

## Decided

1. There is no deadline to announce. An activity that is never announced
   stays "Belum diumumkan" and counts for no one.
2. An activity that is not Wajib hadir counts in the percentage, as in
   the prototype.
3. Every BAM role may count every activity, of every dorm, as in the
   prototype.

Decided while building, because the issue did not say:

## Steps

- [ ] 1. The tables for counts and their change log are added, with
  sample counts for the past week.
- [ ] 2. The rights to count and to see attendance are added to the
  permission list, with their checks.
- [ ] 3. "Penghitungan kehadiran" lets BAM tick, note, save and announce.
- [ ] 4. Staff see Hadir, Kehadiran and the absent list in Rincian.
- [ ] 5. Residents see the numbers and Riwayat.
