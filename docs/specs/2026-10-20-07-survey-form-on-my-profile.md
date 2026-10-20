# The survey form on Profil saya

Depends on: My profile, Mentor groups, Student survey period
Group: Profil saya

## What we want

While Kepala Unit has an evaluation period open, each active student
with a pengasuh finds "Survei kepuasan pengasuhan" at the top of Profil
saya: the eight statements scored 1 to 5 and an optional suggestion.
They may change their answer until the period closes. Answers are never
shown per person.

## Who it is for

- Fill in and change: Mahasiswa who are Aktif and in a mentor group.
- Nobody reads a single student's answer. Staff see only the group
  recap ("Student survey results").

## What should happen

- When a period is Dibuka and such a student opens Profil saya, then
  the card shows the period, "dibuka sampai (date)", their mentor's
  name, "Belum diisi", the eight statements each with buttons 1 to 5,
  the key "1 = Sangat tidak setuju … 5 = Sangat setuju", "Saran untuk
  pengasuh (opsional)" up to 600 characters, and "(n) dari 8 pernyataan
  dijawab".
- When they read the card, then it says answers are not shown per
  person; Kepala Unit, Direktur / Wakil Direktur, Pegawai UPK and Ketua
  Program Studi see only the group recap; and suggestions show to them
  without names only when at least 3 of the group answered.
- When they have answered some statements and refresh, or open the page
  again on the same device before sending, then those answers and the
  suggestion are still filled in. Nothing reaches the server before
  "Kirim survei".
- When they press "Kirim survei" with a statement unanswered, then
  nothing is saved and it says "Pernyataan (n) belum dijawab."
- When they send a complete answer, then the card shows "Terkirim", the
  time, and "Ubah jawaban".
- When they press "Ubah jawaban", then their answers come back for
  editing, with "Batal" to leave them as they were.
- When no period is Dibuka (none, Terjadwal, Ditutup or Berakhir), or
  the student is on Cuti, Non aktif or has no pengasuh, then the card
  is not shown.
- When the period closes while the form is open and they press "Kirim
  survei", then it says "Periode evaluasi sudah ditutup." and nothing
  is saved.
- When "Kirim survei" is pressed twice, or sent from two devices, then
  one answer per student and period is kept, the latest. Confirmed by a
  check.
- When a hand-made request sends an answer for another student, for a
  mentor who is not theirs, with a score outside 1 to 5, or after the
  period, then it is refused. Confirmed by a check.
- When any staff account asks the server for one student's answers,
  then nothing is sent. Confirmed by a check.
- When Kepala Unit presses "Batalkan periode" on a period that already
  has answers, then the question says "Batalkan periode ini? (n)
  jawaban survei yang sudah masuk tidak akan dipakai." After they
  confirm, those answers are kept, marked as not used, and count in no
  recap. Confirmed by a check.
- When Kepala Unit or a read-only role looks at the running period in
  "Evaluasi oleh mahasiswa", then Responden shows "(answers) dari (n)"
  with the percentage.
- When the survey is filled in on a phone, then each statement sits
  above its five buttons, large enough to tap, with no sideways scroll.

## Not included

- Opening, closing and cancelling a period itself; only the answers'
  part of cancelling is here.
- The recap and results ("Student survey results"), and a reminder to
  students who have not answered.
- The scale of 1 to 5, the 600 characters and the 3 answers are the
  prototype's values, to be confirmed by the campus.

## Better than the prototype

- A half-filled form is kept when the page refreshes.
- One answer per student and period is kept by the database, not only
  by the screen.
- The mentor's name shows before sending.

## Decided

1. An answer counts for the mentor named on the card at the latest
   send. An answer already sent stays with the earlier mentor after a
   change of pengasuh, until the student changes it.
2. The answer is stored with the student's identity, so they can change
   it and cannot answer twice, but no screen or export shows it per
   person.
3. Responden on the period card counts the answers sent, with the
   percentage.
4. The cancel question and Responden sit in the Pengasuh area, but stay
   in this spec: they can only be tried once answers exist.

## Steps

- [ ] 1. Survey answers are stored, one per student and period.
- [ ] 2. The right to answer the survey for oneself, with its checks.
- [ ] 3. The card shows the form, keeps a half-filled form on the
  device, and saves a complete answer.
- [ ] 4. "Terkirim", "Ubah jawaban" and "Batal".
- [ ] 5. The closed-period, no-mentor and double-send cases, and the
  refused hand-made requests.
- [ ] 6. "Batalkan periode" names the number of answers and marks them
  as not used; Responden counts the answers.
- [ ] 7. Phone layout for the statements and buttons.
