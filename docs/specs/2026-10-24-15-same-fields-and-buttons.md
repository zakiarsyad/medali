# One look for form fields and buttons

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

Form fields and buttons change size from screen to screen, and
sometimes on one screen:

- On Mahasiswa the filters with a label are 13 px semibold and 32 px
  tall, while the search box and filters beside them are 15 px normal
  and 37 px tall. Dashboard filters are 13 px semibold, Pembinaan
  filters 15 px normal, the status choices inside the Pembinaan table
  13 px normal. In all, 12 field looks at 1280 px and 15 at 375 px.
- Text typed into a field with its label around it shows bold, on
  Pengaturan, Penilaian, Konseling and others.
- The main button is 35 px tall and the second button 37 px, side by
  side on Mahasiswa, Pengasuh and Pembinaan.
- Inside a table both shrink to 13 px: "Proses" on Asrama ›
  Pelanggaran, "Validasi" on Tugas saya, "Ganti" on Pengasuhan,
  "Tindak lanjuti" on Konseling and Penilaian › Asesmen.

The cause: fields and buttons take the text size of whatever they sit
in, and only the second button has a border.

## Who it is for

Every role, on every screen with a form, a filter or a button.

## What should happen

- When any form field shows (text, search, number, date, time, choice
  list, file), then its text is 15 px at normal weight and it is 40 px
  tall, also inside a label and inside a table.
- When text is typed into a field, then it shows at normal weight; the
  label above it stays semibold.
- When a main button and a second button sit side by side, then they
  are the same height, 40 px, with the same text size.
- When a button sits inside a table, then it has the same size as
  anywhere else.
- Buttons that look like links keep their look.

## Not included

- Tap sizes on a phone, which have their own issue.
- Choose-one button rows and the small chips, which have their own
  issue.
- Wording of buttons and labels.

## Decisions

1. Field and button values come from the shared set: 15 px, 40 px tall.
2. Fields and buttons keep their own size wherever they sit, rather
   than taking it from the label or table around them.
3. Decided while building: a field of several lines, where a note is
   written, is at least 40 px tall and keeps its own height above that,
   since the list of field kinds above leaves it out and 40 px would
   leave no room to write.
4. Decided while building: the second button takes the shared button
   values in full, so its text becomes semibold like the main button's,
   as the shared set names one look for both.
5. Decided while building: buttons with a look of their own that are
   neither the main nor the second button keep it: "Keluar" in the side
   menu, the account cards on the sign-in page and the mark that removes
   a photo.

## Steps

- [x] 1. Every form field takes its text size, weight and height from
  the shared field values wherever it sits, with a check.
- [x] 2. The main and the second button take their text size, weight,
  height and inner space from the shared button values wherever they
  sit, buttons that look like links unchanged, with a check.
