# The count line on the Mahasiswa list

Kind: fix, found by "Audit: UI of the merged screens"

## What we want

On Mahasiswa, the line that says how many students were found reads
"(N) mahasiswa aktif" while Status is "Aktif dan cuti". The number also
counts students on leave, so the words say less than the number holds.
After this work the line says what is counted.

What happens today, as Kepala Unit, Direktur / Wakil Direktur and Ketua
Program Studi, on a phone and on a computer: with the sample data the
page opens with "57 mahasiswa aktif", and the list under it holds
students marked "cuti". Pengaturan > Pengguna baru mahasiswa says "52
aktif" for the same data.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi.

## What should happen

- When Status is "Aktif dan cuti", then the line reads "(N) mahasiswa
  aktif dan cuti".
- When Status is "Non aktif", then the line reads "(N) mahasiswa non
  aktif".
- When Status is "Semua status", then the line reads "(N) mahasiswa", as
  today.
- When another filter or a search is also in use, then the number is
  still the number of students found, as today.

The last two cases were already met before this work. The first two are
what it builds.

## Not included

- Any change to the filters, the counts beside each choice, or the list.

## Decided

Decided while building, because the issue did not say:

1. While Program studi, Reguler atau alih program or Kategori is in use,
   the line keeps its words of today, "(N) mahasiswa sesuai (n) filter",
   whatever Status is. Those words come from the prototype and do not
   name a status, so they say nothing wrong, and the filters are not
   part of this work.

## Steps

- [x] 1. The line with the number of students found names the status that
  is counted.
