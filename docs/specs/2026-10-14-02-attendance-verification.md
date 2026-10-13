# Attendance verification

Depends on: Attendance photo upload, Mentor groups, File storage
Group: Kegiatan

## What we want

Pegawai UPK gets the tab "Verifikasi presensi" in Kegiatan karakter to
check the photos students send: validate them, one by one or many at
once, or reject them with a reason. They can also record attendance by
hand, or a dispensation for leave or illness. The "Jadwal dan kehadiran"
table then shows how many came.

## Who it is for

- Verify and record by hand: Pegawai UPK (right "Verifikasi presensi").
  The tab is their first tab.
- See the attendance numbers: every staff role with the Kegiatan PPKS
  tab; Ketua Program Studi and Pengasuh for their own students only.
- Send again after a rejection: Mahasiswa.

## What should happen

- When Pegawai UPK opens "Verifikasi presensi", then they see four
  numbers (Menunggu verifikasi, Divalidasi hari ini, Ditolak, Kegiatan
  hari ini), a choice of activity, a choice of status (Menunggu
  verifikasi at the start, Divalidasi, Ditolak, Semua) and photo cards,
  oldest first, 24 a page: photo, name, NIM, program studi, activity,
  time sent, and "Di luar tanggal kegiatan" when sent outside the
  activity's dates.
- When a photo is shown or opened, then it is tried with a picture with
  no person in it. A preview whose file storage settings are still empty
  keeps no file ("File storage"), so the cases that send or open a file
  are confirmed on a local computer or by a check.
- When nothing matches, then they see "Tidak ada swafoto yang menunggu
  verifikasi." or "Tidak ada data pada filter ini."
- When they press "Validasi" on a card, then it shows "Hadir" with their
  name, and the message "Presensi divalidasi."
- When they choose a reason (Wajah tidak terlihat jelas, Foto bukan dari
  kegiatan ini, Tidak terlihat di lokasi kegiatan, Foto tidak sesuai
  waktu kegiatan, Lainnya) and press "Tolak", then the card shows
  "Ditolak" with the reason. "Lainnya" needs a short note.
- When a student's photo was rejected and the upload time is still open,
  then their card shows "Presensi ditolak: (reason)." and the upload
  button again.
- When they tick cards or "Pilih semua" and press "Validasi (n)
  terpilih", then after confirming, the ticked cards on that page are
  validated and the message says "(n) presensi divalidasi."
- When they open "Catat kehadiran manual atau dispensasi", pick a
  student, one of the student's activities that have started, and Hadir
  (dicatat manual), Dispensasi: izin or Dispensasi: sakit, add a
  Keterangan and press "Simpan", then it is recorded with "Kehadiran
  (name) dicatat." A dispensation is left out of Nilai kehadiran, and
  one without a Keterangan is not saved: "Isi keterangan dispensasi."
  When the student already has a status for that activity, then it is
  shown and they must confirm.
- When a staff role opens "Kegiatan PPKS", then the table also shows
  Hadir, Menunggu and Kehadiran (percent of targeted students,
  dispensations left out, "-" before the start), a "Peserta" button that
  lists the students absent or rejected, and four numbers: Rerata nilai
  kehadiran, Kegiatan terlaksana, Menunggu verifikasi, Terjadwal.
- When a decision is made or attendance is recorded by hand, then a line
  goes into the log that cannot be edited: who, when, before and after.
  Confirmed by a check.
- When Kepala Unit, Penilai Mahasiswa, a student or any other role
  without the right sends a decision or a manual record by hand, then
  the server refuses it. Confirmed by a check.
- When two Pegawai UPK decide the same photo, then the first counts and
  the second sees that it was already decided. A photo that is no longer
  waiting cannot be validated in bulk. Confirmed by a check.
- When Pegawai UPK uses a phone, then cards stack in one column with
  large buttons and no sideways scroll.
- When the tab opens with sample data on the preview, then it shows
  within about 1 second, and photos load as they scroll into view.

## Not included

