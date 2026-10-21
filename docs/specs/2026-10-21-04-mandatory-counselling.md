# Mandatory counselling

Depends on: Counselling schedule changes and outcome, Counselling session notes
Group: Konseling

## What we want

"Jadwal konseling" also takes counselling a student did not ask for:
"Penugasan" (konseling wajib from Pembina Disiplin Mahasiswa, after a
discipline penalty) and "Pemanggilan" (a call from Penilai Mahasiswa,
after the character assessment). Konselor sets the time; the student sees
it as "wajib" and may only ask for another time. The sending side later
gets back the status and the time only; its buttons come with the two
sending specs.

## Who it is for

- Set the time, mark the outcome: Konselor, every assignment.
- See their own and ask for another time: Mahasiswa.
- Nobody else reads an assignment here.

## What should happen

- When an assignment arrives, then Konselor sees a card with the Jenis
  "Penugasan" or "Pemanggilan", the status "Menunggu jadwal", the Topik
  ("Pelanggaran disiplin" or "Hasil asesmen karakter"), "Dasar" and
  "Pesan pengirim". It counts in "Perlu dijadwalkan"; the numbers gain
  active per Jenis, and a Jenis filter is added.
- When Konselor presses "Tetapkan jadwal", fills Tanggal, Jam, Cara and
  an optional message and saves, then the status is "Dijadwalkan" at
  once. A weekend or a time already passed is refused with a message.
- When the student opens Konseling, then the assignment shows under
  "Jadwal konseling saya" with the mark "wajib", where it comes from
  ("Konseling wajib dari Pembina Disiplin Mahasiswa" or "Dipanggil
  Penilai Mahasiswa berdasarkan hasil asesmen karakter"), and "Menunggu
  jadwal dari konselor" or the time, Cara, konselor and message. There is
  no "Batalkan", and the student never sees "Dasar" or "Pesan pengirim".
- When the student sends "Minta jadwal ulang" with a date, Jam and
  "Alasan", then the status is "Minta jadwal ulang" and Konselor sees it
  first under "Perlu ditindaklanjuti", with the reason, "Setujui waktu
  ini" and "Tetapkan jadwal".
- When Konselor marks "Selesai" or "Tidak hadir", then it moves to the
  student's "Riwayat".
- When the student's consent is not "Disetujui", then no session form
  opens and the card says consent is needed first.
- When a student has an active voluntary request, then an assignment for
  them can still exist beside it. Confirmed by a check.
- When a student cancels an assignment by hand, or any role but Konselor
  and that student asks by hand for an assignment, its status or its
  time, then the server refuses it. Confirmed by a check.
- When two changes to one assignment happen at the same moment, then the
  first is kept and the other person sees the current state with a
  message. Confirmed by a check.
- When any step happens, then a line goes to the schedule's log that
  cannot be changed. Confirmed by a check.
- When opened on a phone, then the cards and the form fit with no
  sideways scroll; the list shows within about 1 second, 20 cards at a
  time.

## Not included

- The buttons that send ("Tugaskan konseling", "Panggil konseling"), the
  right to send, the link to a penalty or an assessment, and the sender's
  status box: Mandatory counselling from a discipline penalty and
  Students needing coaching build on this one. Until then, sample data
  holds the assignments.
- Cancelling an assignment.
- Referrals from the dorm.

## Decided

1. "Dasar" does not show the full violation text: only Kategori and
   Jenjang, plus what the sender writes in the message. Konselor may not
   read discipline records.
2. An assignment is scheduled without consent; session notes are written
   only while consent is "Disetujui". Konselor asks for consent at the
   first meeting.
3. Konselor cannot cancel an assignment.
4. After "Tidak hadir" nobody acts here; the status stays and the sender
   decides its own follow-up outside Konseling.

## Steps

- [ ] 1. Schedules gain the Jenis, where they come from, "Dasar" and the
  sender's message, with made-up assignments in every status.
- [ ] 2. Konselor sees assignments, the Jenis numbers and filter, and
  sets the time.
- [ ] 3. The student sees assignments as "wajib" and asks for another
  time.
- [ ] 4. Konselor marks the outcome, with the consent rule before a
  session is written.
