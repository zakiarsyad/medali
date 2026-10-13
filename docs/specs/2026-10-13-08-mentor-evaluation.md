# Mentor evaluation

Depends on: Mentor groups, Mentor list, Academic period

## What we want

The Pengasuh menu gets the tab "Evaluasi dan penggantian", with its
first part: Kepala Unit evaluates the mentor of a group for a period on
four aspects. The result (Baik, Cukup, Kurang) is kept in the mentor's
history and can later be the reason to replace a mentor.

## Who it is for

- Evaluate: Kepala Unit.
- Read: Direktur / Wakil Direktur, Pegawai UPK, and Ketua Program Studi
  (their program's groups only).

## What should happen

- When Kepala Unit opens the tab, then they see "Evaluasi pengasuh" with
  a choice of Kelompok pengasuhan (grouped by angkatan, with the
  mentor's name). Before a choice: "Pilih kelompok untuk melihat
  pengasuh saat ini dan indikator kinerjanya."
- When they choose a group, then a box shows the mentor, since when, and
  the member count, then the form: Periode, Keaktifan pendampingan,
  Kehadiran pada kegiatan kelompok, Capaian karakter kelompok, Umpan
  balik mahasiswa (each 0–100 with its short description), and Catatan
  evaluasi.
- When they type the four values, then "Nilai evaluasi (average)" and
  its predikat show at once: Baik from 80, Cukup from 65 to 79.9, Kurang
  below 65. Kurang adds "Hasil ini dapat menjadi dasar penggantian
  pengasuh."
- When a value is empty or outside 0–100, then nothing is saved and the
  message names the aspect.
- When they press "Simpan evaluasi", then the message says "Evaluasi
  (name) disimpan: (predikat)." and "Evaluasi terbaru" shows it on top.
- When anyone with the menu looks at "Evaluasi terbaru", then they see
  the latest 20: periode, pengasuh, kelompok, the four values, the
  result, and date, evaluator and note.
- When they open a group page, then "Evaluasi pengasuh" lists that
  group's evaluations; Kepala Unit also sees a button "Evaluasi
  pengasuh" that opens the form with the group chosen.
- When they open Kelompok pengasuhan, then "Evaluasi terakhir" shows per
  group and the number "Evaluasi kurang" counts groups whose last result
  is Kurang. The Pengasuh tab and mentor page show the evaluations too.
- When a read-only role opens the tab, then they see "Evaluasi dan
  penggantian pengasuh dilakukan oleh Kepala Unit Pembangunan Karakter."
  and the lists, without the form.
- When Pegawai UPK or any role but Kepala Unit sends an evaluation, then
  the server refuses it. Pengasuh cannot open the tab. Confirmed by a
  check.
- When an evaluation is saved, then it is never erased. Saving again
  for the same group and period corrects it, and a log line keeps the
  values before and after. Confirmed by a check.
- When "Simpan evaluasi" is pressed twice quickly, then one evaluation
  is saved.
- When the tab opens on a phone, then the form stacks and the lists
  become cards with no sideways scroll; it shows within about 1 second
  on the preview.

No case was met on `main` before this spec: the tab was empty. All of it
is built here.

## Not included

- Replacement, and the jump to it after a Kurang result ("Mentor
  replacement").
- Results that come from the student survey ("Student survey results").
- Values suggested from notes, scores and the survey: they wait for
  those features.
- The limits 80 and 65 for Baik, Cukup and Kurang are the prototype's
  values, to be confirmed by the campus before launch.

## Better than the prototype

- Empty or out-of-range values are refused with a message instead of
  being silently changed.
- A double press saves once.

## Decided

1. The periods that can be chosen are the current academic period and
   the one before.
2. There is one evaluation per group per period. Saving again for the
   same period corrects it, with the old values in the log.
3. This spec reads the running period from "Academic period" and has no
   rule of its own.

Decided while building, where the issue gave no answer:

4. Each value is a whole number from 0 to 100. A value with a decimal is
   refused, with the same message that names the aspect.
5. "Nilai evaluasi" is shown with one decimal, written with a comma as
   the app writes numbers (79,8), a half going up. The predikat is
   judged on the number that is shown, so the two never disagree.
6. "Evaluasi terakhir" of a group is the evaluation of the mentor who
   holds the group today, for the latest period. A group whose mentor
   was replaced shows "Belum dievaluasi" until the new mentor is
   evaluated. "Evaluasi kurang" counts by the same rule.
7. "Evaluasi terakhir" of a mentor is their evaluation for the latest
   period, over every group they were evaluated in; among several of one
   period, the one saved last.
8. Every list of evaluations shows the one saved last first. An
   evaluation that is corrected moves to the top.
9. The first save adds a log line too, with no values before. A save
   that changes nothing writes nothing: no log line, and the earlier
   date and evaluator stay.
10. When the group has another mentor by now, the evaluation of that
    period stays with the earlier mentor and cannot be corrected. The
    message says so and asks for another period. "Mentor replacement"
    can change this.
11. A group without a mentor cannot be evaluated: the tab says so and
    shows no form. A group that was ended by cancelling its penetapan
    cannot be evaluated either; its evaluations stay stored and are
    shown nowhere, like the group itself.
12. Seeing evaluations is a permission of its own, held by Kepala Unit,
    Direktur / Wakil Direktur, Pegawai UPK and Ketua Program Studi. A
    role without it sees no evaluation on any screen. Ketua Program
    Studi sees those of their program's groups only, on every screen.
13. Pengasuh sees no evaluation, not their own either: they cannot open
    the Pengasuh menu today, and the prototype shows them none.
14. The form starts empty, since suggested values are not included.
    "Nilai evaluasi" shows once all four values are valid.
15. Choosing a period that already has an evaluation fills the form with
    it and says that saving again corrects it.
16. The box above the form shows the mentor, since when, the number of
    active students and the last evaluation. Of "Alur penggantian" only
    the line about evaluation is shown, under the heading; the rest
    belongs to "Mentor replacement".
17. While no academic period runs, the form is not shown and a line
    says where to set one.
18. "Catatan evaluasi" may be left empty and holds 1,000 characters at
    most.
19. The button "Evaluasi pengasuh" on a group page shows only while the
    group has a mentor.
20. When "Simpan evaluasi" reaches the server twice at the same moment,
    the second waits for the first and then finds nothing to change.
21. The sample data has five evaluations by the sample Kepala Unit: four
    groups of the angkatan before the newest for the period before
    (two Baik, one Cukup, one Kurang), and one of them also for the
    running period.

## Steps

- [x] 1. Evaluations and their change log are stored; the periods rule
  and the predikat rule, with tests.
- [x] 2. The permission to evaluate, with its checks.
- [x] 3. The tab with the form and "Evaluasi terbaru".
- [x] 4. Evaluations on the group page, the mentor page, both lists and
  the "Evaluasi kurang" number.
- [x] 5. Read-only view, double press and phone layout.
