# The choice Peran on a very narrow phone

Kind: fix, found while building "Pengaturan: Hak akses tiap peran on a
phone"

Depends on: nothing beyond what is merged

## What we want

On a very narrow phone, Pengaturan > Pengguna dan peran scrolls
sideways. The choice "Peran" above the staff list is as wide as its
longest role name, which is wider than the panel it sits in. After this
work the choice fits its panel and the page does not scroll sideways.

Seen on a local computer with sample data, as Kepala Unit, in a browser
set to a screen 320 wide:

- The choice "Semua peran" above the staff list ends 324px from the
  left edge of a screen that is 320px wide.
- The page is 324px wide, so it scrolls sideways by 4px.
- At a width of 390 the choice fits and the page does not scroll
  sideways.

## Who it is for

Kepala Unit on a small phone.

## What should happen

- When Kepala Unit opens Pengaturan > Pengguna dan peran on a screen
  320px wide, then the search field, the choice "Peran" and the button
  above the staff list all end inside their panel, and the page does not
  scroll sideways.
- When a role name is too long for the choice on that screen, then the
  choice is as wide as its panel and the name is cut short inside it,
  as the browser does for a choice that is narrower than its words. The
  full names still show when the choice is opened.
- When the same page is opened at a width of 390 or on a computer, then
  the search field, the choice and the button look as they do today.
- When another list uses the same shared row of filters, then its
  fields are held inside their panel in the same way, with no rule of
  its own. Confirmed by a check.

## Not included

- The row of tabs under the page title, which scrolls sideways inside
  itself by design.
- Any change to which roles the choice offers or to what the filter
  finds.
- Forms; "Forms in a panel on a very narrow phone" covered them.

## Decided

1. It is fixed once, in the shared style of the row of filters, so that
   a field in it is never wider than the room its panel has.
2. If the fault had not shown on a 320px screen, nothing would have
   been changed. It did show when this was built: the choice ended at
   324px and the page was 324px wide, so it is fixed.

Decided while building, because the issue did not say:

3. The two lists on Kegiatan karakter that use the shared row,
   Verifikasi presensi and Klarifikasi kehadiran, each had a rule of
   their own that held their fields in the same way. Those rules are
   removed, since the shared row now does it for them, and the check
   fails when a style file other than the shared one sets a rule on the
   row again.
4. The shared rule holds every field of the row, not only the choice,
   so a search field is held the same way on a screen even narrower.

## Steps

- [ ] 1. A field in the shared row of filters is never wider than its
  panel, with a check, and Pengguna dan peran does not scroll sideways
  on a screen 320px wide.
