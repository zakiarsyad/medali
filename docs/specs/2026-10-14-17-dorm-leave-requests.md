# Dorm leave requests

Depends on: Dorm attendance, Dorm activities
Group: Asrama

## What we want

Residents ask for leave on Perizinan asrama: Izin pesiar (out for less
than 12 hours, not overnight), Izin Tidak Mengikuti Kegiatan (ITMK, a
time range when they skip dorm activities) or Izin khusus (other needs,
overnight allowed). Pengelola Asrama approves or rejects. Approved leave
changes dorm attendance: activities during Pesiar or Khusus count as
Izin, and during ITMK as Hadir with the note ITMK.

## Who it is for

- Ask and cancel: Mahasiswa who live in the dorm.
- Approve or reject: Pengelola Asrama.
- Read only: BAM - BPHK, Kepala Unit, Direktur / Wakil Direktur and Ketua
  Program Studi (their study program only).

## What should happen

- When a resident opens Perizinan asrama, then they see "Ajukan izin"
  with the three kinds and their rules, "Ketentuan", and "Riwayat izin
  saya".
- When they pick a kind and fill the times, then a note shows the length
  and, for ITMK, which of their dorm activities will count as Hadir.
  Pesiar asks Berangkat, Kembali, Keperluan, Tujuan and Kontak; ITMK asks
  Dari, Sampai and Keperluan; Khusus also asks Jenis keperluan.
- When they press "Ajukan izin" with valid data, then it shows in the
  history as Diajukan and a message says it waits for Pengelola Asrama.
- When the end is not after the start, the start has passed, Pesiar is
  12 hours or more or overnight, the times overlap another pending or
  approved leave, or Keperluan is under 5 letters, then nothing is saved
  and the message says why.
- When they press "Batalkan" on a request still Diajukan and confirm,
  then it becomes Dibatalkan.
- When Pengelola Asrama opens the tab, then they see the numbers
  "Menunggu verifikasi" and "Izin 30 hari terakhir", "Cari nama atau
  NIM", filters by status and kind, and one card per request with the
  student, room, times, length, Keperluan, and Tujuan and Kontak or the
  covered activities. A warning shows when the start has passed or the
  length does not fit the kind.
- When they press "Setujui", then it becomes Disetujui; "Tolak" needs a
  note and makes it Ditolak. The resident sees the result and the note.
- When leave is approved, then dorm activities in its time show Izin
  (Pesiar, Khusus) or Hadir with ITMK for that resident, and BAM cannot
  tick them absent. Izin is left out of the attendance percentage.
- When BAM - BPHK sends a hand-made approval, or a resident asks for
  another's leave, then the server refuses it. Confirmed by a check.
- When "Ajukan izin" is pressed twice, then one request is saved. When
  the resident cancels while Pengelola approves, then whichever comes
  second is refused with a message. Confirmed by a check.
- When a resident uses the form on a phone, then it fits one column with
  no sideways scroll.
- When Pengelola opens the tab on the preview, then it shows within about
  1 second, and the list is paged.

## Not included

- Reporting back, being late and "Sedang di luar" (Return from leave).
- Dashboard numbers (Dorm dashboard).
- The 12 hours of Izin pesiar and the three kinds of leave are
  the prototype's values, to be confirmed by the campus before launch.

## Better than the prototype

- Cancelling asks for confirmation.
- A cancel and an approval at the same moment cannot both win.
- The list is paged instead of cut off at 60.

## Decided

1. Pengelola may approve a request whose start has already passed, with
   the warning, as in the prototype.

Decided while building, because the issue did not say:

## Steps

- [x] 1. The table for leave requests is added, with sample requests in
  every status.
- [x] 2. The rights to ask for and to decide on leave are added to the
  permission list, with their checks.
- [ ] 3. Residents ask for leave and see and cancel their history.
- [ ] 4. Staff see the numbers, filters and cards, read only.
- [ ] 5. Pengelola Asrama approves and rejects.
- [ ] 6. Approved leave changes dorm attendance.
