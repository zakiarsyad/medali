# Status badges that look the same on every screen

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

Status badges such as "Disetujui", "Menunggu", "Ditolak" and "Belum
diminta" look different depending on the screen:

- On Konseling and Asrama › Kegiatan every badge shows dark text on the
  gold background with only a coloured border. The same badges on
  Penilaian, Dashboard and Asrama › Dashboard show green, amber or red
  text on white. The cause is the order in which the app's styles load:
  on those two screens the general badge look wins over the status
  colour.
- Two looks mean the same thing: coloured text on gold (health,
  fitness, SIKU, violation notes, dorm health) and coloured text with a
  coloured border on white (the rest).
- Some badges are too pale to read: "Baik" on gold is 1.85 to 1,
  "Belum dites" 2.49 to 1, "Perlu perhatian" 2.83 to 1, and the amber
  badges on white 3.48 to 1. Badge text is 12.5 px, which needs 4.5 to 1.
- The same badge look is copied into eight screens instead of being
  shared, and one of the copies sets a border colour with no border.

## Who it is for

Every role that sees a status: on Konseling, Kegiatan, Asrama,
Pengasuh, Penilaian, Pembinaan, Tugas saya, Dashboard and Profil saya.

## What should happen

- When a badge says the same kind of status (good, warning, bad or
  plain), then it has the same colours on every screen, whatever screen
  was opened first.
- When any badge shows, then its text reaches a contrast of at least
  4.5 to 1 on its background.
- When Konseling or Asrama › Kegiatan opens, then its badges show the
  status colour, as on Penilaian.
- When a health or fitness category shows as a badge, then it uses the
  same badge look as the other statuses, in the colour of its meaning.
- Badges keep their words.

## Not included

- Which status a record has, or the words of a status.
- Colours of charts and bars on the dashboards.

## Decisions

1. One badge look for the whole app, from the shared set of values,
   with one colour set per meaning.
2. The look kept is coloured text with a coloured border on white,
   because most screens use it.
3. Decided while building: a badge that names a thing rather than a
   status, such as a role, a Kategori or a Jenjang, keeps the gold label
   look. It has no meaning of good or bad, and its dark text on gold
   already reaches 4.5 to 1.
4. Decided while building: the health and fitness categories take the
   meaning their colour already had: "Sangat baik" and "Baik" good,
   "Perlu perhatian" warning, a medical category bad, and "Belum dites"
   plain. "Baik" and "Sangat baik" then share one colour; their words
   still tell them apart, and the bars keep their own colours.

## Steps

- [ ] 1. One shared badge look for each meaning, which wins over the
  general badge look whatever order the styles load in, with a check.
- [ ] 2. The status badges of every screen use the shared look, and the
  copies on each screen are removed.
