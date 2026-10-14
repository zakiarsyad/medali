# Return from leave

Depends on: Dorm leave requests, File storage
Group: Asrama

## What we want

After Izin pesiar or Izin khusus, the resident reports back with a photo
taken at the dorm. BAM - BPHK checks it and Pengelola Asrama confirms
it, and a late return is recorded in minutes. Staff can also record a
return directly, and see who is still out and who is late.

## Who it is for

- Report back: Mahasiswa who live in the dorm.
- Check the report and record a return: BAM - BPHK.
- Confirm the report and record a return: Pengelola Asrama.
- Read only: Kepala Unit, Direktur / Wakil Direktur and Ketua Program
  Studi (their study program only).

## What should happen

- When approved Pesiar or Khusus leave is 30 minutes or less from its
  return time, then the resident sees "Lapor kembali ke asrama" in
  "Riwayat izin saya"; before that, "Lapor kembali dibuka (time)". ITMK
  needs no report.
- When they take a photo with the camera and press "Kirim laporan
  kembali", then the report shows "Menunggu verifikasi BAM" and "Tepat
  waktu" or "Terlambat (n) menit", measured against the return time.
  The upload is tried with a picture with no person in it. A preview
  whose file storage settings are still empty keeps no file ("File
  storage"), so the cases that send or open a photo are confirmed on a
  local computer or by a check.
- When BAM - BPHK presses "Verifikasi", then it moves to Pengelola
  Asrama. "Tolak" needs a note; the resident sees the note and sends a
  new photo.
- When Pengelola Asrama presses "Validasi kembali", then the leave
  becomes Selesai with the time of the report as the actual return, and
  dorm activities up to that actual return count as Izin, as in the
  prototype; "Tolak" needs a note. A report still waiting for BAM says
  so to Pengelola.
- When Pengelola or BAM - BPHK sets "Waktu kembali" and presses "Catat
  sudah kembali" on leave that is out and has no waiting report, then it
  becomes Selesai, with who recorded it. A time in the future or before
  departure is refused with a message.
- When staff look at Perizinan asrama, then they see the numbers "Sedang
  di luar" and "Terlambat kembali", the number of waiting reports, and
  the filters "Laporan kembali menunggu", "Sedang di luar" and
  "Terlambat kembali". A card of leave that has started and has no
  return shows "Di luar asrama", and Terlambat once the return time has
  passed. Each card shows the photo, both decisions and who made them.
- When someone opens a report photo, then only the resident and the
  roles that may see that leave can open it. Confirmed by a check.
- When Kepala Unit sends a hand-made verification, BAM - BPHK a
  hand-made validation, or a resident a report for another's leave or
  before it opens, then the server refuses it. Confirmed by a check.
- When BAM rejects while Pengelola validates the same report, or two
  staff record the same return, then the second is refused with a
  message. "Kirim laporan kembali" pressed twice saves one report.
  Confirmed by a check.
- When a resident reports back on a phone, then the camera view and
  button fit the screen with no sideways scroll. When the camera is not
  allowed, then a message says how to allow it.
- When Pengelola opens the "Sedang di luar" filter on the preview, then
  it shows within about 1 second, and the list is paged.

## Not included

- Late returns turning into violations.
- Dashboard numbers.
- A clean-up of proof photos, which needs its own spec.
- The 30 minutes before the return time are the prototype's values, to
  be confirmed by the campus before launch.

## Better than the prototype

- The time of a report is set by the server when it arrives, not by the
  phone, so it cannot be faked.
- A rejected report says why and offers to send a new photo at once.
- A report without camera permission explains what to do, instead of an
  empty box.
- Two staff cannot record or decide the same return twice.

## Decided

1. The photo is taken with the camera only, not picked from the
   gallery, as in the prototype.
2. A late return does not become a violation by itself; BAM records one
   by hand.
3. Leave covers dorm activities until its actual return once there is
   one, as in the prototype, so a late resident shows Izin for what they
   missed and an early one is counted again from their return. The late
   return itself is recorded in minutes.
4. A report photo is kept as long as its leave record. No removal is
   built now.

## Steps

- [x] 1. Leave keeps its report, checks and actual return time, with
  sample reports in every state.
- [x] 2. The rights to check, confirm and record a return are added to
  the permission list, with their checks.
- [x] 3. Residents send the report photo and see its state.
- [x] 4. BAM - BPHK verifies and rejects; Pengelola validates and
  rejects.
- [x] 5. "Catat sudah kembali" records a return directly.
- [ ] 6. The out and late numbers, labels and filters show.
