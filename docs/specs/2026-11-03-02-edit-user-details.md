# Edit user details

## What we want

On Pengaturan › Pengguna dan peran › Daftar pengguna, the button
"Edit peran" becomes "Ubah". Its form still changes the roles, Program
studi and Unit atau jabatan, and now also Nama lengkap, Gelar, NIP and
Email kedinasan, so a mistake made when a user was added can be fixed
without removing and adding them again.

## Who it is for

- Kepala UPK, and anyone else who can manage users today.

## What should happen

1. When Kepala UPK opens Daftar pengguna, then each row shows "Ubah" where
   "Edit peran" was.
2. When Kepala UPK presses "Ubah", then the form shows Nama lengkap, Gelar,
   NIP and Email kedinasan filled with the current data, next to the roles,
   Program studi and Unit atau jabatan.
3. When Kepala UPK changes the name, title, NIP or email and presses
   "Simpan", then the row shows the new data.
4. When the new data breaks a rule of Tambah pengguna (name empty or too
   long, title too long, NIP not only digits or longer than 18, email not
   on the campus domain), then the same message as in Tambah pengguna is
   shown and nothing is saved.
5. When the new email already belongs to another user, then a message says
   so and nothing is saved.
6. When a user's email is changed, then that user signs in with Google
   with the new email, and the old email no longer signs in.
7. When Kepala UPK presses "Ubah" on their own row, then the email field is
   locked, with a short note that their own email cannot be changed here;
   name, title and NIP can still be changed.
8. When Kepala UPK presses "Ubah" on the account of another Kepala Unit,
   then its data can be changed as on any other row.
9. When Kepala UPK presses "Batal", then nothing changes.
10. When a student's account is sent to this form, then it is refused, as
    today.

## Not included

- The Badan Asrama Mahasiswa list and its own "Edit peran".
- A history of who changed a name, title, NIP or email.
- Changing user details anywhere else.

## Open questions

None.

## Steps

1. [ ] Rename the button to "Ubah", the save button to "Simpan", and show
   name, title, NIP and email in the form, filled in.
2. [ ] Save the new details with the rules of Tambah pengguna, including
   the check that the email is not used by another user.
3. [ ] Lock the email field on the user's own account, and refuse a change
   of their own email if one is sent anyway.
