# A sign that a save is running

Kind: fix, found by "Audit: UI of the merged screens"

## What we want

While a save is running, nothing on screen says so. The button cannot be
pressed a second time, which is right, but it looks exactly as before:
same colour, same words, same pointer. On a slow connection the person
cannot tell whether the press was taken. Only "Unggah berkas" says
"Membaca berkas…" and "Menyimpan…". After this work every save and
removal shows that it is running.

What happens today, on a phone and on a computer, for "Simpan indikator
utama", "Simpan nilai dasar", "Simpan" in the PPKS and Penjabaran forms,
"Tambah mahasiswa", "Simpan perubahan", "Simpan pengguna", "Simpan peran"
and each "Hapus": the button is switched off while the save runs and
shows no change.

## Who it is for

Every role that saves or removes something: today Kepala Unit, Pegawai
UPK and Pengelola Asrama.

## What should happen

- When a save or a removal is running, then its button looks switched
  off: paler than usual, and the pointer over it is not the pressing
  hand.
- When the save ends, then the button looks as before and the message of
  the save shows, as today.
- When a button is switched off for any other reason, then it looks the
  same way.
- When "Unggah berkas" reads or saves a file, then "Membaca berkas…" and
  "Menyimpan…" show as today.

Already met before this work: the last case. "Unggah berkas" showed
"Membaca berkas…" and "Menyimpan…" already, and this work leaves the
words alone.

## Not included

- New words on the buttons while they run.
- A bar or a spinner.
- The form fields that are switched off for roles that only read.

## Decided

1. Where is the look set? Once, in the shared button styles, as a named
   value for the pale look, so every button of the app gets it.

Decided while building, because the issue did not say:

2. The look is given to every switched-off button of the app by one rule,
   whatever style the button has, and not style by style. A button style
   added later then gets it without anyone remembering to.
3. The pointer over a switched-off button is the plain arrow, as over the
   switched-off "Sebelumnya" and "Berikutnya" of a list.
4. The box for choosing a file on "Unggah berkas" is not a button, so it
   keeps its look while a file is read or saved.

## Steps

- [x] 1. A switched-off button has its own look, named once and used by
  every button style.
