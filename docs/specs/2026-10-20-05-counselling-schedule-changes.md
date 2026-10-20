# Counselling schedule changes and outcome

Depends on: Voluntary counselling registration
Group: Konseling

## What we want

Once a counselling session is scheduled, either side can change it: the
student asks for another time or cancels, and Konselor moves it. After
the session, Konselor marks it "Selesai" or "Tidak hadir". Finished
schedules move to the student's "Riwayat".

## Who it is for

- Ask for another time and cancel: Mahasiswa, their own schedules only.
- Move and mark the outcome: Konselor, every schedule.
- No other role sees or changes a schedule.

## What should happen

- When a student has a "Dijadwalkan" session, then its card shows the
  date, Jam, Cara, konselor and "Pesan konselor", with "Minta jadwal
  ulang" and "Batalkan".
- When the student sends "Minta jadwal ulang" with a Monday to Friday
  from tomorrow, a Jam and "Alasan", then the session goes back to
  "Diajukan" and Konselor sees "Alasan minta jadwal ulang" on the card.
- When the student presses "Batalkan pendaftaran" on a "Diajukan" or
  "Usulan jadwal lain" request, or "Batalkan" on a scheduled session, and
  confirms, then it becomes "Dibatalkan" and moves to "Riwayat". They may
  register again.
- When Konselor presses "Ubah jadwal" on a "Dijadwalkan" card and saves a
  new Tanggal, Jam, Cara and message, then the student sees the new time
  and the message. A weekend or a time already passed is refused with a
  message.
- When Konselor presses "Tandai selesai" or "Tidak hadir" and confirms,
  then the status changes, the card leaves "Semua yang aktif", and the
  student sees it in "Riwayat".
- When Konselor presses "Tandai selesai" or "Tidak hadir" before the
  session's date, then it is refused with a message.
- When Konselor uses the Status filter, then "Perlu ditindaklanjuti"
  lists "Diajukan" first, by date; the other choices are "Semua yang
  aktif", "Dijadwalkan", "Selesai", "Tidak hadir", "Dibatalkan" and
  "Semua".
- When the student opens Konseling, then "Riwayat" lists their finished,
  missed and cancelled schedules with date, status and Topik.
- When a student cancels or moves another student's session, changes one
  that is already "Selesai", "Tidak hadir" or "Dibatalkan", or marks an
  outcome, or when Pengasuh or Kepala Unit sends a hand-made change, then
  the server refuses it. Confirmed by a check.
- When the student cancels or asks for a new time while Konselor moves or
  marks the same session, then the first change is kept and the other
  person sees the current state with a message. Confirmed by a check.
- When any change happens, then a line goes to the schedule's log that
  cannot be changed. Cancelled schedules are kept, not erased. Confirmed
  by a check.
- When opened on a phone, then the cards and their small forms fit with
  no sideways scroll.
- When the student opens Konseling on the preview, then "Riwayat" shows
  the latest 10 and loads more on request, within about 1 second.

## Not included

- Writing what happened in the session (Counselling session notes).
- Assigned counselling, which a student cannot cancel (Mandatory
  counselling).
- Reminders by e-mail or notification.
- Konselor cancelling a session.

## Decided

1. A student may ask for another time as often as they like; Konselor
   sees each one in the log.
2. Konselor cannot cancel a voluntary session; they move it with a
   message instead.
3. An active schedule stays when the student withdraws their consent,
   and the student may cancel it.
4. The student may cancel a request that shows "Usulan jadwal lain", as
   for "Diajukan".
5. "Ubah jadwal" follows the same date rule as "Usulkan waktu lain":
   Monday to Friday, not a time already passed.

## Steps

- [ ] 1. The statuses "Selesai", "Tidak hadir" and "Dibatalkan" are
  added, with made-up schedules in each; the student asks for another
  time and cancels a request or a session.
- [ ] 2. Konselor moves a session and marks it "Selesai" or "Tidak
  hadir".
- [ ] 3. Konselor's full Status filter and the student's "Riwayat".
