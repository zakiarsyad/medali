# Dorm companions

Depends on: Dorm residents and rooms
Group: Asrama

## What we want

The tab Kakak pendamping gets its content. Pengelola Asrama names senior
students as kakak pendamping for Asrama Dana Rakca or Asrama Cipta Bakti,
and can stop or restart their duty. A kakak pendamping can then be placed
in a room on Ploting kamar, next to the residents they look after.

## Who it is for

- Name, stop and restart: Pengelola Asrama.
- Place in a room: Pengelola Asrama and BAM - Kerumahtanggaan.
- Read only: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi
  (their study program only) and BAM - BPHK.

## What should happen

- When Pengelola Asrama opens Kakak pendamping, then they see the note
  that explains the role, the form "Tetapkan kakak pendamping" and the
  list "Daftar kakak pendamping" with the number that are aktif.
- When they choose a student in the form, then only active students who
  are not in semester 1 or 2 on Reguler and not already kakak pendamping
  are offered, and Asrama is set from the student's jenis kelamin.
- When they press "Tetapkan" with Mahasiswa, Asrama and an optional
  Keterangan, then the student appears in the list as Aktif, and a
  message confirms it.
- When the chosen Asrama does not fit the student, then nothing is saved
  and the message says "Asrama Dana Rakca hanya untuk mahasiswa
  perempuan." or "Asrama Cipta Bakti hanya untuk mahasiswa laki-laki."
- When they look at the list, then each row shows Mahasiswa (name, NIM,
  study program, semester), Asrama, Kamar or "Belum diplot", Keterangan
  and Status, with the active ones first.
- When they press "Nonaktifkan" and confirm, then the status becomes
  Tidak aktif and the student leaves their room. "Aktifkan" makes them
  Aktif again, without a room. A kakak pendamping whose status becomes
  Cuti or Non Aktif becomes Tidak aktif and leaves the room in the same
  way. Confirmed by a check.
- When Pengelola Asrama or BAM - Kerumahtanggaan opens Ploting kamar for
  that dorm, then they see a fourth number "Kakak pendamping" with how
  many are placed, active kakak pendamping without a room are offered in
  the room cards, and a placed one shows the label "Kakak pendamping"
  and takes one place of the kapasitas.
- When a read-only role opens the tab, then they see the note and the
  list without the form or buttons.
- When Mahasiswa, Pengasuh, BAM - KI or BAM - Kerumahtanggaan types the
  address of Kakak pendamping, then it is refused. When a read-only role
  sends a hand-made change, then the server refuses it. Confirmed by a
  check.
- When "Tetapkan" is pressed twice for the same student, then one kakak
  pendamping is saved; a student is kakak pendamping at most once, kept
  by the database. When one person presses "Nonaktifkan" while another
  places that student in a room, then the second is refused with a
  message. Confirmed by a check.
- When the list is opened on a phone, then each kakak pendamping shows
  as a card with no sideways scroll.
- When the tab is opened on the preview, then it shows within about 1
  second, and the list is paged.

## Already on `main`

An earlier piece of work, "Dorm companions" of 12 October, built every
case above except one part of the second: it offers no student who lives
in any dorm, so a student of Internasional or Pembibitan, who lives in
Wismantara, cannot be named. This spec builds only that part. The other
cases were confirmed again and are left as they are.

## Not included

- An Asrama menu for the kakak pendamping themselves.
- Kakak pendamping for Wismantara.
- Attendance, leave and cleaning for kakak pendamping.
- Showing the kakak pendamping room where a student's own room is shown:
  the Asrama page header, Profil saya and the student lists.

## Better than the prototype

- "Nonaktifkan" asks for confirmation, because it also takes the student
  out of their room.
- Empty state when there is no kakak pendamping yet.
- Stopping a duty and placing in a room at the same moment cannot both
  win.

## Decided

1. Wismantara has no kakak pendamping, as in the prototype.
2. A student who lives in Wismantara (Internasional or Pembibitan) may
   be named kakak pendamping, as in the prototype. Only a resident of
   Dana Rakca or Cipta Bakti, a Reguler student in semester 1 or 2, may
   not.
3. A kakak pendamping who goes on Cuti or becomes Non Aktif becomes
   Tidak aktif and leaves the room.

Decided while building, because the issue did not say:

4. The issue counted on Wismantara having no rooms, so that such a
   student has one room only. The merged app plots Wismantara into
   rooms. So a student still has one room only, as in the prototype:
   one who has a room in Wismantara is not placed as kakak pendamping
   until taken out of it, and one placed as kakak pendamping is not
   placed in a Wismantara room. Each is refused with a message that
   says where the student is placed.
5. A resident of Wismantara who is placed as kakak pendamping is left
   out of "Belum diplot" there, of its number, and of "Isi otomatis",
   as in the prototype.
6. A kakak pendamping who becomes Internasional or Pembibitan keeps the
   duty. One who becomes a resident of Dana Rakca or Cipta Bakti still
   loses it.

## Steps

- [x] 1. A student who lives in Wismantara can be named kakak
  pendamping, and keeps the duty.
- [ ] 2. A student has one room only: as a resident of Wismantara or as
  kakak pendamping.
