# Attendance clarification

Depends on: Attendance verification, File storage
Group: Kegiatan

## What we want

A student marked Tidak hadir at a character activity, or whose photo was
rejected, can ask for a clarification with a reason, an explanation and
a supporting file. Penilai Mahasiswa checks it in Kegiatan karakter and
accepts it as present, accepts it as a dispensation, or rejects it. An
accepted clarification changes the attendance at once.

## Who it is for

- Ask: Mahasiswa, for their own activities.
- Decide: Penilai Mahasiswa (right "Verifikasi dan validasi klarifikasi
  kegiatan karakter").
- Read: Kepala Unit, Pegawai UPK, Direktur / Wakil Direktur, Ketua
  Program Studi (own program) and Pengasuh (own mentees).

## What should happen

- When a student looks at "Riwayat kehadiran", then an activity with
  Tidak hadir or Ditolak shows "Ajukan klarifikasi" while the
  clarification time is open, and "Batas klarifikasi lewat" after it. A
  note below the table explains the 7-day limit and who checks.
- When they press it, then a form opens in that row with Alasan (Sakit,
  Urusan keluarga mendesak, Tugas institusi atau lomba, Kendala teknis
  presensi, Sudah hadir tetapi tidak tercatat, Lainnya), Lampiran (PDF
  atau gambar, maks. 5 MB), Penjelasan, "Kirim klarifikasi" and "Batal".
- When they send an explanation of at least 10 letters with a file, then
  the row shows "Klarifikasi diajukan" and the message "Klarifikasi
  terkirim."
- When a file is sent or opened, then a made-up paper with no real
  person's data is used. A preview whose file storage settings are still
  empty keeps no file ("File storage"): there "Kirim klarifikasi" saves
  nothing and says files cannot be stored yet. So the cases that send or
  open a file are confirmed on a local computer or by a check.
- When something is missing or wrong, then nothing is sent and the
  message says "Tulis penjelasan minimal satu kalimat.", "Lampirkan
  dokumen pendukung.", "Lampiran harus berupa PDF atau gambar." or
  "Ukuran lampiran maksimal 5 MB."
- When Penilai Mahasiswa opens Kegiatan karakter, then they see the page
  "Klarifikasi kehadiran": four numbers (Menunggu verifikasi, Diterima,
  Ditolak, Batas pengajuan 7 hari), the flow in one sentence, "Cari nama
  atau NIM", a status choice (Diajukan at the start) and a card for
  each: student, activity and time, Alasan, Penjelasan, Lampiran, time
  sent and the decision. 20 a page. With none: "Tidak ada klarifikasi
  pada filter ini."
- When they press the file name, then the file opens in the page with
  "Unduh" and "Tutup".
- When they press "Terima sebagai hadir" or "Terima sebagai dispensasi",
  then the card shows Diterima with the decision, their name and the
  time, the student's attendance becomes Hadir or Dispensasi, and Nilai
  kehadiran follows. The message says "Klarifikasi diterima; status
  kehadiran diperbarui."
- When they press "Tolak" without a Catatan, then nothing changes and
  the message says "Tulis alasan penolakan di kolom catatan." With one,
  the student sees "Klarifikasi ditolak" with the note, and "Ajukan
  ulang" while the time is open.
- When a reading role opens "Kegiatan PPKS", then a panel "Klarifikasi
  kehadiran" shows the latest six of their students with counts per
  status. Each shows the student, the activity, Alasan, the status and
  the decision, without Penjelasan and without the file: only the
  student and Penilai Mahasiswa open the file, and a reading role that
  asks for it by hand is refused. Confirmed by a check.
- When Pegawai UPK, Kepala Unit or a student sends a decision by hand,
  or a student asks for another student or for an activity they
  attended, then the server refuses. Every decision goes into the log
  that cannot be edited. Confirmed by a check.
- When "Kirim klarifikasi" is pressed twice, then one is sent: at most
  one open clarification per student and activity. When two Penilai
  Mahasiswa decide the same one, then the second sees it was already
  decided. Confirmed by a check.
- When the form or the cards are used on a phone, then they are one
  column with no sideways scroll.
- When the page opens with sample data on the preview, then it shows
  within about 1 second.

## Not included

- Clarifications for Asrama activities (spec "Dorm attendance
  clarification").
- The limit of 7 days is the prototype's value, to be confirmed by the
  campus before launch.
- Clarifications on Tugas saya (spec "My tasks: clarifications and
  cleaning assessments").

## Better than the prototype

- Only PDF, JPG and PNG are accepted; the prototype took any image kind,
  including ones that can carry code.
- The clarification time is checked on the server when the form arrives.
- The cards are paged, and one press of a decision button counts once.

## Decided

1. The 7-day limit starts when the upload time ends: a clarification
   can be sent until the end of the 7th day after the last upload day.
   The note and the fourth number say so.
2. Only the student and Penilai Mahasiswa open the file. The reading
   roles see the reason and the decision.
3. Penilai Mahasiswa does not get the Kegiatan PPKS tab.

## Decisions made while building

Nothing of this was built before. The issue did not say, so these were
decided, from what the merged app does and then from the prototype:

4. The new right is named "Verifikasi dan validasi klarifikasi kegiatan
   karakter" and only Penilai Mahasiswa has it. A student asks under the
   right they already have for their attendance, "Presensi swafoto".
5. "Klarifikasi kehadiran" is a new tab of Kegiatan karakter that only
   Penilai Mahasiswa has, as "Verifikasi presensi" is for Pegawai UPK.
   It is their only tab, so Kegiatan karakter opens on it.
6. Three statuses are stored: Diajukan, Diterima and Ditolak. An
   accepted one also keeps whether it was accepted as present or as a
   dispensation. A clarification asked again after a rejection is a new
   one; the rejected one stays stored, and the student's row shows the
   newest.
7. A student can ask when their newest attendance for the activity is
   Ditolak, or when nothing was sent and the upload time has closed. A
   photo that waits, Hadir, Dispensasi and Belum unggah cannot be
   clarified. Only an Aktif student can ask.
8. Accepting changes the student's newest attendance for the activity,
   or records one when nothing was sent, with the Keterangan
   "Klarifikasi: (alasan)", as in the prototype. It also adds a line to
   the log of attendance decisions, like every other change of an
   attendance.
9. When the student's attendance has become Hadir or Dispensasi in the
   meantime, such as by a record made by hand, the clarification cannot
   be accepted: the message names the status, and it can be rejected
   with a note. A photo that waits is replaced by the acceptance.
10. The log of clarification decisions is a new table: the
    clarification, who, when, the status before and after, how it was
    accepted and the note. The database refuses to change or remove a
    line, as for the other logs.
11. The file is a PDF, a JPG or a PNG of at most 5 MB, checked by its
    name, its size and what it holds. The browser makes a picture
    smaller before sending, as for an attendance photo. The app's limit
    for one sent form goes from 2 MB to 6 MB so that a 5 MB PDF arrives;
    every other form still refuses its own files by their own limits.
12. Penjelasan is 10 to 1,000 characters and Catatan at most 200. A
    Catatan is kept with an acceptance too when one is written.
13. The four numbers count every clarification of activities that are
    not removed, over every period. The cards are newest first. The
    status choice has Semua status, Diajukan, Diterima and Ditolak. The
    search and the choice are kept in the address of the page.
14. A card shows no link to the student's detail: Penilai Mahasiswa has
    no right to open it.
15. The panel on "Kegiatan PPKS" shows only when the account sees at
    least one clarification, as in the prototype. Its line counts
    "(n) menunggu Penilai Mahasiswa · (n) diterima · (n) ditolak". It
    follows the students the account sees there, not the tahap chosen.
16. The clarification of a removed activity is not shown, not counted
    and cannot be decided.
17. Sample data gets clarifications in every status, each with a drawn
    paper that says "Lampiran contoh", given by the same command and
    deploy step that give the sample attendance photos.

## Steps

- [x] 1. Clarifications are stored with their file, status and decision.
  The right to decide is added for Penilai Mahasiswa, with its checks.
  Sample data adds some in every status.
- [ ] 2. The rule for the clarification time, with checks.
- [ ] 3. The student asks from "Riwayat kehadiran", and asks again.
- [ ] 4. Penilai Mahasiswa sees the page and opens files.
- [ ] 5. Accept as present or as dispensation, or reject with a note.
- [ ] 6. The Kegiatan PPKS tab shows the "Klarifikasi kehadiran" panel.
