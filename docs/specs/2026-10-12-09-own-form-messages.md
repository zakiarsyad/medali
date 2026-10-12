# Own messages on the student and account forms

Kind: fix, found by "Audit: UI of the merged screens"

## What we want

Two forms in Pengaturan let the browser check a field before the app
does. The person then gets the browser's own small note, in the language
of their browser, for example "Please fill out this field." or "Please
match the requested format.", and the app's own message in Bahasa
Indonesia never shows. The forms in Kurikulum already show the app's own
message. After this work these two forms do the same.

What happens today, on a phone and on a computer:

- Pengaturan > Pengguna baru mahasiswa, "Formulir", as Kepala Unit,
  Pegawai UPK and Pengelola Asrama: "Tambah mahasiswa" with an empty
  form, with a NIM of 5 digits, or with a name of 2 letters shows the
  browser's note. "NIM harus 10 digit angka." and "Nama wajib diisi." do
  not show.
- Pengaturan > Pengguna dan peran, "Tambah pengguna", as Kepala Unit:
  "Simpan pengguna" with an empty name or email shows the browser's note.
  "Isi nama lengkap." and "Isi email kedinasan yang benar." do not show.

## Who it is for

Kepala Unit, Pegawai UPK and Pengelola Asrama.

## What should happen

- When "Tambah mahasiswa" or "Simpan perubahan" is pressed with a NIM
  that is not 10 digits, then nothing is saved and the form shows "NIM
  harus 10 digit angka."
- When it is pressed with a name shorter than 3 letters, then nothing is
  saved and the form shows "Nama wajib diisi."
- When "Simpan pengguna" is pressed with a name shorter than 3 letters,
  then nothing is saved and the form shows "Isi nama lengkap."
- When it is pressed with an empty or malformed email, then nothing is
  saved and the form shows "Isi email kedinasan yang benar."
- When a form is refused, then what was typed stays in the fields.
- When either form is used at any size, then no note in another language
  shows.

## Not included

- New rules or new wording for a message. The app's messages stay as they
  are.
- The limit on how many letters a field takes while typing.

## Decided

1. Is the browser's own check switched off, or translated? Switched off
   for these two forms, as in the Kurikulum forms, so the app's own
   message is the only one.

Decided while building, because the issue did not say:

2. "Tambah pengguna" empties its fields only after the account is saved.
   Before this work it was emptied each time it was sent, also when the
   app refused it, for example for an address outside the campus. The
   case "what was typed stays" needs this.

## Steps

- [ ] 1. "Formulir" on Pengguna baru mahasiswa shows the app's own
  message for a wrong NIM and a short name.
- [ ] 2. "Tambah pengguna" on Pengguna dan peran shows the app's own
  message for a short name and a wrong email.
