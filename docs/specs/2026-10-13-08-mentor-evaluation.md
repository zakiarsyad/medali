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

## Steps

- [x] 1. Evaluations and their change log are stored; the periods rule
  and the predikat rule, with tests.
- [x] 2. The permission to evaluate, with its checks.
- [x] 3. The tab with the form and "Evaluasi terbaru".
- [ ] 4. Evaluations on the group page, the mentor page, both lists and
  the "Evaluasi kurang" number.
- [ ] 5. Read-only view, double press and phone layout.
