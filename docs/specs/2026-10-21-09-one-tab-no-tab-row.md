# No row of tabs for a page with one tab

Depends on: nothing beyond what is merged
Group: Groundwork
Kind: fix, found by "App-wide audit: Activities and scores"

## What we want

When a role may open only one tab of a page, the page still draws a row
of tabs holding that one tab. The prototype, the reference for screens,
draws the row of tabs on Kegiatan karakter, Asrama, Pembinaan, Penilaian
and Pengaturan only when the role has more than one tab there. No spec
decided otherwise. After this work a page shows its row of tabs only
when the role has two tabs or more.

Seen in "App-wide audit: Activities and scores", on a local computer with
sample data, on a phone and on a computer:

- Adit Nugraha (Mahasiswa), on Penilaian: one tab, "Penilaian SIKU".
- Lina Marlina (Penilai Mahasiswa), on Kegiatan karakter: one tab,
  "Klarifikasi kehadiran".
- Hendra Wijaya (Pengasuh), on Asrama: one tab, "Kesehatan".
- Maya Puspitasari (Pengelola Asrama), on Pengaturan: one tab,
  "Pengguna baru mahasiswa".

## Who it is for

Every role that may open only one tab of a page.

## What should happen

- When a role may open only one tab of a page, then the page shows its
  title, its lead text and the tab's content, with no row of tabs.
- When a role may open two tabs or more, then the row of tabs shows as
  today, with that role's tabs only, in the prototype's order.
- The address of the tab, the menu, and the refusal of a tab the role
  may not open stay as today.
- The same holds on a menu page not built yet, which shows its title
  and an empty area.
- Confirmed by a check: one tab gives no row of tabs, two tabs give a
  row of two.

## Not included

- Which tabs each role may open.
- A row of tabs that does not fit and scrolls sideways.
- Pengasuh and Pengasuhan, whose roles always have more than one tab.

## Decisions

1. The tab's name is not shown anywhere instead. The prototype shows the
   page title and the tab's own content only.
2. One rule in the shared row of tabs, so every page follows it, as the
   prototype does on each page with tabs.
3. None of the four cases above was met on `main`: the shared row of tabs
   drew every tab it was given, however many.

## Steps

- [ ] 1. The row of tabs shows only when the role has two tabs or more.