- Clarifications from students (spec "Attendance clarification").
- Pengasuhan meetings inside Rerata nilai kehadiran (spec "Mentoring
  meetings in the attendance score").
- Changing a decision once made; the prototype has none.

## Better than the prototype

- Rejecting needs a press of "Tolak"; in the prototype, choosing a
  reason from the list rejected at once. "Lainnya" asks for a note.
- Bulk validation asks for confirmation first.
- Cards are paged; the prototype stopped at 60, and "Peserta" at 40.
- A manual record does not silently replace an existing status.
- Every decision goes into the log, because it changes a score.

## Decided

1. Pegawai UPK cannot change a decision once made; the prototype has no
   way. A wrongly rejected student sends again or asks for a
   clarification, and a manual record can replace a status after a
   confirmation.
2. Kepala Unit may manage activities but not verify, as in the
   prototype.
3. Keterangan is required for a dispensation, for example the letter
   number.

## Decisions made while building

Nothing of this was built before. The issue did not say, so these were
decided, from what the merged app does and then from the prototype:

4. The new right is named "Verifikasi presensi" and only Pegawai UPK
   has it. It covers validating, rejecting, recording by hand and
   opening any attendance photo. No other staff role opens a photo:
   between two options for personal data, fewer people see it.
5. The tab "Verifikasi presensi" is new and only Pegawai UPK has it.
   It is their first tab, so Kegiatan karakter opens on it for them.
6. The cards are the attendances for which a photo was sent, of
   schedules that are not removed. A record made by hand has no photo
   and no card. Under "Semua" a card whose status was later replaced by
   a dispensation shows "Dispensasi".
7. The four numbers count over every period. "Menunggu verifikasi" and
   "Ditolak" count the cards in that status, with "foto kehadiran" and
   "perlu kirim ulang" below. "Divalidasi hari ini" counts the cards
   validated on today's date on campus, with "presensi" below.
   "Kegiatan hari ini" counts the schedules held today, with "(n)
   sedang dibuka" below: those whose upload time is open.
8. The choice of activity lists "Semua kegiatan" and the schedules that
   have at least one card, newest first, each as its first day, its
   name and its semester.
9. "Di luar tanggal kegiatan" shows when the day the photo was sent, on
   campus, is before the first or after the last day of the schedule.
10. Where no file is kept for a card, such as on a preview without file
    storage, the card says "Foto tidak tersimpan di sini." in place of
    the picture, and can still be decided.
11. Sample data gets a drawn picture with no person in it for each
    sample attendance that has a time sent, wherever file storage is
    set. This was left to this spec by "Attendance photo upload".
12. A decided card shows its status, the reason of a rejection, and the
    name of the Pegawai UPK who decided it.
13. A rejection keeps its reason as the Keterangan the student sees.
    "Lainnya" is kept as "Lainnya: (note)"; its note is 3 to 200
    characters. Without a reason "Tolak" says "Pilih alasan penolakan.",
    and "Lainnya" without a note says "Isi catatan untuk alasan
    Lainnya." The message after a rejection is "Presensi ditolak:
    (reason)."
14. A photo sent again after a rejection is a new attendance that waits.
    The rejected one stays stored, and the student's page shows the
    newest. Once the upload time has closed, a rejected card of the
    student shows no button.
15. When someone else decided a photo first, the message is "Presensi
    ini sudah diputuskan oleh petugas lain." and the list is read again.
16. "Validasi (n) terpilih" asks "Validasi (n) presensi terpilih?".
    Only ticked cards that still wait are validated. When some were
    decided in the meantime, the message says "(n) presensi divalidasi.
    (m) sudah diputuskan sebelumnya." "Pilih semua" ticks the waiting
    cards of the page shown. At most 24 can be sent at once.
17. In "Catat kehadiran manual atau dispensasi" a student is found by
    name or NIM among the Aktif students. The activities are the
    schedules meant for the student that are not removed and whose
    first day is today or earlier, over every period, newest first.
18. A record made by hand is kept with the Keterangan "Dicatat manual."
    or "Dicatat manual. (keterangan)" for Hadir, and "Izin.
    (keterangan)" or "Sakit. (keterangan)" for a dispensation, as in
    the prototype. Keterangan is at most 200 characters.
19. When the student already has a status for the activity, "Simpan"
    saves nothing and says "(name) sudah berstatus (status) pada
    kegiatan ini. Tekan Simpan lagi untuk menggantinya." A second press
    replaces it. The server asks again when the status has changed in
    between. The newest attendance of the student for that schedule is
    the one replaced, and it keeps its photo.
20. The log is a new table. Each line keeps the attendance, who, when,
    and the status and Keterangan before and after. A first record made
    by hand has nothing before. The database refuses to change or remove
    a line, as for the other logs.
21. On "Kegiatan PPKS", Hadir, Menunggu, Kehadiran and "Peserta" count
    the Aktif students the schedule is meant for, and for Ketua Program
    Studi and Pengasuh only their own among them. Kehadiran is Hadir out
    of those students without the dispensations, as a whole percent,
    and "-" before the first day or when nobody is left to count. The
    Sasaran column stays as it was.
22. "Peserta" shows from the first day on. It opens a line "(n) sasaran.
    (m) tidak hadir atau ditolak." and the names with NIM of the
    students with nothing sent or a rejected photo, by name, 40 a page.
    It is closed with "Tutup".
23. "Rerata nilai kehadiran" is the mean of Nilai kehadiran kegiatan of
    the students the account sees who have one, in the running period,
    with one decimal and "(n) mahasiswa" below, or "-". "Kegiatan
    terlaksana" counts the required schedules that have started, with
    "PPKS wajib" below, and "Terjadwal" those that start after today,
    with "akan datang" below; both follow the tahap chosen. "Menunggu
    verifikasi" counts the waiting photos of the students the account
    sees, with "foto kehadiran" below.
24. The tab keeps the title "Kegiatan karakter" and says under it:
    "Periksa foto kehadiran yang diunggah mahasiswa. Presensi yang
    divalidasi dihitung sebagai hadir dalam nilai kehadiran kegiatan."
    The prototype's words about Penilaian karakter are left out, as
    that is not built. The cards stand under the heading "Verifikasi
    presensi", and the line below them counts "foto".
25. "(n) sedang dibuka" counts every schedule whose upload time is open
    now, also one held on an earlier day, as in the prototype.
26. The sample picture is one drawn landscape with a sun and two hills.
    Each sample attendance gets a copy of its own. It is given after
    the sample data is in: on a local computer by the command that
    makes the file storage ready, and on a preview by the file storage
    step of a deploy. Where the file storage settings are empty none is
    given, and the first deploy after they are filled in gives them.
27. A card whose status is not Menunggu verifikasi shows "Hadir",
    "Ditolak" or "Dispensasi" with what was noted and the name of who
    decided, also when that was a record made by hand.

## Steps

- [x] 1. The right "Verifikasi presensi" is added for Pegawai UPK, with
  its checks, and the log for attendance decisions.
- [x] 2. The tab shows the numbers, the filters and the photo cards.
- [ ] 3. "Validasi" and "Tolak" with a reason; the student sends again.
- [ ] 4. Ticking many cards and "Validasi (n) terpilih".
- [ ] 5. "Catat kehadiran manual atau dispensasi".
- [ ] 6. The Kegiatan PPKS table shows the attendance numbers and
  "Peserta".

