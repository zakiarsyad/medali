# Buttons, tabs and fields big enough to tap on a phone

Depends on: Groundwork: One shared set of UI values; Groundwork: One look for form fields and buttons
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

On a phone almost everything you tap is smaller than 44 by 44 px:

- the menu button in the top bar: 36 by 32 px, on every screen;
- tabs: 41 px tall, on every page with tabs;
- form fields: 40 px tall;
- main and second buttons 40 px tall, such as "Masuk dengan Google",
  "Tutup", "Filter", and the day arrows only 31 px wide;
- buttons that look like links, such as "Ubah", "Hapus", "Rincian",
  "Tolak", "Batalkan", "Aktifkan", "Keluarkan": 20 to 23 px tall;
- filter and choice chips: 28 to 34 px tall, on Asrama, Pengasuh ›
  Ganti, Kurikulum, Penilaian › SIKU and the upload choice;
- check boxes and round choices with their words, such as the roles on
  Pengaturan, "Tidak hadir" on Asrama › Kegiatan, Ringan/Sedang/Berat:
  20 to 23 px tall;
- fold-open links such as "Ubah tanggal", "Ubah nomor/kapasitas",
  "Riwayat langkah": 20 to 23 px tall.

## Who it is for

Every role, on a phone.

## What should happen

- When the app shows in its phone layout, then every button, link
  button, tab, form field, chip, check box row, round choice row and
  fold-open link can be tapped anywhere in an area at least 44 by
  44 px.
- When a tap area grows, then nothing overlaps and no page scrolls
  sideways at 320, 360, 375, 390 or 430 px.
- When a button looks like a link, then it still looks like a link;
  only the area that takes the tap grows.
- When the app shows on a computer, then sizes stay as the shared set
  of values says.

## Not included

- Name links inside a row that can already be pressed as a whole.
- New layouts for screens.

## Decisions

1. 44 by 44 px, from the shared set of values, as the smallest tap
   area on a phone.
2. Only the phone layout changes, so computer screens keep their
   density.
3. Decided while building: on `main` none of the cases was met yet, so
   all of it is built.
4. Decided while building: a link inside the running words of a
   sentence or a note, such as "Pengguna dan peran" in a note, is a
   word of that sentence, not a link button, and keeps its size; growing
   it would break the line of words around it.
5. Decided while building: a link that stands on its own, such as a
   name in a list or "Lihat daftar hadir", takes the tap area of a link
   button.
6. Decided while building: the tap area of a link button grows as its
   own box, so it pushes what stands next to it aside instead of
   reaching under it. That makes some lists on a phone a little taller.

## Steps

- [x] 1. Shared parts: fields, buttons, link buttons, tabs, the menu
  button, the side menu, check box rows and fold-open links take a tap
  area of at least 44 by 44 px on a phone.
- [x] 2. Screen parts: the chips, choice rows and fold-open links of
  each screen take the same tap area on a phone.
