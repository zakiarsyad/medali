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

(added while building)

## Steps

- [x] 1. The table for dorm clarifications is added, with sample
  clarifications in every status.
- [ ] 2. The rights to ask, check and decide are added to the permission
  list, with their checks.
- [ ] 3. Residents send a clarification with a file from Riwayat.
- [ ] 4. Klarifikasi kehadiran shows the numbers, filters and cards.
- [ ] 5. BAM checks and Pengelola decides, and attendance changes.
