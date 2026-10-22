# Same SKPM file saved twice is warned about first

Depends on: nothing beyond what is merged
Group: Penilaian
Kind: fix, found by "Audit: Penilaian"

## What we want

On "Data SKPM", "Unggah data SKPM" in "Tambahkan" mode saves the same
file again with no warning, so a student's points count twice. The SIKU
file upload spec warns when a file with the same name and rows was saved
before and asks to confirm before saving it again, and "Audit: Penilaian"
asks that the same file uploaded by two staff gives no double points.
The SKPM data spec left the warning out only because its issue did not
ask for one. After this work the SKPM upload warns and asks to confirm
the same way SIKU does.

Seen in "Audit: Penilaian", on a local computer with sample data, at
computer width:

- Penilai Mahasiswa saved a file with two rows in "Tambahkan" mode.
  Kepala Unit then picked the same file: no warning, and "2 baris dari
  (file) tersimpan."
- Wening Hasibuan went from 1 kegiatan, 10 poin, Nilai SKPM 20,0 to 2
  kegiatan, 20 poin, 40,0. After "Hapus" on the second upload she was
  back at 10 poin, 20,0.
- The same test on Penilaian SIKU showed "Berkas dengan nama dan isi
  yang sama sudah disimpan pada 22 Okt 2026." and kept "Simpan" off
  until "Tetap simpan berkas ini lagi" was ticked.

## Who it is for

Kepala Unit and Penilai Mahasiswa, who upload SKPM data, and every
student whose Nilai SKPM comes from those files.

## What should happen

- When Kepala Unit or Penilai Mahasiswa picks a file in "Tambahkan" mode
  with the same name and rows as an upload still in force, by anyone,
  then the preview says "Berkas dengan nama dan isi yang sama sudah
  disimpan pada (date). Centang "Tetap simpan berkas ini lagi", lalu
  simpan bila memang perlu." and "Simpan" stays off until the box is
  ticked, as on Penilaian SIKU.
- When the box is ticked and "Simpan" pressed, then the file is saved
  again as today.
- When the earlier upload was removed with "Hapus" or replaced by "Ganti
  semua data", then the same file saves with no warning.
- When a file is sent again by hand without the confirmation, then the
  server refuses and saves nothing. Confirmed by a check.
- "Simpan" pressed twice for the same picked file is still answered as
  the first press.
- On a phone the warning and the box read the same.

## Not included

- "Ganti semua data" mode: it replaces every earlier upload, so no
  points count twice.
- The SIKU upload, which already warns.
- Rows that repeat across two different files.

## Decisions

1. "Ganti semua data" mode gives no warning. That mode marks every
   earlier upload replaced, so nothing counts twice.
2. Files are matched by name and rows, the same rule as the SIKU file
   upload, so the two uploads behave alike.
3. Two staff who press "Simpan" on the same new file at the very same
   moment can both still save it. SIKU has the same gap, and the spec
   asks only for the SIKU behaviour.

## Steps

- [x] 1. A repeated SKPM file in "Tambahkan" mode shows the warning and
  needs the tick before it saves, on a computer and on a phone, with
  the server refusing it by hand.
