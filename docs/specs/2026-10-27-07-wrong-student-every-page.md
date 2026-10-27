# A wrong student in the address opens the not-found window on every page

Depends on: Groundwork: Error and not-found screens in the app's look
Group: Groundwork
Kind: fix, found while building "Groundwork: Error and not-found screens in the app's look"

## What we want

A wrong student in the address now opens the "Mahasiswa tidak
ditemukan" window on Mahasiswa, Dashboard, Penilaian › Karakter,
Pembinaan › Karakter and Pengasuh › Kelompok. Other pages that open a
student from the address with `profil=` still ignore it silently when
it is not shaped like an id, such as `profil=bukan-id`: Penilaian ›
Asesmen, Jasmani, SIKU and SKPM, Konseling › Kesehatan mental and
Pembinaan › Pelanggaran disiplin.

## Who it is for

Every role that opens these pages.

## What should happen

- When the address names a student that does not exist, of any shape,
  on Penilaian › Asesmen, Jasmani, SIKU, SKPM, Konseling › Kesehatan
  mental or Pembinaan › Pelanggaran disiplin, then the page opens with
  the "Mahasiswa tidak ditemukan" window, as on Mahasiswa.
- When the address names a student the person may not see, then the
  same window shows, so nobody learns whether the student exists.
- When the address names a student the person may see, then the page
  opens with that student as today.

## Not included

- Pages that do not open a student from the address.
- Changing who may see which student.

## Decisions

1. Each of these pages reads `profil=` with the shared reader of an id
   from the address that Penilaian › Karakter and Pembinaan › Karakter
   use, so a value of any shape counts as a student to look up.
2. The window is the shared "tidak ditemukan" window, with the page's
   own name in its last line, as on the other pages.

Decided while building:

3. Only `profil=` changes. The other parts of these addresses that name
   a record, such as an assessment's history or an SKPM detail, still
   ignore a value not shaped like an id, as the issue asks only for the
   student.
4. A student of the right shape that does not exist, or that the person
   may not see, already opened the window on these pages; that case was
   met before this change and is only confirmed again.

## Steps

- [x] 1. Penilaian › Asesmen, Jasmani, SIKU and SKPM, Konseling ›
  Kesehatan mental and Pembinaan › Pelanggaran disiplin read `profil=`
  with the shared reader, with checks.
