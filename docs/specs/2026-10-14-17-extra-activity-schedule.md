# Extra activity schedule

Depends on: PPKS activity schedule, Attendance photo upload, Attendance verification, Attendance clarification, Special and additional activities, Academic period
Group: Kegiatan

## What we want

Kegiatan karakter gets the tab "Kegiatan tambahan": special or extra
activities for chosen students, classes, one angkatan or several. Staff
schedule them from the Kurikulum list "Kegiatan khusus dan tambahan" and
choose who takes part. The chosen students see them, send photos, and
get them checked exactly like PPKS activities.

## Who it is for

- Schedule, change, remove: Kepala Unit and Pegawai UPK.
- Read: Direktur / Wakil Direktur, Ketua Program Studi (own program) and
  Pengasuh (own mentees).
- Take part: the chosen Mahasiswa.

## What should happen

- When a staff role opens "Kegiatan tambahan", then it looks like the
  PPKS tab with its own intro, the four numbers and "Jadwal dan
  kehadiran", without the tahap choice. Sasaran shows "(n) mahasiswa
  terpilih", "Kelas (list)", "Angkatan (year)" or "Lintas angkatan
  (years)", and "(n) peserta".
- When Kepala Unit or Pegawai UPK presses "Jadwalkan kegiatan tambahan",
  then the schedule form opens with the Kurikulum extra activities and a
  Peserta choice: Per mahasiswa (search and add active students, remove
  with ×), Per kelas ("Cari kelas", tick classes, each with its count),
  Per angkatan (one) or Lintas angkatan (two or more). "Sasaran: (n)
  mahasiswa." updates as they choose.
- When they save with no participant, then nothing is saved and the
  message says "Tentukan peserta kegiatan."; Lintas angkatan with fewer
  than two says "Pilih dua angkatan atau lebih." The date and hour
  messages are those of the PPKS form.
- When they save a valid schedule, then it appears in the table with
  'Jadwal "(name)" disimpan untuk (sasaran).' "Ubah" and "Hapus jadwal"
  work as on the PPKS tab. The schedule keeps the academic period that
  is running on its start date, as a PPKS schedule does, and counts in
  Nilai kehadiran of that period only. Confirmed by a check.
- When a chosen student opens Kegiatan karakter, then the activity shows
  in their three parts and history like a PPKS one. One marked "(tidak
  wajib)" does not count in Nilai kehadiran.
- When that student sends a photo, then it appears in "Verifikasi
  presensi", and the table's Hadir, Menunggu, Kehadiran and "Peserta"
  work as for PPKS. A clarification works the same too, and its panel
  shows on this tab.
- When the participants of a schedule are changed after photos came in,
  then the photos of students taken out stay stored and no longer count,
  as in the prototype. Confirmed by a check.
- When a student who was not chosen sends a photo for it, or Ketua
  Program Studi, Pengasuh or a student sends a schedule by hand, then
  the server refuses. Confirmed by a check.
- When "Simpan jadwal" is pressed twice, then one schedule is saved. A
  schedule always has at least one participant rule. When a student
  chosen Per mahasiswa becomes Non aktif, then they stay listed but are
  no longer counted. Confirmed by a check.
- When the form is used on a phone, then the Peserta choices wrap and
  the class list scrolls inside its own box, with no sideways scroll.
- When the tab opens with sample data on the preview, then it shows
  within about 1 second. The class list shows the first 120 matches of
  the search.

## Not included

- The Kurikulum list "Kegiatan khusus dan tambahan" itself.
- Choosing a whole kelompok pengasuhan as participants; the prototype
  has no such choice.

## Better than the prototype

- Lintas angkatan with one angkatan is refused; the prototype only
  showed a hint and saved it.
- The server works out who takes part, so a hand-made photo upload from
  a student who was not chosen is refused.

## Decided

1. When a class or angkatan is chosen, students who join it later are
   included, as in the prototype.
2. The participants may be changed after photos have come in, as in the
   prototype; photos of students taken out stop counting. No warning
   with a count is built; the prototype has none.

## Decisions made while building

The issue did not say, so these were decided:

3. Nothing of the issue was built before: the schedules could already
   hold a special or additional activity, but none could choose its
   participants.
4. A schedule names its participants one by one: each student, class or
   angkatan chosen. Per angkatan and Lintas angkatan are told apart by
   how many angkatan are chosen: one, or two or more.
5. The sample data holds the prototype's leadership training for
   angkatan 2023 and 2024, which is over, and peer mentoring for classes
   2-01 and 2-02, whose photo upload is open today, so both kinds of
   choice can be tried.
6. Only Aktif students take part, as in a PPKS schedule: one on Cuti,
   Non aktif or removed is not counted, however they were chosen. A
   class or angkatan counts the students who are in it now, so one who
   moves to another class leaves the schedule of the old one.
7. "Kegiatan tambahan" comes right after "Kegiatan PPKS" for every staff
   role that reads it, as in the prototype.
8. As in the prototype, "Rerata nilai kehadiran" is the same mean on both
   tabs, while "Kegiatan terlaksana", "Menunggu verifikasi" and
   "Terjadwal" count only the tab's own kind of activity. So "Menunggu
   verifikasi" on "Kegiatan PPKS" no longer counts photos of extra
   activities.
9. Students chosen one by one show in Sasaran only as a number; the list
   names nobody. "(n) peserta" is the number of Aktif students the
   choice holds, the same for every role, as on the PPKS tab.
10. Classes are listed by name and angkatan from the earliest, as
    "Kelas 2-01, 2-02" and "Lintas angkatan 2023, 2024".
11. As in the prototype, a new schedule starts on Per angkatan with
    nothing picked, the angkatan are offered the newest first, and each
    kind of choice keeps its picks while another is shown. Only the
    picks of the kind shown are saved. Going to Per angkatan keeps the
    first angkatan picked.
12. As in the prototype, a choice that holds no Aktif student today is
    refused with "Tentukan peserta kegiatan.", also when it names a
    class or angkatan that has only students who are not Aktif. The
    class list and the angkatan offer only those with Aktif students,
    and also those a schedule already holds when it is changed.
13. A student chosen Per mahasiswa who is no longer Aktif shows on the
    form as "tidak dihitung", and stays chosen unless taken out with ×.
14. Per angkatan with more than one angkatan, which only a hand-made
    request can send, is refused with "Pilih satu angkatan, atau pilih
    Lintas angkatan." A student who is not stored is refused with
    "Peserta yang dipilih tidak dikenali. Muat ulang halaman, lalu pilih
    peserta lagi." One schedule holds at most 2.000 picks.
15. A schedule stays on its tab: as before, a schedule of a PPKS
    activity cannot be changed to a special or additional one, and the
    reverse is refused too. Each tab's form offers only its own kind of
    activity.
16. As in the prototype, the save message writes the Sasaran with a
    small first letter, as 'Jadwal "Program mentor sebaya" disimpan
    untuk kelas 2-01, 2-02.'

## Steps

- [x] 1. A schedule can hold its participants: students, classes or
  angkatan, and keeps its academic period, as a PPKS schedule does.
  Sample data adds two extra activities.
- [x] 2. The rule that says whether a student takes part, with checks.
- [x] 3. The "Kegiatan tambahan" tab shows the numbers and the table.
- [x] 4. "Jadwalkan kegiatan tambahan" with the Peserta choice, "Ubah"
  and "Hapus jadwal".
- [ ] 5. Students see their extra activities and send photos; Verifikasi
  presensi and clarifications include them.
