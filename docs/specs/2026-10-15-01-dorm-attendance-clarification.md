# Dorm attendance clarification

Depends on: Dorm attendance, File storage
Group: Asrama

## What we want

A resident announced as Tidak hadir can explain within 7 days, with a
file as proof. BAM checks it first and either passes it on or rejects
it. Pengelola Asrama then accepts it as present or as on leave, or
rejects it. An accepted clarification changes the attendance at once.

## Who it is for

- Ask: Mahasiswa who live in the dorm, from Kegiatan asrama.
- Check first: BAM - BPHK and BAM - KI.
- Decide: Pengelola Asrama.
- Read only: Kepala Unit, Direktur / Wakil Direktur and Ketua Program
  Studi (their study program only).

## What should happen

- When a resident sees Tidak hadir in Riwayat, within 7 days of the
  activity, then the row has "Ajukan klarifikasi"; after that, "Batas
  klarifikasi lewat".
- When they pick Alasan (Sakit, Urusan keluarga mendesak, Tugas
  institusi atau lomba, Sudah hadir tetapi tidak tercatat or Lainnya),
  write Penjelasan (at least 10 letters), add
  Lampiran (PDF or image, at most 5 MB) and press "Kirim klarifikasi",
  then the row shows "Klarifikasi diajukan" and the number "Klarifikasi
  aktif" goes up. Without a file, or with a wrong type or size, nothing
  is saved and the message says why. The file used is a made-up paper
  or a picture with no person in it. A preview whose file storage
  settings are still empty keeps no file ("File storage"), so the
  cases that send or open a file are confirmed on a local computer or
  by a check.
- When staff open Klarifikasi kehadiran, then they see the numbers
  "Menunggu verifikasi BAM", "Menunggu validasi pengelola", Diterima and
  Ditolak, the note on the flow, "Cari nama atau NIM", a status filter,
  and one card per clarification with student, room, activity, Alasan,
  Penjelasan, Lampiran and every decision so far with who and when.
  BAM - BPHK, BAM - KI and Pengelola Asrama can open the Lampiran;
  Kepala Unit, Direktur and Ketua Program Studi see only that there is
  one.
- When BAM presses "Terima, teruskan ke pengelola", then it becomes
  Diverifikasi BAM. "Tolak klarifikasi" needs a note and makes it
  Ditolak, without going to Pengelola.
- When Pengelola Asrama presses "Terima sebagai hadir" or "Terima sebagai
  izin", then it becomes Diterima and the attendance changes to Hadir or
  Izin, in Riwayat, Rincian and the percentages. "Tolak" needs a note. A
  clarification still waiting for BAM says so to Pengelola.
- When a clarification is rejected and still within 7 days, then the
  resident sees the note and "Ajukan ulang".
- When BAM announces a corrected count without that resident, then
  their waiting clarification closes with the note that the absence was
  withdrawn. Confirmed by a check.
- When Kepala Unit sends a hand-made decision, BAM a hand-made final
  decision, a resident a clarification for another resident or after
  the limit, or anyone but the resident, BAM - BPHK, BAM - KI and
  Pengelola Asrama opens the file of a clarification, then the server
  refuses it. Confirmed by a check.
- When "Kirim klarifikasi" is pressed twice, then one is saved; one
  activity has one waiting clarification per resident, kept by the
  database. When two people decide the same one at once, then the
  second is refused with a message. Confirmed by a check.
- When a resident sends a clarification on a phone, then the form fits
  one column and the file can come from the camera.
- When staff open the tab on the preview, then it shows within about 1
  second, and the list is paged.

## Not included

- A rejected clarification leading to a warning letter (SP), the panel
  "Klarifikasi ditolak dan penetapan SP" and the warning shown to the
  resident. They come with Dorm warning letters.
- Dashboard numbers.
- The 7 days are the prototype's values, to be confirmed by the campus
  before launch.

## Better than the prototype

- The buttons to check and reject cannot be pressed twice, as the final
  decision already cannot.
- A clarification on an absence that BAM withdraws is closed, instead of
  left waiting.
- The list is paged, with an empty state per filter.
- The file opens only for the resident and the roles that decide on it
  (BAM - BPHK, BAM - KI, Pengelola Asrama), since proof of illness is
  health data. The prototype opens it for every role on the tab.

## Decided

1. The 7 days are counted from the activity, as in the prototype: a
   clarification can be sent until the end of the 7th day after the
   activity's date.
2. A rejected clarification can be sent again within the 7 days. Only
   the latest decision per activity counts, as in the prototype. An SP
   that was already issued stays (Dorm warning letters).
