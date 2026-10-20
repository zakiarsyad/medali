# Violation notes

Depends on: Academic period
Group: Pembinaan

## What we want

Pembinaan gets its first working tab, "Catatan pelanggaran". It holds
small violations that have not yet led to a discipline penalty. A note
counts for one semester only. A student with a note already in the same
semester gets "Pelanggaran lanjutan", which tells staff a light
discipline penalty may be next.

## Who it is for

- Write and remove: Pembina Disiplin Mahasiswa and Kepala Unit.
- Read only: Direktur / Wakil Direktur, and Ketua Program Studi (their
  study program only).
- Nobody else, including Pengasuh and the student.

## What should happen

- When Pembina Disiplin Mahasiswa opens the tab, then they see the
  numbers "Catatan aktif", "Pelanggaran pertama", "Pelanggaran lanjutan"
  and "Mahasiswa berulang" (two notes or more) for the running semester,
  the form "Catat pelanggaran", the panel "Ketentuan", and the list.
- When they pick a student in the form, then a box shows that student's
  active notes this semester (date and Uraian), or "Belum ada catatan
  pelanggaran aktif semester ini."
- When they fill Tanggal, Uraian pelanggaran (with ready examples to
  pick), Jenis hukuman (Pembinaan langsung, Teguran or Hukuman lainnya)
  and the optional Keterangan, and press "Simpan catatan", then the note
  shows at the top of the list with a message, and the numbers update.
- When the student has no other note in the semester of that Tanggal,
  then the Kategori is "Pelanggaran pertama"; otherwise "Pelanggaran
  lanjutan". The semester is the academic period that Tanggal
  falls in, read from "Academic period"; this spec has no rule of its
  own for it.
- When no student is picked, Uraian is under 5 letters, "Hukuman
  lainnya" has no text, or Tanggal is in the future or falls in no
  academic period, then nothing is saved and the message says why.
- When they use "Cari nama atau NIM", the Kategori filter, or tick
  "Tampilkan yang sudah tidak berlaku", then the list narrows, or also
  shows notes of past semesters marked "Tidak berlaku". An empty result
  shows "Tidak ada catatan pelanggaran pada filter ini."
- When a student has two or more active notes, then each of their rows
  says how many.
- When they press "Hapus" and confirm, then the note leaves the list and
  the numbers. It is kept as removed, with who and when. Confirmed by a
  check.
- When Direktur or Ketua Program Studi opens the tab, then they see the
  numbers and the list without the form and without "Hapus", and a line
  says who fills the notes. Ketua Program Studi sees only their program.
- When Pengasuh, Mahasiswa, Konselor, Pengelola Asrama or any BAM role
  types the tab's address, then they are refused. When a role that only
  reads sends a hand-made save or removal, or Ketua Program Studi asks
  for a note outside their program, then the server refuses it.
  Confirmed by a check.
- When "Simpan catatan" is pressed twice, then one note is saved. When
  two people remove the same note, then the second sees it is already
  removed. Confirmed by a check.
- When a note is saved or removed, then a line goes to the log that
  cannot be changed: who, when, before and after. Confirmed by a check.
- When the tab is opened on a phone, then the form is one column and
  each note is a card, with no sideways scroll.
- When the tab is opened on the preview, then it shows within about 1
  second, and the list is paged, 25 notes at a time.

## Not included

- The link "Hukuman ringan" on a repeated note (comes with "Recording a
  discipline penalty").
- Changing a saved note; a wrong note is removed and written again.
- Dorm violations on the Asrama page; they are a separate record.
- The number of discipline penalties in the student's box of the form
  (comes with "Recording a discipline penalty").

## Better than the prototype

- The Kategori is worked out by the server from the note's own date,
  not chosen by hand from today's semester.
- A future date is refused.
- Saving twice cannot make two notes.
- The list is paged.

## Decisions

1. The student does not see the notes written about them, as in the
   prototype.
2. Pengasuh does not see these notes, not even for their own mentees,
   as in the prototype.
3. When a note is removed, the Kategori of the student's other notes in
   that semester is worked out again from the notes that remain, so a
   later "Pelanggaran lanjutan" can become "Pelanggaran pertama".

## Steps

- [x] 1. The table for violation notes is added, with sample notes in
  this semester and a past one.
- [x] 2. The right to write violation notes is added to the permission
  list, with its checks.
- [x] 3. The numbers and the list, with search, filter and past notes,
  read only.
- [ ] 4. The form "Catat pelanggaran" with the student's box and
  "Ketentuan".
- [ ] 5. Removing a note.

