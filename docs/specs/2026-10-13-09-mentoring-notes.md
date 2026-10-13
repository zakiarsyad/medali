# Mentoring notes

Depends on: Mentor groups, Student list and detail
Group: Pengasuhan

## What we want

The Pengasuhan menu gets its first tab, "Catatan pendampingan". A mentor
writes a short note each time they accompany a mentee: what kind of
contact it was, which MEDALI values it touched, what was discussed, and
the follow-up they chose. The notes show on the student's detail and
count on the group page.

## Who it is for

- Write: Pengasuh, for the students of the groups they hold today.
- Read only: Kepala Unit and Direktur / Wakil Direktur (every note),
  Ketua Program Studi (their study program only).

## What should happen

- When Pengasuh opens Pengasuhan, then they see the three tabs (the
  other two empty for now), "Catatan baru" and the list "Catatan
  pengasuhan".
- When they fill "Catatan baru", then it asks Mahasiswa (type a name or
  NIM, own active mentees only), Jenis kegiatan (Konseling individu,
  Mentoring kelompok, Apresiasi, Pemantauan kehadiran, Pembinaan
  disiplin, Kunjungan orang tua/wali), Tanggal (today at the start),
  "Nilai yang terkait" (the six MEDALI values, pre-ticked by kind, free
  to change), Catatan and Tindak lanjut (Tidak perlu tindak lanjut,
  Pantau dua pekan, Jadwalkan konseling lanjutan, Rujuk ke psikolog
  kampus, Libatkan orang tua/wali).
- When they press "Simpan catatan" with valid data, then the message
  says "Catatan disimpan untuk (name)." and the note is on top of the
  list.
- When no student is chosen, Catatan is under 5 letters or the date is
  in the future, then nothing is saved and the message says why.
- When anyone with the menu looks at the list, then each note shows
  date, student, kind, value tags, the text, "Tindak lanjut: …" when one
  was chosen, and who wrote it; above it a count per kind and "Semua
  jenis" to filter. 20 notes per page. With none: "Belum ada catatan."
- When a read-only role opens the tab, then they see the line that only
  mentors fill this in, and the list without the form.
- When Pengasuh presses a student's name, then the student detail
  opens with the student's own record and Pengasuh line, as built so
  far, and "Catatan pengasuhan"; other panels join only through
  their own specs. For a student who is not their mentee it is
  refused. This gives Pengasuh no Mahasiswa menu.
- When Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi (own
  program) or Pengasuh (own mentees) opens a student's detail, then
  "Catatan pengasuhan" lists that student's notes with their count, or
  "Belum ada catatan untuk mahasiswa ini."; Pengasuh also sees "Tulis
  catatan", which opens the form with the student chosen. No other role
  gets the notes, on screen or by a hand-made request. Confirmed by a
  check.
- When staff open a group page, then "Catatan pengasuhan 90 hari" shows
  the count for its members.
- When a mentor is replaced later, then old notes keep the old mentor's
  name and the new mentor can read them.
- When Pengasuh sends a note for a student outside their groups, or any
  other role sends a note, then the server refuses it. Confirmed by a
  check.
- When "Simpan catatan" is pressed twice, then one note is saved.
- When the tab opens on a phone, then form and list stack in one column
  with no sideways scroll; on the preview it shows within about 1
  second.

No case was met on `main` before this spec: the page was empty. All of
it is built here.

## Not included

- Notes on Profil saya (My coaching, mentoring notes and sanction
  status) and on dashboards (Dashboard mentoring summary).
- Sending a follow-up on to Konseling or Pembinaan.
- Correcting or removing a saved note; the prototype has neither.

## Better than the prototype

- The writer is the signed-in mentor, not a free "Dicatat oleh" box.
- The list is paged instead of cut off at 40, and has an empty state.
- A future date and a double press are refused.

## Decided

1. A saved note cannot be corrected or removed; the prototype has
   neither. A wrong note is followed by a new one.
2. The student sees every note about them on Profil saya. That view is
   built by "My coaching, mentoring notes and sanction status", not
   here.
3. Notes of the kinds Konseling individu and Pembinaan disiplin are not
   sensitive records, as in the prototype: every note is read by exactly
   the roles under "Who it is for". Real counselling stays in Konseling.
4. A follow-up is not tracked until done. It is a label on the note.
   Tracking would be a later spec.

## Steps

- [x] 1. Notes are stored, with sample notes for the sample groups.
- [x] 2. The rights to write and to read notes are added to the
  permission list, with their checks.
- [x] 3. Pengasuh writes a note with "Catatan baru".
- [x] 4. The list with counts, filter, paging and the read-only view.
- [ ] 5. Pengasuh opens the detail of their own mentees; the detail
  shows "Catatan pengasuhan" and "Tulis catatan".
- [ ] 6. "Catatan pengasuhan 90 hari" on the group page.
- [ ] 7. Double press and the phone layout.
