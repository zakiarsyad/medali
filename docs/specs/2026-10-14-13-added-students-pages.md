# Pages on the list of added students

Kind: fix, found by "Audit: Pengaturan"

Depends on: nothing beyond what is merged

## What we want

"Mahasiswa yang ditambahkan" on Pengaturan > Pengguna baru mahasiswa
shows the newest 100 students and no more. After this work the list is
read a page at a time, like the other long lists of the app.

Seen in "Audit: Pengaturan", on a local computer with sample data, as
Pegawai UPK, after a file of 1,000 students was saved:

- The list shows 100 rows and ends with "Menampilkan 100 dari 1.012.
  Gunakan pencarian." The other 912 students can be reached only by
  typing a name or a NIM that is already known. Nobody can read through
  the students of a file to check them, or reach "Ubah" and "Hapus" of
  one whose name they do not remember.
- With 100 rows the tab took about 1.25 seconds to show, at a phone
  width and at a computer width, against about 0.6 second with five
  rows. The page was 477 kB.
- Pengguna dan peran and the Mahasiswa list are paged already.

## Who it is for

Kepala Unit, Pegawai UPK and Pengelola Asrama.

## What should happen

- When they open the tab, then "Mahasiswa yang ditambahkan" shows the
  newest 25 students, and under them a line such as "1–25 dari 1.012
  mahasiswa" with "Sebelumnya" and "Berikutnya", the same way Pengguna
  dan peran pages its list.
- When they press "Berikutnya" or "Sebelumnya", then the next or the
  earlier 25 show, the newest first as today, and the page is kept in
  the address, so it can be opened again and is kept after "Ubah".
- When 25 students or fewer match, then no "Sebelumnya" and
  "Berikutnya" show.
- When they search with "Cari nama atau NIM", then the matches are
  paged the same way, starting at the first page, and the search stays
  in the address of each page.
- When the address names a page past the last one, or something that is
  not a page, then the last page or the first page shows, not an empty
  list.
- When they save, change or remove a student, then the list shows again
  with the same search and a page that still exists.
- When nothing was added yet, or nothing matches the search, then the
  words of today show: "Belum ada mahasiswa yang ditambahkan." and
  "Tidak ada yang cocok dengan pencarian."
- The four numbers above the form still count all students, not the
  page.
- On a phone the line and its two buttons fit the width.

## Not included

- A choice of how many rows a page holds.
- A filter for the students with no kelompok pengasuhan.
- Sorting by a column.
- The Mahasiswa list and Pengguna dan peran.

## Decided

1. Pages, not 100 rows with "Gunakan pencarian" as in the prototype, as
   the building rules ask for a long list and as Pengguna dan peran and
   the Mahasiswa list do.
2. 25 rows a page, as on Pengguna dan peran.
3. The pager is the one already shared by the other areas, which pages
   the Mahasiswa list. Pengguna dan peran keeps its own copy, as it is
   not part of this work.

Decided while building, because the issue did not say:

4. The page is written in the address as `hal`, counted from 1, and the
   first page is left out of the address, as on the Mahasiswa list.
5. When only one page matches, the line "1–n dari n mahasiswa" still
   shows, without "Sebelumnya" and "Berikutnya", as on Pengguna dan
   peran.
6. A step to another page keeps the screen where it is scrolled to, as
   the list sits under the form.
7. After a student is added, the list stays on the page it showed. The
   new student is at the top of the first page.

## Steps

- [ ] 1. The list of added students is read from the database one page
  of 25 at a time, with the count of all that match.
- [ ] 2. The line with "Sebelumnya" and "Berikutnya" shows under the
  list, with the page and the search kept in the address.
