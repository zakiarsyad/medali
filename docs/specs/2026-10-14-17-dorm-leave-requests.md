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

2. "Overnight" means the leave ends on another day than it starts, by
   campus time (WIB); ending at midnight counts as overnight, as in the
   prototype. ITMK and Izin khusus may go overnight. Any leave lasts at
   most 30 days and starts at most a year ahead.
3. Tujuan and Kontak may be left empty, as in the prototype, and ITMK
   keeps neither. Keperluan holds 5 to 500 letters, not counting spaces
   around it; Tujuan holds at most 200, Kontak at most 100 and the note
   of a decision at most 500.
4. Jenis keperluan of Izin khusus is picked from the prototype's list:
   Sakit atau berobat, Urusan keluarga, Kegiatan lomba atau tugas
   institusi, Keperluan administrasi, Lainnya. Screens show it before
   Keperluan, such as "Urusan keluarga: ...".
5. The note under the times is worked out by the server while they are
   typed: the length, for ITMK the resident's dorm activities it covers,
   and whatever would refuse the times, an overlap among them, as in the
   prototype. "Riwayat izin saya" says for each ITMK how many dorm
   activities it covers.
6. Two requests overlap when one starts before the other ends; one that
   starts as the other ends does not. Only a request that waits or is
   approved holds its time. The requests of one resident are taken one
   after the other, so two that overlap are never both kept, also when
   sent at the same moment.
7. "Ajukan izin" pressed twice keeps one request and answers both the
   same. The same form sent again with other content, or by another
   student, is refused and nothing is saved, as on Kegiatan asrama.
8. Only a student who lives in a dorm today may ask, by the rule the app
   already uses for who lives in which dorm. A request of another
   student is answered as if it were not there.
9. "Batalkan" asks "Batalkan (jenis izin) (berangkat)?" first and says
   "Pengajuan dibatalkan.". "Ajukan izin" says "(Jenis izin) diajukan.
   Menunggu verifikasi Pengelola Asrama.", "Setujui" "Izin disetujui."
   and "Tolak" "Izin ditolak.", as in the prototype.
10. Pengelola Asrama may add a note to an approval too, as in the
    prototype. The resident sees the note of an approval and of a
    rejection under the status; staff see who decided and the note on the
    card.
11. A cancel, an approval or a rejection that comes second is refused
    with where the request stands, such as "Izin ini sudah dibatalkan
    lebih dulu, jadi keputusan Anda tidak disimpan. Muat ulang halaman."
    A card decided on the screen stays in its place with its new status
    and the message until the list is opened again.
12. The staff list starts at Menunggu verifikasi, the soonest start
    first; every other choice shows the latest start first. The status
    choices are Menunggu verifikasi, Disetujui, Ditolak, Dibatalkan and
    Semua; the kind choices Semua jenis, Pesiar, ITMK and Khusus. It shows
    20 cards a page; "Riwayat izin saya" shows 25 a page, the latest start
    first.
13. "Menunggu verifikasi" counts the requests that wait; "Izin 30 hari
    terakhir" counts the approved ones that started in the last 30 days,
    up to now. Both count only the students the account may see.
14. A warning shows only on a request that waits: when its start has
    passed, and when Izin pesiar is 12 hours or more or goes overnight.
15. A card says where the student lives today: their dorm and room,
    "belum diplot", or "Tidak tinggal di asrama". The activities an ITMK
    covers are those of the dorm they live in today.
16. Seeing the requests is a right of its own, held by the roles with the
    tab: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi
    (their own study program only), Pengelola Asrama and BAM - BPHK.
    Deciding is held by Pengelola Asrama only, and asking and cancelling
    by Mahasiswa only. An account that may see the requests sees the
    staff screen.
17. A leave covers a dorm activity when their times overlap: the leave
    starts before the activity ends and ends after it starts, as in the
    prototype.
18. Approved leave decides how a resident counts at an activity it
    covers, whatever the count keeps, also when it was approved after the
    announcement: Izin for Izin pesiar and Izin khusus, which is neither
    Hadir nor Tidak hadir and so is left out of Kehadiran, and Hadir with
    the note ITMK for ITMK. The count itself is not changed, and an
    activity that is not announced stays "Belum diumumkan".
19. In "Penghitungan kehadiran" a participant on approved leave shows
    "Izin" or "Hadir · ITMK", and their box Tidak hadir cannot be ticked;
    a note may still be written. A count sent by hand that marks them
    absent is refused.
20. Rincian lists a participant on Izin as Izin, and one on ITMK as Hadir
    with the note ITMK. The resident's note on how attendance is counted
    says how leave counts.
21. The sample requests belong to the first sample residents by name and
    lie around today, in every status, decided by the sample Pengelola
    Asrama. Three approved ones cover sample activities of the week
    before, so Izin and ITMK show in the sample counts.

## Steps

- [x] 1. The table for leave requests is added, with sample requests in
  every status.
- [x] 2. The rights to ask for and to decide on leave are added to the
  permission list, with their checks.
- [x] 3. Residents ask for leave and see and cancel their history.
- [x] 4. Staff see the numbers, filters and cards, read only.
- [x] 5. Pengelola Asrama approves and rejects.
- [x] 6. Approved leave changes dorm attendance.
