# Unseen column title that makes the whole page scroll sideways

Kind: fix, found while building "Pengaturan: Hak akses tiap peran on a
phone"

Depends on: nothing beyond what is merged

## What we want

In a window between phone width and a wide laptop, the whole page of
Pengaturan > Pengguna dan peran scrolls sideways. The staff list is
wider than its panel there, and scrolls sideways inside its own box, as
it should. But the title "Tindakan" above the buttons of a row, which
is on the page only for screen readers and is not seen, is not held by
that box. It stands past the right edge of the screen and makes the
whole page wider. After this work a list that is wider than its panel
scrolls only inside its own box.

Seen on a local computer with sample data, as Kepala Unit, in a browser
window 900 wide:

- The page is 1,101px wide in a window of 900px, so the whole page
  scrolls sideways, top bar and all.
- The part that reaches 1,101px is the unseen title "Tindakan" in the
  headings of the staff list. The seen parts of the list end inside
  their box.
- At a width of 1366 the list fits and the page does not scroll
  sideways. At phone width the headings of the list are not shown, and
  the page does not scroll sideways either.

The unseen title uses the shared style for words that only a screen
reader gets, and the box is the shared box that lets a list scroll
sideways. Other lists with an unseen title above their buttons are
built the same way, so they can do the same wherever the list is wider
than its box.

## Who it is for

Everyone who opens a list with buttons in a narrow window on a
computer or on a tablet.

## What should happen

- When Kepala Unit opens Pengaturan > Pengguna dan peran in a window
  900px wide, then the page is as wide as the window and does not
  scroll sideways. The staff list still scrolls sideways inside its own
  box, and all its columns and buttons can be reached there.
- When any list in the shared sideways-scrolling box holds words that
  only a screen reader gets, then those words never make the page wider
  than the window, with no rule of the list's own. Confirmed by a
  check.
- When a screen reader reads the headings of the staff list, then it
  still reads "Tindakan" above the buttons, as today.
- When the page is opened at phone width or at a width of 1366, then
  it looks as it does today.

## Not included

- Making the staff list fit a window 900px wide without scrolling
  inside its box.
- Any change to what the lists hold or to who may see them.
- The row of tabs under the page title.

## Decided

1. It is fixed once, in the shared styles, so that the shared
   sideways-scrolling box holds the unseen words inside it. No list gets
   a rule of its own.
2. The lists checked on screen are the staff list on Pengguna dan peran
   at 900px wide, where the fault was seen, and the list "Jadwal dan
   kehadiran" on Kegiatan PPKS, which also has an unseen title above its buttons
   and made the page 989px wide in a window of 900px. The check covers
   the rest.
3. If the fault had not shown at 900px wide, nothing would have been
   changed. It did show, at 1,101px, so it is fixed.

Decided while building, because the issue did not say:

4. The check also makes sure that the shared style is the only style in
   the app that hides words from sight but keeps them for screen
   readers. A second such style would not be held by the shared box.

## Steps

- [x] 1. Words that only a screen reader gets stay inside the shared
  sideways-scrolling box of their list, with a check, and Pengguna dan
  peran does not scroll sideways as a whole page at 900px wide.
