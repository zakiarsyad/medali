# Student list

## What we want

The Mahasiswa menu gets its content, built like the prototype: a list of
students with search, filters and pages. It shows only the data the app
already holds. Sample data gains enough made-up students to try every
filter.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi.

## What should happen

- When one of the three roles opens Mahasiswa, then they see the title
  "Mahasiswa", a short intro, the filters, and a table with the columns
  Mahasiswa (name, NIM, status when not active, kategori tags), Program
  studi (with jalur and instansi asal), Angkatan (with kelas) and
  Provinsi.
- When Kepala Unit or Direktur opens it, then they see all students. When
  Ketua Program Studi opens it, then they see only students of their own
  program studi.
- When the page first opens, then Status is "Aktif dan cuti" and
  non-active students are hidden.
- When they type in "Cari nama atau NIM", then the list narrows to
  matching names or NIMs.
- When they choose an Angkatan, a Status ("Aktif dan cuti", "Semua
  status", "Non aktif"), a Program studi, a Jalur or a Kategori, then the
  list shows only matching students, and the filters work together.
- When they look at the Program studi, Jalur and Kategori filters, then
  each choice shows how many students it holds, and a line shows the
  number of students found.
- When any of those filters is in use, then "Atur ulang filter" shows,
  and pressing it clears them.
- When more than 25 students match, then 25 show per page, with
  "Sebelumnya", "Berikutnya" and "1–25 dari N mahasiswa".
- When nothing matches, then they see "Tidak ada mahasiswa yang cocok.
  Ubah kata kunci atau filter."
- When a student is added, changed or removed in Pengaturan > Pengguna
  baru mahasiswa, then the list shows it the next time it opens.
- When a role without the Mahasiswa menu opens the page's address, then
  they are refused as on other pages.
- When the preview is filled with sample data, then it holds at least 60
  made-up students spread over several program studi, angkatan, jalur,
  kategori and all three statuses.

## Not included

- The full profile, and clicking a name. The sentence "Pilih nama untuk
  melihat profil lengkap" waits for it.
- The columns Pengasuh, Capaian karakter (MEDALI) and Nilai karakter
  (KEP-220), the asrama tag, and the filters "Semua predikat MEDALI" and
  "Semua nilai karakter". Each comes with the work that brings its data.
  Nothing hidden is built now.
- Adding or changing students from this page.

## Open questions

None.

## Steps

- [x] 1. Add the made-up students to the sample data.
- [x] 2. Show the Mahasiswa page with the table, limited to what each
  role may see.
- [x] 3. Add "Cari nama atau NIM" and the Angkatan and Status filters.
- [ ] 4. Add the Program studi, Jalur and Kategori filters with their
  counts and "Atur ulang filter".
- [ ] 5. Add the pages of 25 and the empty message.
