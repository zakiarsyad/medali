# Short birth dates

## What we want

Tanggal lahir is now accepted only when written in full as MM/DD/YYYY, so
08/07/2005 works but 8/7/2005 is refused. Staff may also write the month
and the day with one digit, such as M/DD/YYYY, MM/D/YYYY or M/D/YYYY. The
date is still kept and shown as MM/DD/YYYY.

## Who it is for

Kepala Unit, Pelaksana UPK and Pengelola Asrama, the roles that already
input students.

## What should happen

- When staff type 8/17/2005, 08/7/2005 or 8/7/2005 in "Formulir" and press
  "Tambah mahasiswa", then the student is saved, and the list "Mahasiswa
  yang ditambahkan" shows 08/17/2005, 08/07/2005 or 08/07/2005.
- When they change Tanggal lahir to 8/7/2005 in Ubah and press "Simpan
  perubahan", then it is saved and shows as 08/07/2005.
- When a CSV row in "Unggah berkas" has Tanggal lahir as 8/17/2005,
  08/7/2005 or 8/7/2005, then the row is saved, not skipped.
- When a short date does not exist (such as 2/30/2005) or is in the future,
  then it is refused with the same message as today.
- When the date is written another way (such as 2005-08-17, 8/7/05 or
  08-17-2005), then it is refused with "Tanggal lahir harus ditulis
  MM/DD/YYYY.", as today.
- When staff open "Formulir", then the hint still says "MM/DD/YYYY".

## Not included

- Other orders, such as day/month/year.
- Two-digit years.
- Any change to dates already kept.

## Open questions

None.

## Steps

- [x] 1. Tanggal lahir accepts a one-digit month and day in Formulir, Ubah
  and Unggah berkas, and is still shown as MM/DD/YYYY.
