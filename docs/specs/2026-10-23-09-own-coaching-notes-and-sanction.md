# My coaching, mentoring notes and sanction status

Depends on: My profile, Recording a discipline penalty, Discipline penalty
follow-up, Discipline history in the student detail, Character coaching
list, Mentoring notes
Group: Profil saya

## What we want

Profil saya shows a student what staff have recorded about their
conduct, as the prototype does: their own "Riwayat pelanggaran
disiplin", the sanction beside the name, the card for a running
pembinaan, and the notes the pengasuh wrote. A student sees only their
own and can change none.

## Who it is for

- Mahasiswa: their own records only.

## What should happen

- When a student with discipline penalties opens Profil saya, then
  "Riwayat pelanggaran disiplin" shows under the score cards with "(n)
  catatan" and, per penalty, newest first: the date, the category and
  level, the status, what happened, "Hukuman: (…)", the kerja sosial
  when there is one, and for Ringan and Sedang "nilai karakter paling
  tinggi 70". It shows no "Catat pelanggaran" and not who recorded it.
- When the student has no penalty, then the panel is not shown.
- When a Berat penalty suspends or dismisses the student, then the
  status beside their name shows "Diberhentikan sementara",
  "Diberhentikan permanen" or "Diberhentikan (ayat 8)" instead of
  Aktif, by the same rule as the badge in the staff's student detail.
- When the student is under pembinaan, then a card "Pembinaan (level)"
  shows its status, "Aspek terlemah: (value)", the staff note, and
  "Bicarakan langkah berikutnya dengan pengasuh Anda." With no
  pembinaan, or one that is Selesai, there is no card.
- When they look at "Catatan pengasuhan", then they see "(n) catatan"
  and, per note, the date, the kind, the MEDALI values it touches, the
  text and "Tindak lanjut: (…)" when one was set. With none: "Belum ada
  catatan."
- When there are more than 10 notes, then the first 10 show with
  "Tampilkan semua".
- When a note, a penalty's status or the pembinaan changes in its own
  menu, then the student sees the new state the next time the page is
  opened. Confirmed by a check.
- When a student asks for another student's penalties, notes or
  pembinaan, or sends a hand-made request to change one of their own,
  then it is refused. Confirmed by a check.
- When a panel is read, then the student's browser gets only the fields
  shown, not the staff log and not who recorded a penalty or wrote a
  note. Confirmed by a check.
- When the page is opened on a phone, then each note and each penalty
  is a card with no sideways scroll, and the page shows within about 1
  second.

## Not included

- The staff's discipline panel and badges (already built).
- Dorm violations and their advokasi: they are on Asrama > Pelanggaran.
- Catatan pelanggaran (the notes kept before a discipline penalty).
- A reply or an objection from the student.
- A tick that hides a note or the pembinaan note from the student.

## Decided

1. The student sees every note their pengasuh wrote about them, of every
   kind and follow-up, as in the prototype and as "Mentoring notes"
   already decided.
2. The student sees their own "Pembinaan (level)", "Aspek terlemah" and
   the staff note, in gentle wording, as in the prototype.
3. The status beside the name follows the badge rule of the staff
   detail: "Diberhentikan sementara" ends when the penalty is "Selesai
   dijalani" for a student without an Instansi asal, and for one with an
   Instansi asal when the Keputusan is "Melanjutkan studi"; the other
   two stay.
4. Three new rights in the list of what each role may do, given to
   Mahasiswa only: reading one's own discipline penalties, one's own
   pembinaan, and one's own mentoring notes.
5. The page reads the signed-in student's own records only; nothing in
   the request says which student.
6. The order on Profil saya follows the prototype.

## Steps

- [x] 1. The rights to read one's own discipline penalties, pembinaan
  and mentoring notes are added to the permission list, with their
  checks.
- [ ] 2. The student's own "Riwayat pelanggaran disiplin", and the
  sanction beside the name.
- [ ] 3. The card "Pembinaan (level)".
- [ ] 4. "Catatan pengasuhan" with its empty state and fold.
- [ ] 5. Phone layout and speed of the cards.
