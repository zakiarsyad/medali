# SIKU in the student detail

Depends on: Student list and detail, SIKU adjustments, Mentoring notes
Group: Mahasiswa

## What we want

When staff open a student's detail, they see how that student's SIKU
came about: the base, every gain and every loss with its reason, and the
result. From the SIKU lists in Penilaian, pressing a student's name
opens the same detail, so staff do not have to look the student up
again. The panel reuses the one built in "SIKU adjustments"; it is not
built again.

## Who it is for

- Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi (own
  program) and Pengasuh (own mentees): the panel in the student detail
  they can already open. Read only.
- Penilai Mahasiswa: from a name in the Penilaian SIKU lists only. They
  see the name, NIM, program studi and status, and this panel, and
  nothing else of the detail. Read only.

## What should happen

- When one of these roles opens the detail of an active student, then
  they see the panel "Rincian nilai SIKU": Nilai dasar + Penambahan (n)
  − Pengurangan (n) = SIKU akhir, then the tables Penambahan and
  Pengurangan, newest first, each line with Tanggal, Alasan, Keterangan
  (and "Dasar: ..." when given), Dicatat oleh and Poin.
- When a loss has the reason "Hukuman disiplin mahasiswa", then its
  Alasan and Keterangan show only to Kepala Unit, Direktur / Wakil
  Direktur, Ketua Program Studi and Pengasuh, who may read discipline
  records. Penilai Mahasiswa sees the date and the points of that line
  without them, and they are not sent to their screen. This holds in the
  detail only: on the Penilaian SIKU tab, where they enter such losses,
  they still see the reason, as "SIKU adjustments" says. Confirmed by a
  check.
- When a line came from a file, then "lewat unggah berkas" shows under
  who recorded it.
- When the student has no gain or no loss, then that table says "Belum
  ada penambahan." or "Belum ada pengurangan."
- When base plus gains minus losses falls outside 0–100, then the note
  "Nilai SIKU dibatasi 0–100." shows.
- When an entry is cancelled in Penilaian SIKU, then its line is gone
  the next time the detail opens.
- When the student is Cuti or Non aktif, then the panel is not shown.
- When staff press a student's name in "Daftar nilai SIKU", "Perubahan
  nilai SIKU per mahasiswa" or "Lihat mahasiswa" in Penilaian SIKU, then
  that student's detail opens over the page with the parts their role
  has, and closing it returns to where they were. This gives no role the
  Mahasiswa menu.
- When a role without the Penilaian SIKU tab opens a detail, then there
  is no SIKU panel. When Ketua Program Studi or Pengasuh asks by hand
  for the SIKU lines of a student outside their own, or a student asks
  for another student's, then the server refuses. Confirmed by a check.
- When the detail is opened on a phone, then the sum wraps onto several
  lines and each SIKU line shows as a small card, with no sideways
  scroll.
- When a student has more than 10 lines in a table, then the first 10
  show with a way to see the rest, and the detail still opens within
  about 1 second.

## Not included

- "Transparansi nilai SIKU" on Profil saya (spec "My character grade and
  SIKU record").
- The Nilai karakter panel in the detail (spec "Scores in the student
  detail"), and the line "bobot (n)% pada nilai karakter", which joins
  when the weights exist.
- Adding or cancelling a SIKU entry from the detail.

## Better than the prototype

- A long list of lines is folded after 10 instead of making the detail
  very long.
- The same rule that limits rows in Penilaian SIKU limits them here, on
  the server.

## Decided

1. Penilai Mahasiswa opens a student's detail from the SIKU lists, as in
   the prototype: from those lists only, and they see the name, NIM,
   program studi, status and the SIKU panel, nothing else.
2. A loss with the reason "Hukuman disiplin mahasiswa" shows its reason
   and Keterangan only to roles that may read discipline records.
   Penilai Mahasiswa sees the date and the points without them.

## Steps

- [ ] 1. The right to read a student's SIKU lines is checked for each
  role and its own students, with its checks.
- [ ] 2. The student detail shows "Rincian nilai SIKU", reusing the
  panel from SIKU adjustments.
- [ ] 3. Names in the Penilaian SIKU lists open the student detail.
