# PPKS activity schedule

Depends on: Student list and detail, Academic period
Group: Kegiatan

## What we want

The Kegiatan karakter menu gets its first content: the tab "Kegiatan
PPKS" with the "Jadwal dan kehadiran" table. Staff who manage activities
pick a PPKS activity from the Kurikulum list and give it dates, hours, a
place and the time allowed to upload attendance photos. Other staff with
the menu read the schedule.

## Who it is for

- Schedule, change, remove: Kepala Unit and Pegawai UPK (the right
  "Mengelola kegiatan", already merged).
- Read only: Direktur / Wakil Direktur, Ketua Program Studi and
  Pengasuh.
- Not yet: Mahasiswa and Penilai Mahasiswa keep the empty page until
  their own specs.

## What should happen

- When a staff role above opens Kegiatan karakter, then they see the
  title, the intro text and the tab "Kegiatan PPKS".
- When they look at "Jadwal dan kehadiran", then each schedule shows
  Jadwal (dates, hours, "Unggah s.d. (date) (n hari/minggu)"), Kegiatan
  (name, place, "tidak wajib" when not required, main indicators),
  Sasaran ("Semester (no) (tahap)", "(n) peserta": its participants as
  the case below says, and the target) and Status: Akan datang, "Hari
  ini, belum dibuka", Unggah foto dibuka or Selesai. Earliest first, 25
  a page.
- When they choose Semua or one tahap above the table, then only that
  tahap's schedules show. With none: "Belum ada jadwal kegiatan."
- When Kepala Unit or Pegawai UPK presses "Jadwalkan kegiatan PPKS",
  then a form opens with Kegiatan dari Kurikulum (grouped by semester),
  Tanggal mulai, Tanggal selesai, Jam mulai, Jam selesai, Rentang unggah
  foto kehadiran (a whole number 0 to 52 and hari or minggu; 1 hari at
  the start), Lokasi, and "Wajib, dihitung dalam nilai kehadiran" (taken
  from the Kurikulum activity). Picking an activity shows its nilai,
  indicators, target and "Sasaran: (n) mahasiswa".
- When a schedule is saved, then it keeps the academic period that is
  running on its start date, by the rule of "Academic period" (between
  two periods, or after the last one stored, that is the period that
  ended last). Its participants are the active students who are in that
  semester during that period, so a schedule of an earlier period never
  targets this period's students. Confirmed by a check.
- When they press "Simpan jadwal" with valid fields, then the schedule
  appears in the table with 'Jadwal "(name)" disimpan untuk semester
  (no) (tahap).'
- When no activity is picked, the end date is before the start date, or
  the end hour is not after the start hour, then nothing is saved and
  the message says "Pilih kegiatan dari daftar Kurikulum.", "Tanggal
  selesai harus sama atau setelah tanggal mulai." or "Jam selesai harus
  setelah jam mulai."
- When they press "Ubah" on a row, then the same form opens filled in;
  "Simpan perubahan" keeps the changes and "Batal" closes it unchanged.
- When they press "Hapus jadwal" and confirm the question, which says
  that attendance already sent no longer counts, then the schedule
  leaves the table with "Jadwal dihapus." It is marked as removed, with
  who and when, not erased. Confirmed by a check.
- When a PPKS activity is later removed from Kurikulum, then its
  schedules stay and still show its name. Confirmed by a check.
- When a read-only role opens the tab, then there is no "Jadwalkan
  kegiatan PPKS", "Ubah" or "Hapus jadwal". When any role without the
  right sends a new schedule, a change or a removal by hand, then the
  server refuses it. Confirmed by a check.
- When "Simpan jadwal" is pressed twice, then one schedule is saved.
  When two people change the same schedule, then the second is told it
  has changed and sees the new version. Confirmed by a check.
- When the tab is opened on a phone, then each schedule shows as a card
  and the form is one column, with no sideways scroll.
- When the tab opens with sample data on the preview, then it shows
  within about 1 second.

## Not included

- The Hadir, Menunggu and Kehadiran columns, "Peserta" and the four
  numbers (spec "Attendance verification").
- The student's view (spec "Attendance photo upload").
- The tabs "Kegiatan tambahan" and "Verifikasi presensi".
- The "Dijadwalkan" column in Kurikulum (spec "Scheduled count on
  Kurikulum").

## Better than the prototype

- The status comes from the server's clock in campus time (WIB), not
  from each browser's clock.
- The server checks dates and hours; the prototype checked in the
  browser only.
- A phone shows cards instead of a wide table, and the table is paged.

## Decided

1. A schedule may be removed, and its dates changed, after students have
   sent photos, as in the prototype, with its warning on removal.
2. The same Kurikulum activity may be scheduled more than once.
3. This spec reads the running period and each student's semester from
   "Academic period" and has no rule of its own.

## Decisions made while building

The issue did not say, so these were decided:

4. Nothing of the issue was built before: Kegiatan karakter was an
   empty page for every role.
5. The form opens in its own panel above the table, as in the
   prototype, and "Hapus jadwal" is in the form that "Ubah" opens.
6. The status follows the prototype: "Akan datang" before the start
   date, "Hari ini, belum dibuka" on the start date before the start
   hour, "Unggah foto dibuka" from then until the end of the last
   upload day, and "Selesai" after it. The last upload day is the end
   date plus the upload range.
7. "(n) peserta" is the same whole number for every role that reads the
   tab. It is a head count and names nobody. The attendance numbers,
   which Ketua Program Studi and Pengasuh see for their own students
   only, come with "Attendance verification".
8. A student whose angkatan year is later than the first year of the
   schedule's period is not a participant: they were not a student yet
   in that period. Students past semester 8 count as semester 8, as
   everywhere else in the app.
9. A schedule shows the name the activity has in Kurikulum now. Its
   semester is that of the activity, which Kurikulum never changes.
10. Only a PPKS activity that is still in the Kurikulum list can be
    picked for a new schedule. A schedule whose activity was removed
    later can still be changed and keeps that activity.
11. When the start date of a schedule is changed, the schedule takes
    the academic period that runs on the new start date.
12. A start date before the first stored academic period is refused,
    with a message that says so: no period runs then.
13. "Wajib" is ticked as the Kurikulum activity says when the activity
    is picked, and can then be changed for this schedule alone.
14. Lokasi may be left empty, and is at most 100 characters. An empty
    place shows "-".
15. A new schedule sent a second time with other content, or by another
    person, is refused and nothing is saved, as in Kurikulum.
16. "Hapus jadwal" from a form opened before someone else's change
    still removes the schedule.
17. "Sasaran: (n) mahasiswa" in the form follows the chosen start date:
    it counts the students of the period that runs on that date.

## Steps

- [x] 1. Schedules are stored, each tied to a Kurikulum PPKS activity,
  with who changed it and when and a removal mark. Sample data adds
  past, current and coming schedules.
- [x] 2. The rule for a schedule's status and upload deadline, with
  checks.
- [ ] 3. The tab shows "Jadwal dan kehadiran" with the tahap choice.
- [ ] 4. "Jadwalkan kegiatan PPKS" adds a schedule.
- [ ] 5. "Ubah" changes a schedule.
- [ ] 6. "Hapus jadwal" removes a schedule.
