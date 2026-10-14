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

4. A count is for one activity on one date. It holds every resident who
   took part on that date as they were at its last save, each Hadir or
   Tidak hadir with a Catatan, so a resident who moves out later keeps
   their past attendance.
5. Catatan holds at most 200 characters.
6. The log holds each announcement, the first one too: who, when, and
   the participants who were absent or had a note, before and after. A
   draft saved before the first announcement is not logged, as it
   counts for no one.
7. The sample counts are of the week before today, made by the sample
   BAM - BPHK: most are announced, one was corrected with "Umumkan
   ulang", yesterday's last activity has no count yet and the one before
   it is a draft.
8. Counting and announcing is a right held by every BAM role. Seeing the
   attendance is a right of its own, held by every role that sees the
   schedule: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi
   (their study program only), Pengelola Asrama and every BAM role.
   Seeing one's own attendance is a right of its own, held by Mahasiswa.
9. "Penghitungan kehadiran" is for the date open in Jadwal harian, any
   date. The chip picked is kept in the address. On a date gone by every
   activity has started, so its last one is chosen at the start. An
   activity that has not started shows only the message, without the
   list.
10. The participants are the students who live, on the activity's date,
    in a dorm its Peserta covers, by the rule the app already uses for
    who lives in which dorm. The room shown is their room today, or
    "Belum diplot". Each save takes the participants anew: one who no
    longer takes part leaves the count and one who just moved in counts
    as Hadir. A form that marks someone who does not take part is
    refused with "Daftar peserta sudah berubah. Muat ulang halaman, lalu
    isi lagi."
11. An announcement may be made once the activity has started, as in the
    prototype. After the first one "Simpan" is no longer offered and a
    draft sent by hand is refused; "Umumkan ulang" asks first too.
12. Leaving with unsaved changes asks first on every link of the app
    (the chips, the day steps, the tabs and the menu), on picking another
    date, and on reloading or closing the page, where the browser asks in
    its own words. The browser's own back step is not asked about, as on
    Daftar hadir pertemuan.
13. The messages are "Draf penghitungan disimpan.", "Ketidakhadiran
    diumumkan." and "Ketidakhadiran diumumkan ulang."; the question
    before an announcement is "Umumkan (n) mahasiswa tidak hadir pada
    (kegiatan)?", without the prototype's line on clarification, which
    is not part of this work.
14. Staff, BAM among them, see Hadir and Kehadiran of an activity once
    it is announced, also one announced before it ended. Until then an
    activity that is over shows "Belum diumumkan" and one that is not
    over a dash. A draft is shown only to BAM, in Penghitungan
    kehadiran.
15. Kehadiran is the share of those counted who were Hadir, rounded to a
    whole percentage. Hadir, Kehadiran and the list in Rincian count only
    the students the account may see: Ketua Program Studi those of their
    own study program.
16. Rincian lists by name everyone who was absent or has a note, each
    with Hadir or Tidak hadir and the note, or says "Semua peserta hadir
    tanpa catatan." Before the announcement it shows only "Pengumuman
    BAM: Belum diumumkan".

## Steps

- [x] 1. The tables for counts and their change log are added, with
  sample counts for the past week.
- [x] 2. The rights to count and to see attendance are added to the
  permission list, with their checks.
- [x] 3. "Penghitungan kehadiran" lets BAM tick, note, save and announce.
- [x] 4. Staff see Hadir, Kehadiran and the absent list in Rincian.
- [ ] 5. Residents see the numbers and Riwayat.
