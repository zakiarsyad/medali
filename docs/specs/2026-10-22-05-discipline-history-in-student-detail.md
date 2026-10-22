# Discipline history in the student detail

Depends on: Recording a discipline penalty, Discipline penalty follow-up,
Student list and detail, Mentoring notes
Group: Mahasiswa

## What we want

The student detail gets the panel "Riwayat pelanggaran disiplin": every
discipline penalty of that student, newest first. It is how staff see a
student's record in one place. A student with no penalty has no panel.

## Who it is for

- Staff who may read discipline records and can already open the
  student detail: Kepala Unit, Direktur / Wakil Direktur, Ketua Program
  Studi (their program only) and Pengasuh (their own mentees only).
- Pembina Disiplin Mahasiswa: from a student's name in Pembinaan >
  Pelanggaran disiplin only. They see the name, NIM, program studi and
  status, and this panel, and nothing else of the detail.

## What should happen

- When a staff role above opens the detail of a student who has
  penalties, then they see "Riwayat pelanggaran disiplin" with the
  number of records and, for each: the date, Kategori and Jenjang, the
  status, the Uraian, the penalty, the kerja sosial length, and for
  Ringan and Sedang "nilai karakter paling tinggi 70".
- When the student has no penalty, then the panel is not shown at all.
- When Pembina Disiplin Mahasiswa presses a student's name in "Daftar
  pelanggaran", then a detail opens with the name, NIM, program studi,
  status and this panel only; no other panel is sent to their screen.
  Confirmed by a check.
- When a student has a Berat penalty, then the Mahasiswa list and the
  detail show a badge beside the status, only to roles that may read
  discipline records, by the prototype's rule: "Diberhentikan
  permanen" for Jenjang kedua or ketiga; "Diberhentikan (ayat 8)"
  when its Keputusan is "Diberhentikan dengan hormat (ayat 8)"; no
  badge when its Keputusan is "Melanjutkan studi"; otherwise
  "Diberhentikan sementara", which ends when the penalty is "Selesai
  dijalani" for a student without an Instansi asal. Confirmed by a
  check.
- When Kepala Unit or Pembina Disiplin Mahasiswa looks at the panel of
  an active student, then they also see "Catat pelanggaran", which opens
  Pembinaan > Pelanggaran disiplin with that student picked.
- When the status of a penalty changes in Pembinaan, then the panel
  shows the new status the next time it is opened.
- When Konselor, Penilai Mahasiswa, Pegawai UPK, Pengelola Asrama or a
  BAM role opens a student detail they are allowed to see, then the
  panel is absent, and the data is not sent to their screen at all.
  Confirmed by a check.
- When a student asks for any discipline history through this panel
  by hand, or Pengasuh or Ketua Program Studi asks for a student
  outside their rows, then the server refuses it. Confirmed by a check.
- When a penalty is added while the detail is open, then the panel shows
  it after the detail is opened again; nothing is cached for others.
- When the detail is opened on a phone, then the panel is one column
  with no sideways scroll.
- When the detail is opened on the preview, then the panel adds no
  visible wait: the detail still shows within about 1 second. A student
  with more than 10 records gets "Tampilkan semua".

## Not included

- Notes from Catatan pelanggaran; the prototype does not show them in
  the detail.
- The line under the scores that says they are limited to 70 (Score
  limit under a discipline penalty).
- The student's own view of their record: it is built on Profil saya
  by "My coaching, mentoring notes and sanction status" only.
- The panel "Pembinaan (level)" for staff in the detail: no spec
  builds it now; staff read it on Pembinaan karakter.
- Dorm violations and dorm warning letters (Asrama).
- An objection by the student; the prototype has none for discipline.
- The limit of 70 and the three badge rules are the prototype's values,
  to be confirmed by the campus before launch.

## Better than the prototype

- For a role that may not see discipline, the records are never sent to
  the screen, instead of being sent and hidden.
- A long history is folded behind "Tampilkan semua".

## Decisions

1. The badge "Diberhentikan sementara" ends when the penalty is
   "Selesai dijalani" for a student without an Instansi asal, and for
   one with an Instansi asal when its Keputusan is "Melanjutkan studi".
   "Diberhentikan permanen" and "Diberhentikan (ayat 8)" stay.
2. The student is not told when a penalty is recorded; that is a later
   spec.
3. The student has no way to object to a discipline penalty in the app;
   objections go through the campus's own process outside the app.
4. This spec has no student panel; "My coaching, mentoring notes and
   sanction status" will show the student the Uraian, as in the
   prototype.
5. The panel uses the right that already lets a role read discipline
   records, held by exactly the roles above, with the same rows as on
   Pelanggaran disiplin: Ketua Program Studi their program, Pengasuh
   their mentees, the others every student. Its name on the role list
   screen now also names the history in the detail; no role gains or
   loses anything. A second role of the same account that sees every
   student but may not read discipline adds no rows.
6. The panel sits under the SIKU panel and above "Riwayat per
   semester", as in the prototype, everywhere the whole detail opens:
   the Mahasiswa list and every other list whose names open it. The
   brief of Penilai Mahasiswa and Konselor does not get it.
7. A name in "Daftar pelanggaran" opens the student for every role of
   the tab: the whole detail with all its panels for a role that may
   open it, and the small detail for Pembina Disiplin Mahasiswa. The
   small detail opens only for a student with a penalty within the
   account's rows; any other address shows "Mahasiswa tidak ditemukan".
   Tutup goes back to the list with its search, filters and page.
8. Each record shows its date, the Kategori and Jenjang badge with the
   status beside it, the Uraian on its own line, then "Hukuman: ...,
   kerja sosial n hari, nilai karakter paling tinggi 70." as in the
   prototype. The kerja sosial is the length of its Jenjang, shown only
   when the penalty kept one, as "Daftar pelanggaran" does. Keputusan
   and Syarat melanjutkan studi stay in "Rincian".
9. Records run by Tanggal pelanggaran, the newest first, then the one
   saved last. The first 10 show; the rest fold behind "Tampilkan semua
   (n)", as the SIKU panel does. A student's records are read in one
   go each time the detail opens, so nothing is kept between openings.
10. An active student is an Aktif one, the same students the form of
    Pelanggaran disiplin lets Kepala Unit and Pembina Disiplin
    Mahasiswa pick, so "Catat pelanggaran" always opens the form with
    the student picked. A student on Cuti or Non aktif gets no button,
    as in the prototype. The button sits under the records, as a quiet
    button.

## Steps

- [x] 1. The right to read a student's discipline history is added to
  the permission list for the staff roles above, with its checks.
- [x] 2. The panel in the student detail for staff, limited to each
  role's rows, and the small detail that a name in "Daftar
  pelanggaran" opens for Pembina Disiplin Mahasiswa.
- [x] 3. "Catat pelanggaran" from the panel.
- [ ] 4. The badge for a suspended or dismissed student on the
  Mahasiswa list and in the detail.
