# Forms in a panel on a very narrow phone

Depends on: Base page, Lists with their buttons on a phone
Group: Groundwork

## What we want

On a very narrow phone, a form inside a panel is wider than the panel,
so the page scrolls sideways. The shared form grid asks for columns of
at least 260px. At phone width the page keeps 16px free on each side,
and a panel adds 24px and a 1px line on each side, which leaves 238px
on a screen 320px wide. It happens on every screen narrower than 342px.
This was worked out from the named sizes, not measured on a screen, so
the first step is to see it.

Forms built this way today: "Evaluasi pengasuh" in Pengasuh > Evaluasi
dan penggantian, "Tambah periode" in Pengaturan > Periode akademik, and
"Catatan baru" in Pengasuhan > Catatan pendampingan.

## Who it is for

Everyone who fills in a form on a small phone.

## What should happen

- When a form inside a panel is opened on a screen 320px wide, then its
  fields stack in one column inside the panel and the page does not
  scroll sideways.
- When the same form is opened on a laptop, then it looks as it does
  today.
- When a new form uses the shared form grid, then it gets this without
  its own rule. Confirmed by a check.

## Not included

- Any other change to the look of forms.
- Tables and lists; "Lists with their buttons on a phone" covers them.

## Decided

1. If the fault does not show on a real 320px screen, nothing is changed,
   a comment says what was seen, and the issue is closed.
2. It is fixed once, in the shared form grid, so that a column is never
   asked to be wider than the room its panel has.

## What was seen

On a local computer with sample data, in a browser set to a screen 320px
wide, as Kepala Unit and as Pengasuh:

- On all three forms each field is 260px wide where the panel has room
  for 238px. The fields stay in one column but run 22px into the panel's
  right edge space, and end 3px from its border.
- With only these three forms open, the page does not scroll sideways:
  the fields end at 301px of the 320px.
- The page does scroll sideways on Pengaturan > Periode akademik once
  "Ubah tanggal" is opened in the list. That form uses the same shared
  form grid, sits further in, and makes the page 335px wide.

So the fault shows, and the fix is built.

Decided while building, because the issue did not say:

3. The fault counts as showing, although the three forms named do not
   make the page scroll sideways by themselves: their fields are wider
   than the panel's room, and a fourth form on the shared form grid does
   make the page scroll.
4. "Ubah tanggal" is not changed by a rule of its own. It gets the fix
   from the shared form grid, like any form that uses it.

## Steps

- [x] 1. See the fault on a 320px screen on the three forms named.
- [ ] 2. The shared form grid fits its panel on a narrow screen, with a
  check.