3. "Kendala teknis presensi" is dropped for dorm activities. The reasons
   are Sakit, Urusan keluarga mendesak, Tugas institusi atau lomba,
   Sudah hadir tetapi tidak tercatat and Lainnya.

Decided while building, because the issue did not say:

4. Five new rights: seeing the clarifications (Kepala Unit, Direktur /
   Wakil Direktur, Ketua Program Studi for their own program, Pengelola
   Asrama, BAM - BPHK, BAM - KI), asking one (Mahasiswa), checking one
   (BAM - BPHK, BAM - KI), deciding one (Pengelola Asrama) and opening
   the file (BAM - BPHK, BAM - KI, Pengelola Asrama).
5. Pengelola Asrama does not check in BAM's place. A clarification that
   still waits for BAM tells Pengelola "Menunggu verifikasi Badan Asrama
   Mahasiswa sebelum dapat divalidasi.", as in the prototype.
6. Only an activity Riwayat shows as Tidak hadir can be clarified: its
   absence is announced, the activity is over and no approved leave
   covers it. A second "Kirim klarifikasi" while one waits saves nothing
   and says "Klarifikasi terkirim."
7. A clarification closed by "Umumkan ulang" gets a fifth status,
   Ditutup, with the note "Ketidakhadiran dibatalkan BAM pada
   pengumuman ulang." and the BAM member who announced. It is in the
   status filter but not in the four numbers. If a later announcement
   marks the resident absent again, they may ask again within the 7 days.
8. An accepted clarification makes the resident Hadir or Izin whatever
   the count keeps, as approved leave does; leave that covers the
   activity decides first. Riwayat and Rincian show the note
   "Klarifikasi: (alasan)". Izin counts as neither Hadir nor Tidak hadir.
9. Every check, decision and closing adds a line to a log that the
   database refuses to change.
10. The file, Penjelasan and Catatan follow the character activity
    clarification: PDF, JPG or PNG of at most 5 MB, checked by name, size
    and content, a picture made smaller in the browser, Penjelasan of 10
    to 1,000 characters, Catatan of at most 200. The file field is not
    forced to the camera, so a PDF can still be picked; a phone offers
    its camera there.
11. The roles that only read see Penjelasan, and for Lampiran only
    "Terlampir", without the file's name. The resident sees "Lampiran:
    (name)" under their row and can download their own file.
12. The cards are newest first, 20 a page. The status filter starts at
    Diajukan, where BAM starts, and offers Semua status, Diajukan,
    Diverifikasi BAM, Diterima, Ditolak and Ditutup. The search and the
    filter are kept in the address. Each filter has its own empty words.
    The numbers count every clarification the account sees, whatever the
    filter.
13. A card shows where the resident lives today, then "Verifikasi BAM"
    and "Keputusan", each with who and when, as in the prototype. A card
    decided on the screen keeps its place with its new status and
    message until the page is read again.
14. The messages are "Klarifikasi diterima dan diteruskan ke Pengelola
    Asrama.", "Klarifikasi diterima; status kehadiran diperbarui.",
    "Klarifikasi ditolak.", "Tulis alasan penolakan di kolom catatan.",
    "Klarifikasi ini sudah diputuskan oleh petugas lain. Muat ulang
    halaman.", "Klarifikasi ini masih menunggu verifikasi Badan Asrama
    Mahasiswa." and "Batas klarifikasi sudah lewat."; the form's file
    messages are those of the character activity clarification.
15. Sample data gets clarifications of the sample absences of the week
    before today, of residents without sample leave: one absence left to
    ask, one each Diajukan, Diverifikasi BAM, Diterima as hadir, Diterima
    as izin, Ditolak by BAM and Ditolak by Pengelola, and one Ditutup on
    the corrected count. They are checked by the sample BAM - BPHK and
    decided by the sample Pengelola Asrama, each with the drawn paper
    "surat-keterangan.pdf".
16. "Tercatat tidak hadir" now says "dapat diklarifikasi", the note on
    how attendance is counted gains the 7-day sentence, and Riwayat ends
    with "Klarifikasi diverifikasi Badan Asrama Mahasiswa lalu divalidasi
    Pengelola Asrama.", as in the prototype.

## Steps

- [x] 1. The table for dorm clarifications is added, with sample
  clarifications in every status.
- [x] 2. The rights to ask, check and decide are added to the permission
  list, with their checks.
- [x] 3. Residents send a clarification with a file from Riwayat.
- [x] 4. Klarifikasi kehadiran shows the numbers, filters and cards.
- [x] 5. BAM checks and Pengelola decides, and attendance changes.
