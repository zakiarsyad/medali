# Attendance photo upload

Depends on: PPKS activity schedule, File storage, Academic period
Group: Kegiatan

## What we want

A student opens Kegiatan karakter and sees the activities meant for
their semester. While an activity's upload time is open, they send one
attendance photo that shows them at the activity. The photo waits for
Pegawai UPK to check it. The student sees the status of every activity
in their history.

## Who it is for

Mahasiswa, for their own activities only.

## What should happen

- When a student opens Kegiatan karakter, then they see the intro, four
  numbers (Nilai kehadiran kegiatan, Menunggu verifikasi, Dispensasi,
  Kegiatan berikutnya) and three parts: "Berlangsung dan masa unggah
  foto", "Akan datang" (the next five) and "Riwayat kehadiran".
- When an activity of their semester is running or has its upload time
  open, then it shows as a card with name, dates, hours, place, "Unggah
  foto sampai (date)", description, nilai, its status, and the button
  "Unggah foto kehadiran" while the upload time is open.
- When they press it, then they can take a photo with the phone camera
  or pick an image, see it, and press "Kirim presensi", "Ulangi" or
  "Batal".
- When the upload is tried on a preview or a local computer, then a
  picture with no person in it is used, never a real face. A preview
  whose file storage settings are still empty keeps no file ("File
  storage"): there "Kirim presensi" saves nothing and says photos cannot
  be stored yet. So the cases that send or open a file are confirmed on
  a local computer or by a check.
- When they send an image of at most 8 MB, then the card shows "Menunggu
  verifikasi" and "Foto terunggah (time). Pegawai UPK akan
  memverifikasi.", with the message "Foto kehadiran terunggah. Menunggu
  verifikasi Pegawai UPK."
- When the file is not an image or is larger than 8 MB, then nothing is
  sent and the message says "Berkas harus berupa gambar." or "Ukuran
  foto maksimal 8 MB." When sending fails halfway, then a message says
  so and they can try again.
- When the upload time has closed by the time the photo arrives, then
  nothing is saved and the message says "Masa unggah foto sudah
  ditutup." The server decides this, not the phone. Confirmed by a
  check.
- When a photo is waiting or validated, then there is no upload button.
- When they look at "Riwayat kehadiran", then each past activity of
  the periods in which it was meant for their semester shows its
  date, name ("(tidak wajib)" when so), status (Hadir, Menunggu
  verifikasi, Ditolak, Dispensasi, Tidak hadir, or Belum unggah "sampai
  (date)") and Keterangan, 20 a page.
- When a part has nothing to show, then it says "Tidak ada kegiatan yang
  sedang membuka unggah foto.", "Belum ada jadwal berikutnya." or "Belum
  ada riwayat."
- When "Nilai kehadiran kegiatan" is shown, then it is a percentage with
  one decimal: validated attendances out of required activities that are
  validated or whose upload time has closed, dispensations left out,
  counting only the schedules of the running period that are meant for
  them, with "(h)/(n) kegiatan karakter" below. With none it shows "-"
  and "belum ada kegiatan wajib". Confirmed by a check.
- When a student sends a photo for another student or for an activity
  not meant for them, or anyone who may not see the attendance asks for
  its photo, then the server refuses. Confirmed by a check.
- When "Kirim presensi" is pressed twice, then one photo is kept: a
  student has at most one waiting or validated attendance per schedule.
  When a schedule is removed, then its attendance stays stored but no
  longer counts. Confirmed by a check.
- When a student uses a phone, then cards, camera and history are one
  column with no sideways scroll.
- When the page opens with sample data on the preview, then it shows
  within about 1 second. The photo is made smaller on the phone before
  sending.

## Not included

- Checking the photos, and sending again after a rejection (spec
  "Attendance verification"). Asking for a clarification.
- Pengasuhan meetings inside Nilai kehadiran (spec "Mentoring meetings
  in the attendance score").
- Kegiatan tambahan for the student (spec "Extra activity schedule").
- A clean-up of proof photos, which needs its own spec.

## Better than the prototype

- The phone camera can be used directly; the prototype's camera part was
  left unused and only a file could be picked.
- The server records the time of sending; the prototype wrote the time
  onto the picture in the browser, where it can be faked.
- The size and type are checked again on the server.
- Sample photos are drawn placeholders, never a real face.

## Decided

1. A student cannot replace a photo that is still waiting, as in the
   prototype.
2. Attendance photos are kept. Nothing is removed now.

## Decisions made while building

Nothing of this was built before: Kegiatan karakter was an empty page
for Mahasiswa. The issue did not say, so these were decided:

3. The new right is named "Presensi swafoto", as the prototype's list of
   rights names it, and only Mahasiswa has it. The rights of staff to
   check photos come with "Attendance verification".
4. Four statuses are stored: Menunggu verifikasi, Hadir, Ditolak and
   Dispensasi. Giving the last three is not built here. "Tidak hadir"
   and "Belum unggah" are not stored: they are told from a schedule with
   nothing sent, by whether its upload time has closed.
5. An attendance also keeps a short note, which the history shows as
   Keterangan, such as the reason of a rejection.
6. The database itself refuses a second waiting or validated attendance
   of one student for one schedule.
7. The attendance of a removed schedule stays stored. It is not shown
   and not counted.
8. Sample attendance has no photo at all, so no picture of anyone is
   in the sample data. A photo exists only after a student sends one.
   Drawn placeholders for the sample attendance come with "Attendance
   verification", the first screen that shows photos.
9. The sample data gets seven more schedules, all for the students in
   their second year, so that one sample student has every status in
   their history, an open upload and coming activities.
10. In Nilai kehadiran kegiatan, a required activity whose upload time
    has closed counts as not attended while its photo still waits, was
    rejected, or was never sent. An activity that is not required is
    left out, attended or not. The upload time closes at the end of the
    last upload day, as the status of a schedule already has it.

## Steps

- [x] 1. Attendance is stored per student and schedule, with status,
  photo, time sent, and who decided and when. The right "Presensi
  swafoto" is added for Mahasiswa, with its checks. Sample data adds
  attendance in every status.
- [x] 2. The rule for Nilai kehadiran kegiatan, with checks.
- [ ] 3. The student page shows the numbers and the three parts.
- [ ] 4. "Unggah foto kehadiran" takes or picks a photo and sends it.

