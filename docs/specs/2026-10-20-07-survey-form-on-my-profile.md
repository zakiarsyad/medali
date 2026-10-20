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

## Decisions made while building

5. An answer is stored as one record: the survey period, the student,
   the group and the mentor named on the form at the latest send, the
   eight scores in the order of the statements, the suggestion when
   there is one, and when it was sent. The database itself refuses a
   second answer of one student in one period, a score outside 1 to 5,
   a score left empty, more or fewer than eight scores, and a suggestion
   longer than 600 characters or of spaces only.
6. The eight statements, the scale of 1 to 5 with its words, the 600
   characters and the 3 answers are kept with the shared mentoring
   rules, because Profil saya and the tab "Evaluasi oleh mahasiswa"
   both read them.
7. Filling in and changing one's own answer is one new right, held by
   Mahasiswa only. The list of rights that Kepala Unit sees names it
   "Mengisi dan mengubah survei kepuasan pengasuhan sendiri". No role
   gets a right that reads one student's answer.
8. The card stands at the top of Profil saya, above the student's
   record, as in the prototype. Under its title it reads "Periode
   evaluasi (periode) · dibuka sampai (date) · pengasuh Anda: (name)",
   with the badge "Belum diisi". The mentor is named with the gelar, as
   the record names them.
9. The words on who sees what name the four roles of the spec, where
   the prototype names Kepala Unit only: "Jawaban Anda tidak
   ditampilkan per orang: Kepala Unit, Direktur / Wakil Direktur,
   Pegawai UPK, dan Ketua Program Studi hanya melihat rekap kelompok,
   dan saran ditampilkan tanpa nama bila responden kelompok minimal 3
   orang."
10. A half-filled form is kept in the browser of the device, one per
    student and period, only until the first answer is sent, and is
    forgotten then. A browser that keeps nothing, as a private window
    may, simply loses it on a refresh; the page still works.
11. A statement left unanswered is told on the device before anything
    is sent, and the server checks it again. A suggestion loses the
    spaces around it; one of spaces only is no suggestion; one longer
    than 600 characters is refused with "Saran untuk pengasuh paling
    banyak 600 karakter." A kept answer is told with "Terima kasih.
    Survei kepuasan pengasuhan terkirim.", as in the prototype.
12. Once sent, the card reads "Terima kasih, jawaban Anda untuk (name)
    terkirim (date and time). Anda masih dapat mengubahnya sampai
    periode ditutup.", as in the prototype, naming the mentor the answer
    counts for. While an answer is changed the badge reads "Ubah
    jawaban", as in the prototype, and "Batal" shows only then. A change
    that is not sent yet is not kept on the device.
13. The server checks a send in this order: the right, the answers,
    the period, then the pengasuh. A period that is not Dibuka, or an
    id that names none, gets "Periode evaluasi sudah ditutup." A mentor
    who is not the student's pengasuh today, as after a change of
    pengasuh while the form was open, gets "Pengasuh Anda sudah
    berganti. Muat ulang halaman, lalu kirim lagi." A student who is no
    longer Aktif or has no pengasuh gets "Anda tidak dapat mengisi
    survei kepuasan pengasuhan." A score that is not a whole number of
    1 to 5 counts as not answered. Which student answers is never read
    from what was sent.
14. Of two sends at the same moment the later waits for the earlier
    and then replaces it. A close or a cancel at the same moment as a
    send waits for the send, so an answer is never kept after the
    period stopped running. "Kirim survei" is off while a send is on
    its way.
15. Responden counts the answers of the students who can answer now:
    the Aktif members of the groups in force that the account counts,
    so Ketua Program Studi sees their program's only. It reads "(answers)
    dari (n) (share%)", the share rounded to a whole number, as in the
    prototype. With no student to answer it reads "0 dari 0", without a
    share. A student who answered and went on Cuti later is not counted.
16. The cancel question counts every answer of the period. Without
    answers it stays "Batalkan periode ini?", as in the prototype. The
    answers of a cancelled period get no mark of their own: the cancel
    mark of their period, with who and when, marks them as not used,
    and every count of answers leaves them out.
17. On a phone each statement takes the whole width with its five
    buttons under it, sharing the width, each at least 44 pixels high
    and wide. On a computer a statement stands beside its buttons
    where they fit, as in the prototype. The buttons are radio buttons,
    so a screen reader names each statement and its choice.

## Steps

- [x] 1. Survey answers are stored, one per student and period.
- [x] 2. The right to answer the survey for oneself, with its checks.
- [x] 3. The card shows the form, keeps a half-filled form on the
  device, and saves a complete answer.
- [x] 4. "Terkirim", "Ubah jawaban" and "Batal".
- [x] 5. The closed-period, no-mentor and double-send cases, and the
  refused hand-made requests.
- [x] 6. "Batalkan periode" names the number of answers and marks them
  as not used; Responden counts the answers.
- [x] 7. Phone layout for the statements and buttons.
