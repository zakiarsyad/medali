# Dashboard: mentor dashboard sections and mentee table

Depends on: Mentor dashboard overview; Dashboard filter and character achievement; Dashboard character grade; Dashboard physical health; Dashboard mental health; Student list and detail; Mentoring notes; Recording a discipline penalty
Group: Dashboard

## What we want

"Dashboard anak asuh" gets its lower part, built like the prototype: the
four numbered sections for the Pengasuh's own anak asuh, their latest
discipline violations, and a table of every anak asuh with their MEDALI
scores. The sections reuse the ones on the main Dashboard, without the
per-cohort tables.

## Who it is for

Pengasuh.

## What should happen

- When a Pengasuh presses one of the four cards, then the page scrolls to
  that section.
- When they look at section 1 "Capaian karakter", then they see the
  average per nilai with the change from last semester, the medal chart
  and how many anak asuh are assessed. "Lihat rincian" opens Penilaian >
  Asesmen karakter.
- When they look at section 2 "Nilai karakter", then they see "Komponen
  nilai karakter" and "Sebaran huruf" for their anak asuh.
- When they look at section 3 "Kesehatan jasmani", then they see
  "Kategori tes kebugaran", the most common illnesses in the two lower
  categories, and "Arti kategori". The 5-student rule of the main
  Dashboard does not apply here: Pengasuh already reads each anak
  asuh's category and health notes in Penilaian jasmani.
- When they look at section 4 "Kesehatan mental", then they see only
  "Kesehatan mental anak asuh": the records published to Pengasuh with
  the student's consent still in force, and no anonymous rekap. With none
  they see "Belum ada data yang dipublikasikan konselor untuk anak asuh
  Anda. Data hanya tampil dengan persetujuan mahasiswa."
- When a section has no data yet, then it shows a short message, not
  zeros.
- When any anak asuh has a discipline violation, then "Pelanggaran
  disiplin" shows the 5 latest with date, name, category and level, and
  what happened, with "Lihat semua" to Pembinaan > Pelanggaran disiplin. With none,
  the panel is not shown.
- When they look at "Anak asuh", then the table lists every anak asuh,
  lowest average first: name and NIM, Kelas, semester, the six nilai
  coloured by predikat, Rerata and predikat. One not yet assessed shows
  "Belum diasesmen" and comes last.
- When they press a row or a name, then the student detail opens.
- When a student withdraws consent or leaves the group, then they leave
  section 4 or the whole page on the next load.
- When a Pengasuh sends a hand-made request for the table, the published
  records or the violations of students who are not their anak asuh, then
  the server refuses it. Confirmed by a check.
- When a published mental health record is shown, then the view is
  logged, as on the main Dashboard. Confirmed by a
  check.
- When the page is opened on a phone, then each anak asuh shows as a
  block with the six nilai in two rows, with no sideways scroll.
- When the page opens on the preview with sample data, then it still
  shows within about 1 second. The table shows all anak asuh; a group is
  small by nature.

## Not included

- Changing any score, note or record from this page.
- The per-cohort tables and the filter of the main Dashboard.

## Better than the prototype

- Empty sections say so instead of showing averages of zero.
- On a phone the table becomes blocks instead of a wide table.

## Decisions

1. A Pengasuh sees the illness line for their anak asuh without the
   5-student rule; they already see each anak asuh's health notes in
   Penilaian jasmani.
2. "Pelanggaran disiplin" shows only the discipline penalties that
   Pembinaan > Pelanggaran disiplin shows the Pengasuh; no dorm
   violations.

## Steps

- [x] 1. Sections 1 and 2 for anak asuh.
- [x] 2. Section 3 for anak asuh.
- [x] 3. Section 4 with the published records and the view log.
- [x] 4. "Pelanggaran disiplin".
- [x] 5. The "Anak asuh" table, opening the student detail.
