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

## Decisions made while building

The issue did not say, so these were decided:

5. The three tabs are "Catatan pendampingan", "Pertemuan dan daftar
   hadir" and "Nilai pengasuhan", as in the prototype. The last two show
   the title and the tabs over an empty area.
6. There are two rights: reading notes (Kepala Unit, Direktur / Wakil
   Direktur, Ketua Program Studi, Pengasuh) and writing them (Pengasuh).
   Pengasuh also gets the right to a student's detail, for the students
   of the groups they hold today only, and no Mahasiswa menu.
7. Pengasuh reads the notes about the students of the groups they hold
   today, whoever wrote them. A mentor who was replaced no longer reads
   the notes of that group, their own included.
8. A note is written only for a mentee who is Aktif. A mentee on Cuti or
   Non aktif keeps the notes written before, and gets no new one.
9. A detail asked for by Pengasuh for a student who is not their mentee
   gets the answer the app already gives outside one's rows: "Mahasiswa
   tidak ditemukan". A note sent for such a student is refused with one
   message, the same for a student who does not exist.
10. The list shows the note saved last first, so a new note is on top
    also when its Tanggal is an earlier day.
11. The count per kind counts every note the account may read, whatever
    kind the list is narrowed to.
12. In the list the student's name is a link for every role that may
    open that student's detail, not only for Pengasuh, as in the
    prototype. The detail opens in the box over the list, and closing it
    returns to the same page and kind.
13. The detail shows the 20 newest notes of the student and the count of
    all of them, and says so when there are more.
14. "Tulis catatan" shows only for a student the account may write for:
    an Aktif mentee of Pengasuh.
15. "Catatan pengasuhan 90 hari" counts the notes whose Tanggal is in
    the last 90 days, today included, about the members the group page
    lists (Aktif and Cuti), whoever wrote them. Every account that may
    open the group page sees it, Pegawai UPK included, as the issue says
    "when staff open a group page". The number is the same for all of
    them: it is not narrowed by which notes the account may read. So a
    role that reads no notes learns how many notes a group has, and
    nothing else: the notes themselves, in the list and in a student's
    detail, still go only to the roles that read notes, within their
    rows.
16. Catatan holds 5 to 1,000 characters, counted without the blanks
    around it. No value needs to be ticked. Any day up to today can be
    chosen; there is no earliest day, beyond what the database can keep.
    A day of a year below 1 and a text with a NUL character, which the
    database cannot keep, are refused with a message.
17. A double press saves once in two ways: the button is off while a
    save is on its way, and the form sends the key of its note, so the
    same form is kept once also when both presses reach the server at
    the same moment. The second press gets the same message. A form
    sent again with its key after any part of it was changed is not a
    double press: it is refused, nothing is saved, and the message says
    to load the page again, look at the list and write a new note if
    still needed. No column was added for this.
18. After a save the text is emptied; the student, kind, day, values and
    follow-up stay for the next note.
19. A Pengasuh who holds no group with Aktif students sees "Catatan
    baru" with a line that says so, in place of the form.
20. Mahasiswa offers the mentees that match once something is typed, 8
    at a time, with a line that says how many more match.
21. Each note shows who wrote it with the gelar. The value tags show the
    colour and the name of each value, not its letter.
22. The notes of a student who was removed in Pengguna baru mahasiswa
    are shown to nobody, like the student.
23. Writing a note adds no line to a change log. A note is never changed
    or removed, and it keeps who wrote it and when.
24. The line under the title leaves out "dan laporan pengasuh" of the
    prototype: that report is not built.
25. The sample data has a note for each of the first three Aktif members
    of every sample group, of each kind in turn, on days in the last 80
    days, by the mentor of that day; a day before the group had a mentor
    gets none. The group whose mentor was replaced also has one older
    note by its earlier mentor.

## Steps

- [x] 1. Notes are stored, with sample notes for the sample groups.
- [x] 2. The rights to write and to read notes are added to the
  permission list, with their checks.
- [x] 3. Pengasuh writes a note with "Catatan baru".
- [x] 4. The list with counts, filter, paging and the read-only view.
- [x] 5. Pengasuh opens the detail of their own mentees; the detail
  shows "Catatan pengasuhan" and "Tulis catatan".
- [x] 6. "Catatan pengasuhan 90 hari" on the group page.
- [x] 7. Double press and the phone layout.
