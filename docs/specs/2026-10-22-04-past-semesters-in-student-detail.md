# Past semesters in the student detail

Depends on: Scores in the student detail, Character assessment, Academic
period
Group: Mahasiswa

## What we want

The student detail shows staff "Riwayat per semester", as the prototype
does: one line chart of the student's MEDALI average and six values over
the semesters that were assessed. Staff see how a student has moved, not
only this semester's result.

## Who it is for

The roles that already see the card "Capaian karakter semester (n)" in
the student detail, each within the rows they may open: Kepala Unit,
Direktur / Wakil Direktur, Ketua Program Studi (own program), Pengasuh
(own mentees) and Penilai Mahasiswa.

## What should happen

- When one of these roles opens a student who was assessed in at least
  one semester, then under the score panels they see "Riwayat per
  semester": a line chart with one point per assessed semester for
  Rerata and for each MEDALI value, and a legend (Rerata, M, E, D, A, L,
  I).
- When a semester has more than one assessment, then the chart uses the
  latest one of that semester, the same one the card uses. The semester
  of an assessment is the academic period it was made in.
- When the student has no assessment this semester, then the chart ends
  at the last assessed semester.
- When the student was never assessed, then the panel says "Belum ada
  riwayat."
- When they read the chart without seeing colours, then the same
  numbers are in a small table under it.
- When an assessment is added or replaced, then the chart shows it the
  next time the detail is opened.
- When Konselor opens their small detail, then the panel is absent and
  its data is not sent. When any role asks by hand for the history of a
  student outside their rows, then it is refused. Confirmed by a check.
- When the detail is opened on a phone, then the chart shrinks to the
  screen width with no sideways scroll.
- When the detail is opened, then it still shows within about 1 second.

## Not included

- The student's own chart on Profil saya (My character achievement).
- Past Nilai karakter (KEP-220), SIKU or fitness results.
- Comparing the student with a class or an angkatan.
- "Catatan penilai" of an assessment.

## Better than the prototype

- An empty state for a student who was never assessed.
- A table with the same numbers under the chart.

## Decided

1. Only the roles that see the "Capaian karakter" card see the chart, so
   Konselor does not get it. The panel uses the same right in the one
   list of what each role may do as the character panels, with the same
   rows for each role; a refused panel is left out, exactly as one with
   no data would be for a role without it.
2. The scores of a semester under a discipline penalty are shown as
   stored, the same numbers the card of that semester showed.
3. The panel sits right under the SIKU panel, after the other score
   panels, as in the prototype. Penilai Mahasiswa sees it in their small
   detail too, under the character panels.
4. Each point is named by the student's semester in that period,
   "Smt n", as in the prototype. The table names the period too, such as
   "Smt 3 · Ganjil 2026/2027", so two periods past the eighth semester
   are still told apart. Points run from the oldest period to the newest.
5. A student assessed in only one semester gets the chart with one point
   for each line and the table, not the prototype's "Riwayat baru
   tersedia setelah semester kedua.", since the issue asks for a chart
   from one assessed semester on.
6. The chart's scale runs from 40 to 100 with lines at 50, 65, 75, 85 and
   100, as in the prototype. A score below 40 is drawn at the bottom
   edge; the table shows the stored number.
7. Rerata is shown with one decimal, the same way the card shows it.

## Steps

- [ ] 1. The right to read a student's past assessments in the detail,
  within each role's rows, with its checks.
- [ ] 2. The chart with its legend and the table under it.
- [ ] 3. The empty state, the phone layout and the speed check.
