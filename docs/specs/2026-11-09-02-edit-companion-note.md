# Edit companion note

Group: Asrama

## What we want

On Asrama › Kakak pendamping, each row of "Daftar kakak pendamping" gets
an "Ubah" button. It opens a small form where the Keterangan can be
changed. Today the Keterangan can only be written once, when the kakak
pendamping is named.

## Who it is for

- Change: Pengelola Asrama.
- Read only, with no button: Kepala Unit, Direktur / Wakil Direktur,
  Ketua Program Studi and BAM - BPHK.

## What should happen

1. When Pengelola Asrama opens Kakak pendamping, then every row, Aktif
   or Tidak aktif, shows "Ubah" next to "Nonaktifkan" or "Aktifkan".
2. When they press "Ubah", then a form opens with the student's name and
   the current Keterangan already filled in.
3. When they change the Keterangan and press "Simpan", then the form
   closes, the new Keterangan shows in the list, and a message confirms
   it.
4. When they empty the Keterangan and press "Simpan", then the list
   shows "-".
5. When the Keterangan is longer than 100 characters, then nothing is
   saved and the form says so, the same limit as "Tetapkan".
6. When a read-only role opens the tab, then there is no "Ubah". When a
   read-only role sends a hand-made change, then the server refuses it.
   Confirmed by a check.
7. When the form is opened on a phone, then it fits the screen with no
   sideways scroll.

## Not included

- Changing the Mahasiswa or the Asrama of a kakak pendamping.
- A history of past Keterangan.

## Decided

1. "Ubah" shows on every row, Aktif and Tidak aktif.
2. "Ubah" changes only the Keterangan. Changing the Asrama would also
   move the student out of their room, so it is its own piece of work.

## Steps

- [x] 1. The server action that saves a new Keterangan, with its
  permission and length checks.
- [x] 2. "Ubah" on each row, with its form and message.
