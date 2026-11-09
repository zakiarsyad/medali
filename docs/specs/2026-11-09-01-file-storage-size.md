# Send the file size to the file storage

## What we want

On medali.site, "Simpan … baris" under Pengaturan > Input data mahasiswa >
Unggah berkas fails with "Berkas tidak dapat disimpan. Coba lagi." The file
storage refuses the file because the app sends it without saying how large
it is. The app must always state the file's size when it sends a file to
the file storage, so the file and its students are saved.

## Who it is for

Kepala Unit, Pegawai UPK and Pengelola Asrama. The same fix also covers
every other upload that keeps a file, such as photos and attachments.

## What should happen

- When one of the three roles uploads a correct CSV file on medali.site and
  presses "Simpan … baris", then the students are saved, the message says
  how many, and the file name shows under "Diinput".
- When the app sends any file to the file storage, then the request states
  the file's exact size. Confirmed by a check.
- When the file storage refuses or cannot be reached, then nothing is saved
  and the screen still says "Berkas tidak dapat disimpan. Coba lagi.", as
  before.

## Not included

- Changes to the upload screen, its wording, or the CSV rules.
- Changes to the Render settings.
- Vercel previews: the fix is proven on medali.site (Render) only.

## Open questions

None.

## Steps

- [x] 1. Every file sent to the file storage carries its exact size, with a
  check that proves it.
- [ ] 2. Once merged into `PojokAsrama/medali` and deployed by Render,
  confirm the student upload saves on medali.site.
