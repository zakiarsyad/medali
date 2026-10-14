# Dorm cleaning duties

Depends on: Dorm residents and rooms
Group: Asrama

## What we want

The tab Pembersihan asrama gets its places and schedule. Staff keep a
list of shared places per dorm, such as Lapangan Apel or Kamar Mandi,
and on each date give each place to one room, whose residents clean it
together. Each room can also be told to clean itself. Residents see their
room's duties.

## Who it is for

- Change places and schedule: Pengelola Asrama, BAM - BPHK and BAM -
  Kerumahtanggaan.
- Read only: Kepala Unit, Direktur / Wakil Direktur and Ketua Program
  Studi.
- Mahasiswa who live in the dorm, for their own room.

## What should happen

- When staff open Pembersihan asrama, then they see the switch "Semua
  asrama" and one per dorm, the numbers "Tempat pembersihan" and "Tugas
  hari dipilih", the note that one duty belongs to all residents of one
  room, "Tempat pembersihan" per dorm with the number of rooms, and
  "Jadwal pembersihan" for one date with ‹ and ›.
- When they type a name, pick the dorm and press "Tambah tempat", then
  the place is added to that dorm. A name under 3 letters or already
  used there is refused with a message. "Ubah" renames it.
- When they press "Hapus" on a place and confirm, then it leaves the
  list and the schedule from today on, past duties stay, and "Urungkan"
  in the message brings it back.
- When they pick a room for a place and press "Tugaskan", then the row
  shows the room, its number of residents and Terjadwal. Only rooms of
  that dorm are offered. A date before today is refused with a message.
- When they press "Tugaskan semua kamar (dorm) membersihkan kamarnya
  sendiri" and confirm, then every room without that duty that day gets
  one, and the count "(n) dari (m) kamar sudah dijadwalkan" updates.
- When they press "Batalkan tugas" on a duty and confirm, then it
  leaves the schedule.
- When a resident opens Pembersihan asrama, then they see their room
  with its number of residents, "Tugas terjadwal" from today on, and
  "Jadwal dan hasil pembersihan kamar Anda" with the last 20 duties. A
  resident with no room sees "Anda belum tercatat di kamar mana pun."
- When a read-only role opens the tab, then they see the places and the
  schedule without any button.
- When BAM - KI or Pengasuh types the address, then it is refused. When
  a read-only role sends a hand-made change, or a resident asks for
  another room's duties, then the server refuses it. Confirmed by a
  check.
- When "Tugaskan" is pressed twice, or two staff give the same place to
  two rooms at once, then one duty is saved and the other sees a
  message. Confirmed by a check.
- When a room is removed on Ploting kamar, then its past duties stay
  and its duties from today on are cancelled. A resident who changes
  room sees the duties of the new room. Confirmed by a check.
- When the schedule is opened on a phone, then each place shows as a
  card with no sideways scroll.
- When staff open the tab on the preview, then it shows within about 1
  second; the schedule shows one date, and rooms cleaning themselves are
  paged.

## Not included

- Assessment, validation, cleaning again and room scores (spec Cleaning
  assessment).

## Better than the prototype

- Removing a place can be undone, and cancelling a duty asks first.
- Duties of a removed room are cancelled instead of left hanging.
- A room without residents is not offered for a duty.
- A dorm whose rooms are not plotted says so, instead of showing
  invented rooms.

## Decided

1. Wismantara takes no part in cleaning before its rooms are plotted. It
   has no rooms in this work, so it gets no duties, and its part of the
   schedule says its rooms are not plotted. Its places can still be kept.
2. A duty is given only for today or a later date, not for the past.

Decided while building, because the issue did not say:

3. Three new rights: seeing cleaning (Kepala Unit, Direktur / Wakil
   Direktur, Ketua Program Studi, Pengelola Asrama, BAM - BPHK, BAM -
   Kerumahtanggaan), managing places and duties (Pengelola Asrama, BAM -
   BPHK, BAM - Kerumahtanggaan) and seeing one's own room's duties
   (Mahasiswa who live in the dorm).
4. The schedule shows rooms by number and resident count only, never
   names, so Ketua Program Studi sees every dorm's schedule like the other
   read-only roles; nothing about a student is shown.
5. A place's name is 3 to 60 characters, compared without regard to
   capitals and outer spaces; the same name may be used again once the
   place holding it is removed. A place that is removed keeps its name on
   past duties. "Urungkan" is refused with a message when a place of the
   same name was added in the meantime.
6. A removed place drops off the schedule from the day it was removed:
   its duties before that day still show, its duties from that day on do
   not, and "Urungkan" brings them back with it.
7. One place has one duty per date, and one room has one own-room duty
   per date, both kept by the database. A room may have a place and its
   own room on the same date.
8. "Batalkan tugas" is offered for today and later only; a past duty
   stays as history. Cancelling removes the duty.
9. The number of residents of a room is the number Ploting kamar shows
   for it today. A room with no one in it is not offered and does not
   count in "(m) kamar".
10. When a room is removed on Ploting kamar, its duties from today on are
    removed with it, and its past duties keep the room's number.
11. Own-room duties show 20 rooms a page per dorm, ordered by room
    number. The date and the dorm switch are kept in the address.
12. The messages are "Tempat (name) ditambahkan.", "Nama tempat
    diperbarui.", "Tempat (name) dihapus.", "Tempat (name) dikembalikan.",
    "Nama tempat minimal 3 huruf.", "Tempat dengan nama ini sudah ada di
    asrama ini.", "Kamar ditugaskan.", "(n) tugas kamar dijadwalkan.",
    "Semua kamar sudah dijadwalkan.", "Tugas dibatalkan.", "Tanggal
    sudah lewat. Pilih hari ini atau sesudahnya.", "Tempat ini sudah
    ditugaskan ke kamar lain pada tanggal ini. Muat ulang halaman." and
    "Kamar asrama ini belum diploting.".
13. Sample data gets the four places of the prototype in every dorm
    (Lapangan Apel, Ruang Komunal, Ruang Mesin Cuci, Kamar Mandi) and,
    in Dana Rakca and Cipta Bakti, one room with residents per place on
    each day from 3 days before to 3 days after the day the data is
    filled, taken in turn.
14. Every duty shows Terjadwal; the other statuses come with Cleaning
    assessment.

## Steps

- [x] 1. The tables for places and duties are added, with the four
  sample places per dorm and a week of sample duties.
- [x] 2. The rights to see and to manage cleaning are added to the
  permission list, with their checks.
- [x] 3. Places can be added, renamed and removed.
- [ ] 4. The schedule gives places and own rooms to rooms, and cancels
  duties.
- [ ] 5. Residents see their room's duties.
