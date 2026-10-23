# Clear line when no program studi has an average

Depends on: Dashboard mentoring summary
Group: Dashboard

## What we want

On the Dashboard, the panel "Capaian MEDALI per program studi" in
"Pendampingan" shows every program with "-" and no bar when no program
has at least 5 assessed students in the filtered group. The note under
it, "Batang dimulai dari nilai 50 agar selisih antarprodi terlihat.",
then speaks of bars that are not drawn. This is the empty chart the
Dashboard audit says must give way to a clear line, as the cohort tables
already do with "Tidak ada angkatan yang dapat ditampilkan…".

Found in the Dashboard audit, as Kepala Unit and as Direktur, with no
filter and with Tahapan 1, Provinsi "Luar negeri" and an Instansi asal
filter: all 9 programs showed "-", while only 11 of 188 students are
assessed in the sample data.

## Who it is for

Kepala Unit and Direktur / Wakil Direktur (Ketua Program Studi does not
get this panel).

## What should happen

- When no program in the filtered group has an average to show, then the
  panel shows its heading and the line "Belum ada program studi yang
  dapat ditampilkan. Rerata program studi tampil bila minimal 5 mahasiswa
  sudah diasesmen, agar nilai perorangan tidak dapat ditebak.", with no
  program rows and no "Batang dimulai dari nilai 50…" note.
- When at least one program has an average, then the panel stays as it
  is today: every program with its count, bar or "-", and the note.
- The server still sends no average for a program with fewer than 5
  assessed students. Confirmed by a check.
- On a phone the line wraps with no sideways scroll.

## Not included

- Changing the limit of 5, or how a program's average is worked out.
- The cohort tables and the other sections, which already show their
  own lines.

## Decided

1. The wording follows the Dashboard's other "Rekap ditampilkan setelah
   minimal 5 mahasiswa…" and "Tidak ada angkatan yang dapat
   ditampilkan…" lines.
2. The program rows with their student counts are left out in this case,
   since without averages they repeat the filter's own counts.

## Decided while building

1. The case where the group has no program at all, such as a filter that
   matches nobody, shows the same line. The Dashboard already shows only
   "Tidak ada mahasiswa aktif dengan kombinasi filter ini." then, so the
   panel is not reached.
2. The check that the server sends no average under 5 already existed
   with "Dashboard mentoring summary"; it is kept as it is.

## Steps

- [ ] 1. The line in place of the program rows and the note when no
  program has an average.
