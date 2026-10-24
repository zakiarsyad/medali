# Mentoring score indicators

Depends on: Mentoring scores
Group: Pengasuhan

## What we want

On "Nilai pengasuhan", Pengasuh no longer types one score from 0 to 100.
They give each mentee a score from 1 to 5 on six indicators. The final
score is the average of the six times 20, so from 20 to 100; each
indicator weighs the same. Kepala Unit sets the name and sentence of each
indicator on the same tab.

## Who it is for

- Score: Pengasuh, for the groups they hold today.
- Change the indicators: Kepala Unit.
- Read only: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi,
  Pengasuh.

## What should happen

- When anyone who reads the tab opens it, then the panel "Indikator
  penilaian" shows six indicators with name and sentence, and the meaning
  of each number: 1 Sangat kurang, 2 Kurang, 3 Cukup, 4 Baik, 5 Sangat
  baik.
- When nothing has been changed yet, then the indicators are Mandiri,
  Empati, Disiplin, Adaptif, Loyal and Integritas, each with the
  first-level main indicator text of that value from Kurikulum.
- When Kepala Unit changes a name or sentence and presses "Simpan
  indikator", then the message says "Indikator penilaian disimpan." and
  the note says "Ditetapkan (date) oleh (name)." An empty name, two equal
  names, or a sentence over 200 characters saves nothing and the field
  says so.
- When another role opens the panel, then it cannot be changed and says
  "Indikator penilaian ditetapkan oleh Kepala Unit Pembangunan Karakter."
- When Pengasuh looks at "Nilai anak asuh", then each mentee has six
  choices 1–5, one per indicator, then "Nilai akhir" and the "Keterangan"
  from "Panduan penilaian".
- When Pengasuh fills in all six for a mentee, then "Nilai akhir" shows
  at once, to one decimal: 4, 5, 4, 3, 5, 4 gives 83.3; six 5s give 100;
  six 1s give 20. Confirmed by a check.
- When only part of the six are filled in for a mentee, then the row says
  "Lengkapi enam indikator" and nothing of that save is kept.
- When Pengasuh presses "Simpan (n) nilai", then the six scores and the
  final score are saved, the numbers update, and "Rerata nilai
  pengasuhan" uses the final scores.
- When Kepala Unit changes the indicators after scores were given, then
  those scores keep the names they were given with; new scores use the
  new names. Confirmed by a check.
- When a mentee has a score saved before this change, then it shows with
  "Nilai tanpa indikator" and still counts, until Pengasuh gives the six
  scores, which replace it.
- When the character grade uses the mentoring score, then it uses the
  final score. Confirmed by a check.
- When a score that is not a whole number 1–5 is sent, or anyone but
  Kepala Unit sends indicators, then the server refuses it. Two saves of
  the indicators at once: the second is told "Indikator sudah diubah oleh
  (name). Muat ulang." Every change of indicators or scores goes into the
  log. Confirmed by a check.
- When used on a phone, then each mentee is a card with the six choices
  stacked, with no sideways scroll.

## Not included

- Another number of indicators, or a different weight per indicator.
- A set of indicators per semester: there is one current set.
- Showing the six indicator scores in the student detail or Dashboard.
- The meanings of 1–5 are a first draft, to be confirmed by the campus.

## Open questions

None.

## Steps

- [x] 1. The indicators are stored with who changed them and when,
  starting with the six MEDALI values; the right for Kepala Unit to
  change them, with checks.
- [ ] 2. A score keeps its six indicator scores and the names they were
  given with; earlier scores stay as "Nilai tanpa indikator"; sample data
  gets six-indicator scores.
- [ ] 3. The rule for the final score (average × 20, one decimal), with
  checks, used by the tab and by the character grade.
- [ ] 4. The panel "Indikator penilaian" shows, read only.
- [ ] 5. Kepala Unit changes and saves the indicators, with the refusal
  of a second save.
- [ ] 6. Pengasuh gives six scores per mentee and saves them, with the
  final score and "Lengkapi enam indikator".
- [ ] 7. Refusals, the log and the phone layout.
