# Voluntary counselling registration

Depends on: Counselling consent
Group: Konseling

## What we want

A student registers for counselling on their own ("Daftar konseling
sukarela"): a topic, a wished date and time, and how to meet. Konselor
sees the request in "Jadwal konseling" and approves the time, or proposes
another that the student accepts or asks to change. Every step is kept in
the schedule's log.

## Who it is for

- Register and answer: Mahasiswa, for themselves only.
- See and schedule: Konselor, every request.
- No other role sees that a student asked for counselling.

## What should happen

- When a student opens Konseling, then below their consent box they see
  "Daftar konseling sukarela" with Topik, Tanggal yang diinginkan, Jam
  (08:30, 10:00, 13:00, 14:30), Cara konseling, "Ceritakan singkat"
  (optional), the consent tick with the full consent text, and "Jadwal
  konseling saya" ("Belum ada jadwal konseling." when empty).
- When they press "Daftar konseling" with a Monday to Friday from
  tomorrow and the tick set, then "Pendaftaran terkirim. Konselor akan
  mengonfirmasi jadwal." shows, the request shows as "Diajukan", and
  their consent becomes "Disetujui" ("Pendaftaran konseling sukarela")
  if it was not already, with a line in the consent log.
- When the date is before tomorrow ("Pilih tanggal mulai besok."), on a
  weekend ("Konseling tersedia Senin–Jumat."), the tick is missing
  ("Centang persetujuan terlebih dahulu.") or a voluntary request is
  still active ("Anda masih punya pendaftaran sukarela yang aktif."),
  then nothing is saved and that message shows.
- When Konselor opens Konseling, then they see "Jadwal konseling" with
  the numbers "Perlu dijadwalkan", "Dijadwalkan 7 hari ke depan" and
  "Menunggu konfirmasi mahasiswa", a Status filter, and one card per
  request: name, NIM, program studi, status, Topik, wished time, Cara,
  "Cerita mahasiswa (rahasia)", the reason for another time if any, and
  "Riwayat langkah". With no card: "Tidak ada konseling pada filter ini."
- When Konselor presses "Setujui waktu ini", then the status becomes
  "Dijadwalkan" with their name as konselor, and the student sees it.
- When Konselor presses "Usulkan waktu lain", fills Tanggal, Jam, Cara
  and an optional "Pesan untuk mahasiswa" and sends it, then the status
  becomes "Usulan jadwal lain" and the student sees the proposal and the
  message with "Terima jadwal ini" and "Minta waktu lain".
- When the student presses "Terima jadwal ini", then it becomes
  "Dijadwalkan". When they press "Minta waktu lain" and send a new time
  with "Alasan", then it goes back to "Diajukan" with the reason shown to
  Konselor.
- When Konselor picks a weekend or a time already passed, or approves a
  wished time already passed, then it is refused with a message.
- When a student sends, reads or answers a request of another student, or
  Kepala Unit, Pengasuh or Pembina Disiplin Mahasiswa sends a hand-made
  request to read or change a schedule, then the server refuses it and
  gives nothing back. Confirmed by a check.
- When "Daftar konseling" is pressed twice, or two people act on one
  request at the same moment, then one request or one change is kept and
  the other person sees the current status with a message. Confirmed by
  a check.
- When any step happens, then a line goes to the schedule's log that
  cannot be changed: who, when, what, status before and after. Confirmed
  by a check.
- When either page is opened on a phone, then the form and the cards
  stack in one column with no sideways scroll.
- When Konselor opens Konseling on the preview, then the list shows
  within about 1 second and loads 20 cards at a time.

## Not included

- Moving or cancelling a request, and marking a session done or missed
  (Counselling schedule changes and outcome).
- Counselling assigned by other roles, and the "Jenis" filter (Mandatory
  counselling).
- The student's name as a link to their details.

## Decided

1. Every Konselor sees every request, as in the prototype.
2. One Konselor may have two sessions at the same date and Jam, as in the
   prototype.
3. The Status filter offers "Perlu ditindaklanjuti" (the default),
   "Semua yang aktif", "Dijadwalkan" and "Semua". The choices for done,
   missed and cancelled come with Counselling schedule changes.
4. Registering with the tick turns a consent that is "Menunggu",
   "Ditolak" or "Dicabut" into "Disetujui"; earlier answers stay in the
   log.

## Steps

- [x] 1. The tables for counselling schedules and their log are added,
  with made-up requests in every status.
- [ ] 2. The rights to register for counselling (Mahasiswa) and to manage
  schedules (Konselor) are added to the permission list, with their
  checks.
- [ ] 3. The student registers and sees "Jadwal konseling saya".
- [ ] 4. Konselor's "Jadwal konseling" shows the numbers, the filter and
  the cards.
- [ ] 5. Konselor approves a time or proposes another; the student
  accepts or asks for another.
