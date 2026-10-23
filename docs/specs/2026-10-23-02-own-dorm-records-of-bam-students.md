# Own return, clarification, cleaning, violation and attendance of a student who is also BAM

Depends on: Asrama: Return from leave, Asrama: Dorm attendance
clarification, Asrama: Cleaning assessment, Asrama: Dorm violations,
Asrama: Dorm attendance, Pengaturan: BAM roles for students
Group: Asrama

Urgent: a resident given a BAM role on Pengaturan can today save their own
late return as on time and cancel their own violation before it is
announced, which is a security hole in merged work.

## What we want

Kepala Unit can give a resident a BAM role on Pengaturan. Such a student is
already refused when they record a violation for themselves or decide
their own advokasi. Five other dorm flows do not check this, and they let
the student decide their own case:

- "Verifikasi" or "Tolak" on their own return report (Perizinan asrama,
  "Laporan kembali menunggu"), as BAM - BPHK.
- "Catat sudah kembali" on their own late leave, with any time before the
  limit, as BAM - BPHK. The leave is then saved as Selesai and "Tepat
  waktu".
- "Terima, teruskan ke pengelola" or "Tolak" on their own dorm
  clarification, as BAM - BPHK or BAM - KI.
- "Memenuhi", "Tidak memenuhi" or "Batalkan tugas" on a cleaning duty of
  the room they live in, as BAM - BPHK or BAM - Kerumahtanggaan.
- "Batalkan" on their own violation in "Jadwal publikasi" before its
  announcement hour, by any BAM role that records violations. The
  violation then never counts.

In "Penghitungan kehadiran", the student's own row also has the "Tidak
hadir" toggle, so they mark their own dorm attendance.

The building rules and the specs of dorm violations, advokasi, SP calls,
reductions and the proposal after SP 2 all say a BAM member does not
handle their own case.

## Who it is for

- A resident who also holds a BAM role.
- The other BAM members and Pengelola Asrama, who keep deciding that
  resident's records.

## What should happen

- When a student who is also BAM looks at their own return report, own
  late leave, own dorm clarification, a cleaning duty of their own room,
  or their own violation waiting in "Jadwal publikasi", then no deciding
  button is shown on it: no "Verifikasi", "Tolak", "Catat sudah kembali",
  "Terima, teruskan ke pengelola", "Memenuhi", "Tidak memenuhi",
  "Batalkan tugas" or "Batalkan". The row still shows, with the line
  "Diputus oleh anggota BAM atau pengelola lain."
- When such a request is sent by hand for their own record, then it is
  refused with "Data Anda sendiri diputus oleh anggota BAM atau pengelola
  lain." and nothing changes. This also holds when the student key is
  written in capitals. Confirmed by a check for each of the five actions.
- When they count attendance in "Penghitungan kehadiran", then their own
  row shows its mark with no toggle. A save sent by hand that changes
  their own mark is refused with the same message, and the other rows are
  saved as usual. Confirmed by a check.
- When another BAM member with the right role, or Pengelola Asrama, opens
  the same record, then they decide it as today.
- When a BAM account is not a student, then nothing changes.
- When it is seen on a phone, then the line fits with no sideways scroll.

## Not included

- Recording one's own violation and deciding one's own advokasi, which are
  already refused.
- Pages where a resident who is also BAM sees only the staff screen (a
  separate issue).
- Any change to who may decide a record when the student is not the
  account itself.

## Better than the prototype

- Nothing new. The prototype shows one role at a time through Ganti peran,
  so it never has this case. This follows the building rules and the dorm
  specs that refuse one's own case.

## Decided

1. The own record stays in the list with the line, rather than being
   hidden, so the student sees it is waiting on someone else.
2. One message for every refused action, the same words on screen and
   when sent by hand.
3. "Batalkan tugas" is refused for a duty of the room the student lives
   in, because cancelling a duty is the same as judging it away.
4. In "Penghitungan kehadiran" the own mark is both "Tidak hadir" and its
   note. The own row shows "Hadir" or "Tidak hadir" with the note, and
   the line. A save that changes it keeps the own row as it was, saves
   the other rows, and shows the message.
5. The room the student lives in is their room today, the same room shown
   to them as their own, so a kakak pendamping's room counts too.
6. Only the BAM steps named above are checked. The Pengelola Asrama steps
   on the same records ("Validasi kembali" and the decision on a
   clarification) are left as they are.
7. "Tugas saya" needs no change: it shows none of these BAM buttons.

## Steps

- [x] 1. Return reports and late leaves: the own-record check in
  "Verifikasi", "Tolak" and "Catat sudah kembali", the line on screen, and
  checks.
- [x] 2. Dorm clarifications and cleaning duties: the own-record check in
  deciding a clarification and in judging or cancelling a duty of one's
  own room, the line on screen, and checks.
- [x] 3. Violations and attendance: the own-record check in "Batalkan" in
  "Jadwal publikasi" and for one's own row in "Penghitungan kehadiran",
  and checks.
