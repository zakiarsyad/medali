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

## Decisions made while building

1. The starting sentences are the first-level texts Kurikulum starts
   with. A text changed later in Kurikulum is not taken over, since it
   may be up to 300 characters long, more than an indicator sentence
   holds.
2. A name of an indicator holds at most 50 characters.
3. A score keeps its final score with one decimal, as it is shown, and
   the character grade uses that number. A closed semester keeps the
   mentoring part with one decimal too.
4. In the sample data the last mentee of each group that is fully
   scored keeps a score given before the indicators, so "Nilai tanpa
   indikator" can be tried on the preview. Every other sample score is
   given on the six starting indicators, with the same spread of final
   scores as before.
5. The rule for the final score is written with the second step, since
   the sample scores are worked out by it.
6. A final score is shown with a decimal comma, as other numbers on the
   screens are, such as 83,3, and a whole one without it, such as 100.
7. "Panduan penilaian" puts a final score with a decimal in the band
   whose lowest score it reaches: 84,9 is in 75–84.
8. The panel "Indikator penilaian" comes first on the tab, above the
   group choice, and shows also when there is no group to read or no
   running period. Its head says "Skala 1–5", and the meanings of the
   numbers are under the heading "Arti nilai", in the look of "Panduan
   penilaian".
9. While nobody has set the indicators, the note says "Indikator awal:
   nilai MEDALI dengan indikator utama tingkat 1 dari Kurikulum."
10. An empty sentence saves nothing either, and its field says
    "Kalimat indikator wajib diisi."
11. Two names are equal also when they differ only in capitals or in
    blanks around them. Both fields say so. Blanks around a name or a
    sentence are not kept.
12. Each field says at once what is wrong with it, and "Simpan
    indikator" is off while anything typed cannot be saved, as in
    "Skema bobot". The server checks the same again.
13. "Simpan indikator" saves without asking first: unlike "Skema bobot",
    it changes no score given already.
14. Each of the six is a choice from a list: "-" for none, then 1 to 5
    with its meaning, such as "4 Baik". Each indicator has a column of
    its own, headed by its name, then "Nilai akhir" and "Keterangan".
15. A role that only reads sees the same columns, with the six scores
    as numbers and a dash where there are none. A score given under
    another name than the one in force shows that name under it.
16. The head of "Nilai anak asuh" says "Nilai akhir = rerata enam
    indikator × 20" in place of "Skala 0–100".
17. A score given before the indicators shows its six choices empty.
    Emptying the choices again leaves it as it is; filling in all six
    replaces it.
18. A row with only part of the six is sent with the others, so the
    server refuses the whole save and says so, as a box that held no
    score did before. Emptying all six of a row that has six saved also
    says "Lengkapi enam indikator".
19. Six choices that are the six kept write nothing and add no log
    line, even when the indicator names changed since.
20. On a laptop screen too narrow for the ten columns, the table
    scrolls sideways inside its own frame, as other wide tables do; the
    page itself does not.
21. The form "Nilai anak asuh" carries the indicators it was opened on.
    When Kepala Unit has changed them since, the whole save is refused
    and nothing of it is kept, so no score lands under another
    indicator: the message says "Indikator penilaian sudah diubah oleh
    (name). Muat ulang." This is checked before whether a score was
    saved in between, so it is the message given when both changed. A
    save of scores waits for a save of the indicators under way.

## Steps

- [x] 1. The indicators are stored with who changed them and when,
  starting with the six MEDALI values; the right for Kepala Unit to
  change them, with checks.
- [x] 2. A score keeps its six indicator scores and the names they were
  given with; earlier scores stay as "Nilai tanpa indikator"; sample data
  gets six-indicator scores.
- [x] 3. The rule for the final score (average × 20, one decimal), with
  checks, used by the tab and by the character grade.
- [x] 4. The panel "Indikator penilaian" shows, read only.
- [x] 5. Kepala Unit changes and saves the indicators, with the refusal
  of a second save.
- [x] 6. Pengasuh gives six scores per mentee and saves them, with the
  final score and "Lengkapi enam indikator".
- [x] 7. Refusals, the log and the phone layout.
