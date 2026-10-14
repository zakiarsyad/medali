# Hak akses tiap peran on a phone

Kind: fix, found by "Audit: Pengaturan"

Depends on: nothing beyond what is merged

## What we want

On a phone, "Hak akses tiap peran" on Pengaturan > Pengguna dan peran
cannot be read. On a computer its headings scroll out of view. After
this work Kepala Unit reads what each role may open and do at both
sizes.

Seen in "Audit: Pengaturan", on a local computer with sample data and on
the preview of `main`, as Kepala Unit:

- At a phone width of 390 the table stays a table of three columns. It
  is 4,440px high. The column "Tindakan" is about 100px wide, so the
  rights of Kepala Unit alone run down 1,402px, one or two words a line.
- The table is 329px wide in a box of 308px, so the last letters of the
  rights are cut off and the box has to be scrolled sideways.
- The role name stands only at the top of its row and the headings
  "Peran", "Menu" and "Tindakan" only at the top of the table. Part-way
  down a long row nothing says which role the rights belong to.
- At a computer width of 1366 the table is 1,164px high and its headings
  scroll out of view too.

## Who it is for

Kepala Unit.

## What should happen

- When Kepala Unit opens "Hak akses tiap peran" on a phone, then each
  role is its own card: the role name as the card's heading, then
  "Menu" with the menus of the role, then "Tindakan" with its rights.
  Nothing is cut off and nothing scrolls sideways, at a width of 390
  and of 320.
- When a role has many rights on a phone, then each right starts on its
  own line, so the list is read down and not as one long sentence.
- When a role has no right, then "Tindakan" shows "-" as today.
- When Kepala Unit scrolls the table on a computer, then the headings
  "Peran", "Menu" and "Tindakan" stay in view under the top bar until
  the table ends.
- When a role or a right is added to the permission list later, then it
  shows here at both sizes with no other change: the screen is still
  built from the one permission list.
- The roles, menus and rights shown, their words and their order stay
  as today.

## Not included

- The tabs each role opens inside a menu. The table lists menus only,
  as today.
- The staff list and the panel Badan Asrama Mahasiswa on the same tab.
- Any change to what a role may do.

## Decided

1. On a phone the list shows cards, not a table that scrolls sideways,
   as the other lists of the app became on a phone in "Groundwork:
   Lists with their buttons on a phone".
2. Cards are used from the same width down at which the other lists of
   the app turn into cards.

Decided while building, because the issue did not say:

3. A card looks like a row of the other lists on a phone: one block per
   role with a line under it. The titles "Menu" and "Tindakan" stand
   above their values, not beside them, because the values are long and
   need the whole width of a phone.
4. On a phone the commas between the rights are left out, as each right
   has its own line. On a computer the rights read as one sentence with
   commas, as today.
5. On a computer the list no longer sits in a box that can scroll
   sideways. Headings cannot stay in view inside such a box, and the
   three columns fit every computer width.
6. The headings stop right under the top bar. For that the height of
   the top bar at computer width is named once and the top bar uses it.
   The top bar looks as before.

## Steps

- [ ] 1. On a phone "Hak akses tiap peran" shows one card per role, with
  each right on its own line.
- [ ] 2. On a computer the headings of the table stay in view while it
  scrolls.
