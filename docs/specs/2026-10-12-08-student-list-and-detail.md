# Student list and detail

## What we want

The Mahasiswa list is already there: the table, search, Angkatan,
Status, the Program studi, Jalur and Kategori filters with their counts,
"Atur ulang filter", pages of 25 and the empty message. This spec adds
what is left: the student detail that opens when staff pick a name, the
semester and tahap in each row, the filters still missing, and the phone
layout. Nothing already built is built again or changed. Mentor, scores
and other records join the detail as their specs are built.

## Who it is for

- Kepala Unit and Direktur / Wakil Direktur: every student.
- Ketua Program Studi: only the students of their study program.

## What should happen

- When one of the three roles looks at the list, then the Angkatan
  column also shows "Smt (n)" and the tahap name for a student who is
  Aktif or Cuti, next to the kelas. The semester comes from "Academic
  period"; the tahap follows it as on Kurikulum (semester 1–2 Penanaman,
  3–4 Penumbuhan, 5–6 Pengembangan, 7–8 Pematangan). A Non aktif student
  shows no semester and no tahap.
- When they look at the filters, then three more are offered beside the
  ones already there: Tahapan ("Semua tahap", then "Tahap (no) ·
  (name)"), Provinsi ("Semua provinsi", then each provinsi) and Instansi
  ("Semua instansi", "Tanpa instansi (reguler)", then each instansi).
  Each choice shows how many students it holds, the new filters work
  together with the old ones and with the search, the line with the
  number found follows, and "Atur ulang filter" clears them too.
- When they choose a Tahapan, then only Aktif and Cuti students of that
  tahap show. With no match they see the empty message already there.
- When they look at the intro, then it also says "Pilih nama untuk
  melihat profil lengkap."
- When they press a row, or press Enter on it, then the student detail
  opens: name, NIM, program studi, status, the kategori tags (Afirmasi,
  Pembibitan, Internasional, Blended learning), then "Angkatan" with the
  jalur, "Provinsi (domisili sesuai NIK)", "Semester · tahap" as
  "Semester (n) · Tahap (name) (tingkat (n))" or "Tidak aktif" for a
  Non aktif student, "Kelas" ("Belum tercatat" when empty), "Jenis
  kelamin", and "Instansi asal" for alih program. "Tutup", Escape or a
  tap outside closes it, and the list is as it was left: same page, same
  filters.
- When Ketua Program Studi asks for the detail of a student of another
  program, by its address or by a hand-made request, then it is refused.
  Confirmed by a check.
- When Pengasuh, Pegawai UPK, Mahasiswa or any other role without the
  Mahasiswa menu asks for a student's detail by address or by hand, then
  it is refused. Confirmed by a check.
- When the detail of a student removed in Pengguna baru mahasiswa is
  asked for, then the answer is the same as for a student who does not
  exist.
- When the page is opened on a phone, then there is no sideways scroll:
  each row becomes a card, the filters fold under one "Filter" button,
  and the detail fills the screen.
- When the detail is opened on the preview with sample data, then it
  shows within about 1 second, and the list still loads one page of 25
  rows at a time.

## Not included

- Anything the merged list already does. In particular the one
  "Kategori" filter stays as it is: no separate Afirmasi, Pembibitan and
  Internasional filters, and "Jalur" keeps its name.
- Hiding the Program studi filter from Ketua Program Studi, and sorting
  the list: both stay as merged.
- The rule that works out a semester: it lives in "Academic period".
- The capaian karakter (MEDALI) and nilai karakter (KEP-220) columns,
  their two filters and every score panel in the detail, health and
  mental health included: they come with "Scores in the student detail".
- The Pengasuh column and line: they come with "Mentor groups".
- The Asrama filter, tag and line: they come with "Asrama on the
  student lists".
- "Catatan pengasuhan" and "Tulis catatan" in the detail, and opening
  the detail as Pengasuh: they come with "Mentoring notes".
- The discipline panel in the detail: it comes with "Discipline history
  in the student detail".

## Better than the prototype

- "Pembibitan" is used everywhere; the prototype also says "Bibit".
- Phone layout with cards and a folded filter bar.
- The server refuses a single student outside one's rows; the prototype
  only skips the click.
- Closing the detail keeps the page and the filters.

## Decided

1. A student's semester is not stored. It is read from the one rule in
   "Academic period" (angkatan year and the running period, never above
   8); this spec adds no rule of its own.
2. A Non aktif student shows no semester: the row shows none and the
   detail says "Tidak aktif", as the prototype's detail does.
3. The merged "Kategori" filter is kept, which already covers Afirmasi,
   Pembibitan, Internasional and Blended learning. No separate filters.
4. The list is sorted by name only, as merged.

Decided while building, because the issue did not say:

5. A detail asked for by a role that may read details, for a student
   outside that role's rows, gets the same answer as a student who does
   not exist. So Ketua Program Studi cannot learn whether a student of
   another program exists. A role without the right is refused outright.
6. The address of a detail names the student by the app's own number for
   the record, not by NIM, so no NIM is kept in the browser's history or
   in the server's records of requests.
7. While no academic period runs, no semester is known: a row shows no
   semester and no tahap, the detail shows "-" for "Semester · tahap",
   and the Tahapan filter offers no tahap.
8. On a phone the "Filter" button folds the Program studi, Jalur,
   Kategori, Tahapan, Provinsi and Instansi filters, and says how many
   of them are in use. The search, Angkatan and Status stay in view
   above the list, with the number found.
9. A student with no provinsi kept is found under no Provinsi choice.

## Steps

- [x] 1. Semester and tahap show in each row, read from the rule in
  "Academic period".
- [x] 2. The Tahapan, Provinsi and Instansi filters with their counts,
  working with the filters already there.
- [x] 3. The right to read one student's detail, limited to each role's
  rows, with its checks.
- [x] 4. The student detail panel opens from a row and closes back to
  the same list.
- [x] 5. Phone layout for the list, the filters and the detail.

