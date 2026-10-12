# Dorm companions

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
  do not live in a dorm and are not already kakak pendamping are
  offered, and Asrama is set from the student's jenis kelamin.
- When they press "Tetapkan" with Mahasiswa, Asrama and an optional
  Keterangan, then the student appears in the list as Aktif, and a
  message confirms it.
- When the chosen Asrama does not fit the student, then nothing is saved
  and the message says "Asrama Dana Rakca hanya untuk mahasiswa
  perempuan." or "Asrama Cipta Bakti hanya untuk mahasiswa laki-laki."
- When they look at the list, then each row shows Mahasiswa (name, NIM,
  study program, semester), Asrama, Kamar or "Belum diplot", Keterangan
  and Status, with the active ones first. With no kakak pendamping yet,
  it says "Belum ada kakak pendamping."
- When they press "Nonaktifkan" and confirm, then the status becomes
  Tidak aktif and the student leaves their room. "Aktifkan" makes them
  Aktif again, without a room, and is refused for a student who is not
  active.
- When a kakak pendamping's status becomes Cuti or Non Aktif, then they
  become Tidak aktif and leave the room, and stay Tidak aktif until
  "Aktifkan" is pressed. Confirmed by a check.
- When Pengelola Asrama or BAM - Kerumahtanggaan opens Ploting kamar for
  Dana Rakca or Cipta Bakti, then they see a fourth number "Kakak
  pendamping" with how many are placed, active kakak pendamping of that
  dorm without a room are offered in the room cards, and a placed one
  shows the label "Kakak pendamping" and takes one place of the
  kapasitas. The two Wismantara dorms show no such number.
- When they press "Isi otomatis" on a room, then it fills with residents
  only, never with kakak pendamping.
- When a read-only role opens the tab, then they see the note and the
  list without the form or buttons. Ketua Program Studi sees only kakak
  pendamping of their study program, on the list and in the room cards.
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

## Not included

- An Asrama menu for the kakak pendamping themselves.
- Kakak pendamping for the two Wismantara dorms.
- Naming a student who already lives in a dorm.
- Attendance, leave and cleaning for kakak pendamping.

## Better than the prototype

- "Nonaktifkan" asks for confirmation, because it also takes the student
  out of their room.
- A student who lives in a dorm cannot be named, so nobody ends up with
  two rooms.
- Stopping a duty and placing in a room at the same moment cannot both
  win.

## Open questions

None. Settled with the owner: no kakak pendamping for Wismantara, dorm
residents are not offered, Cuti or Non Aktif stops the duty
automatically, and "Isi otomatis" places residents only.

## Steps

- [x] 1. The table for kakak pendamping is added, with sample data of
  two active and one inactive kakak pendamping.
- [x] 2. The rights to see and to manage kakak pendamping are added to
  the permission list, with their checks.
- [ ] 3. The tab shows the note and the list, read only.
- [ ] 4. The form names a kakak pendamping, with the Asrama check.
- [ ] 5. "Nonaktifkan" and "Aktifkan" work, and stopping leaves the room.
- [ ] 6. Ploting kamar offers, labels and counts kakak pendamping.
