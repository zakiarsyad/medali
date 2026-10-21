# Changing a PPKS schedule after photos came in

Depends on: nothing beyond what is merged
Group: Kegiatan
Kind: fix, found by "Audit: Kegiatan"

## What we want

Kepala Unit and Pegawai UPK may change the dates of a PPKS schedule after
students have sent photos. Today the change saves with no word about those
photos, and what is left behind is counted differently in different places.
After this work the form says, before saving, that photos already came in
and what happens to them, and a photo counts in a number or a score only
where its schedule counts for that student today.

Seen in "Audit: Kegiatan", on a local computer with sample data:

- A schedule of 15–16 Okt had a validated photo of one student and a
  waiting photo of another. Kepala Unit moved it to 20–21 Okt with "Ubah".
  The first student's Nilai kehadiran stayed "50,0% · 2/4" with this
  schedule counted as attended, while the same schedule showed under "Akan
  datang" with no status. On "Kegiatan PPKS" its row said "Akan datang 0 0
  -". The second student's page still counted the waiting photo in
  "Menunggu verifikasi 1".
- Another schedule with three photos (valid, rejected, waiting) was moved
  to 15 Jul 2026, in the period before. The form showed "Sasaran: 0
  mahasiswa" and saved without a warning. Its row showed 0 everywhere, but
  the waiting photo was still counted in "Menunggu verifikasi" on
  "Kegiatan PPKS".
- Removing a schedule already asks first and says "Presensi yang sudah
  masuk tidak lagi dihitung." For a "Kegiatan tambahan", a student taken
  out of the participants already counts in no number and no score,
  "Menunggu verifikasi" included.

## Who it is for

Kepala Unit and Pegawai UPK, who change schedules; Mahasiswa, whose score
and page show the result; Ketua Program Studi and Pengasuh, who read the
numbers on "Kegiatan PPKS".

## What should happen

- When Kepala Unit or Pegawai UPK presses "Simpan perubahan" on a schedule
  that already has attendances, and the change moves its dates or its
  period, then nothing is saved yet and the form says "Sudah ada (n)
  presensi masuk untuk jadwal ini. Presensi mahasiswa yang tidak lagi
  menjadi sasaran, atau jadwal yang belum dimulai, tidak dihitung. Tekan
  Simpan perubahan lagi untuk melanjutkan." A second press saves.
- When the change touches neither the dates nor the period, or the schedule
  has no attendance yet, then it saves at once as today.
- When a schedule has not started yet (its first day is after today on
  campus), then it counts nothing in the student's Nilai kehadiran
  kegiatan, not even a validated photo, and nothing in "Menunggu
  verifikasi" on the student's page and on "Kegiatan PPKS".
- When a student is no longer one the schedule is meant for, then their
  photo of that schedule counts in no number and no score, "Menunggu
  verifikasi" on "Kegiatan PPKS" included, and the student no longer sees
  the schedule. The photo stays in "Verifikasi presensi" and can still be
  decided there.
- When the schedule is moved back so that it covers the student again or
  has started, then the photo counts again as before. Nothing is removed.
- The numbers on "Kegiatan PPKS" for Ketua Program Studi and Pengasuh
  follow the same rules over their own students.

## Not included

- The four numbers at the top of "Verifikasi presensi": they have their
  own issue, "Kegiatan: Numbers on Verifikasi presensi that count photos
  no longer counted elsewhere".
- Removing a schedule, which already asks first.
- "Kegiatan tambahan", which already leaves out students taken out.

## Decisions

1. Refuse the change, or warn? Warn and save on the second press. The
   PPKS schedule spec allows dates to change after photos came in, as in
   the prototype, and the record made by hand already asks the same way
   ("Tekan Simpan lagi").
2. What counts before the first day? Nothing, as "Kegiatan PPKS" already
   shows "-" before the first day. A photo validated early counts from the
   first day on.
3. Where does the "meant for" rule live? The one rule the student page
   already uses to choose a student's schedules, also used for the
   numbers, so a photo out of it counts nowhere.
4. (n) counts every attendance kept for the schedule, photos and records
   made by hand, in any status. The period of a schedule follows its first
   day, so a change of dates covers a change of period.
5. The second press sends back the number it was asked about. If more
   attendances came in since, the form asks again with the new number.
6. The "not started" rule also holds for the other scores built from the
   same attendance score: "Rerata nilai kehadiran" on "Kegiatan PPKS" and
   the attendance part of the character grade. They are the same score,
   so they must agree with the student's own.
7. Only a PPKS schedule asks before its dates move. A "Kegiatan tambahan"
   saves as today. The "not started" rule sits in the one attendance
   score, so it holds for a "Kegiatan tambahan" as well.
8. On the student's page, a schedule not started also counts nothing in
   "Dispensasi", as it counts in no number.
9. "Menunggu verifikasi" on "Kegiatan PPKS" now counts only Aktif
   students of the schedule's semester, as the rows already do. A waiting
   photo of a student on Cuti or Non aktif is no longer counted there.

## Steps

- [x] 1. The change form asks before moving the dates or period of a
  schedule with attendances.
- [x] 2. A schedule not started yet, and a photo of a student the schedule
  is no longer meant for, count in no number and no score.
