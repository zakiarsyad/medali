# Dashboard: mentoring summary

Depends on: Dashboard filter and character achievement; Mentor groups;
Mentoring notes; Character coaching list; Student list and detail
Group: Dashboard

## What we want

The Dashboard gets its last section, "Pendampingan", built like the
prototype: four numbers about mentoring and coaching for the filtered
students, the MEDALI average per study program, and the latest mentoring
notes. Each part links to the menu that holds the detail.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their own
program only).

## What should happen

- When one of the three roles opens Dashboard, then below section 4 they
  see "Pendampingan" with the line "Pengasuhan dan pembinaan mahasiswa
  sesuai filter."
- When they look at the four numbers, then they see "Mahasiswa aktif"
  (with "dari (n) mahasiswa aktif" when a filter is on), "Pengasuh" with
  "(n) kelompok pengasuhan", "Catatan 30 hari terakhir" with "konseling,
  mentoring, apresiasi", and "Perlu pembinaan" with "(n) di antaranya
  intensif". "Perlu pembinaan" counts the students on the coaching list
  who are not yet "Selesai", as in Pembinaan. Each opens its menu:
  Mahasiswa, Pengasuh, Pengasuhan, Pembinaan.
- When they look at "Capaian MEDALI per program studi", then each program
  shows its student count, a bar and its average, highest first, with
  "Batang dimulai dari nilai 50 agar selisih antarprodi terlihat." A
  program with fewer than 5 assessed students in the filtered group
  shows "-" and no bar, and the server sends no average for it.
  Confirmed by a check.
- When they look at "Catatan pengasuhan terbaru", then they see the 6
  latest notes for the filtered students: date, student name, kind of
  note, value tags, the note and its follow-up. "Lihat semua" opens
  Pengasuhan. With no note they see "Belum ada catatan."
- When they press a student's name in a note, then the student detail
  opens, as in Mahasiswa.
- When a filter is chosen, then the four numbers, the bars and the notes
  count only those students.
- When Ketua Program Studi opens Dashboard, then the numbers and notes
  cover only their program, and the per-program panel is not shown.
- When a note is added or a student leaves a group, then the numbers
  follow on the next load.
- When Pegawai UPK, Penilai Mahasiswa or Mahasiswa sends a hand-made
  request for these numbers or notes, or Ketua Program Studi asks by hand
  for another program's, then it is refused. Confirmed by a check.
- When the page is opened on a phone, then the four numbers show two per
  row, and the two panels stack, with no sideways scroll.
- When the page opens on the preview with sample data, then it still
  shows within about 1 second with this section added.

## Not included

- Writing or changing notes, groups and coaching status. They stay in
  their own menus.
- The numbers beside the menu names in the side menu.
- The prototype's line "dari (n) dalam data sumber"; it describes the
  prototype's sample file, not the app.

## Decisions

1. The three roles may read the note text here, as they already read
   every note (Ketua Program Studi: own program) in Pengasuhan.
2. A program's average follows the Dashboard rule: an average covering
   fewer than 5 students is never shown.

## Steps

- [x] 1. The "Pendampingan" section with its four linked numbers.
- [x] 2. "Capaian MEDALI per program studi".
- [x] 3. "Catatan pengasuhan terbaru", limited to the viewer's students.
