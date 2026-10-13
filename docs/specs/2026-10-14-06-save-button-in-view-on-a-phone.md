# Save button in view on a phone for a full group

Depends on: Mentoring meetings and attendance, Mentoring scores
Group: Pengasuhan

## What we want

On a phone, a mentor of a full group cannot reach the save button
without scrolling past every mentee.

Seen in "Audit: Pengasuhan", on a local computer with sample data, at a
phone width of 390, as the Pengasuh of a group of 34:

- "Daftar hadir pertemuan (n)": each mentee is a card about 120px high,
  so "Simpan daftar hadir", "Tutup" and the running count "Hadir (n),
  izin (n), sakit (n), alpa (n)" stand about 4,300px below the first
  mentee, five screens down. While marking, the mentor sees neither the
  button nor the count.
- "Nilai anak asuh": each mentee is a card about 216px high, so "Simpan
  (n) nilai" and its message stand about 7,100px below the first
  mentee, eight screens down. A mentor who changes one score near the
  top does not see that the button now reads "Simpan 1 nilai", and
  after pressing it has to be at the very bottom to read what the save
  answered.

The audit asks that the save button is always reachable. The button,
with what belongs beside it, must stay in view on a phone while the
list scrolls.

## Who it is for

Pengasuh, who fills in attendance and scores for up to 35 mentees, most
often on a phone during or right after a meeting.

## What should happen

- When Pengasuh opens "Daftar hadir pertemuan (n)" on a phone and
  scrolls through the mentees, then "Simpan daftar hadir", "Tutup" and
  the running count stay in view at the bottom of the screen.
- When Pengasuh opens "Nilai pengasuhan" on a phone and scrolls through
  the mentees, then the save button stays in view at the bottom of the
  screen, reading "Simpan nilai" or "Simpan (n) nilai" as today, and
  switched off as today while nothing is changed.
- When a save answers, with "Daftar hadir pertemuan (n) disimpan.",
  "(n) nilai pengasuhan disimpan." or a message that says why nothing
  was saved, then the message is in view without scrolling, wherever
  in the list the mentor is.
- When the last mentee is scrolled to, then the bar does not cover the
  card: every choice and every score box can still be read and pressed.
- When the phone's keyboard is open on a score box, then the box being
  typed in is not hidden by the bar.
- When a group has only a few mentees, so the whole form fits the
  screen, then the button stands under the last mentee as today, with
  no empty space added.
- When the same two forms are opened on a laptop, then they look as
  they do today.
- When a role that only reads opens the two tabs, then nothing changes:
  it has no button.
- When the two tabs are opened on a phone with the bar in view, then
  the page still does not scroll sideways.

## Not included

- "Catatan baru": its form is short and its button is always near.
- The other long forms of the app. A form elsewhere with the same fault
  gets its own issue.
- Any change to what is saved, to the messages, or to the layout of a
  mentee's card.

## Better than the prototype

The prototype keeps both buttons under the last row too. With 35
mentees on a phone that is far away; here they stay in view.

## Decided

1. The bar is part of the form and sticks to the bottom of the screen
   while its form is on screen; it is not a second copy of the button.
   Once the form's own end is reached it rests there, as today.
2. It sticks on a phone only, at the width where each mentee already
   becomes a card. A laptop shows many more rows at once and keeps
   today's layout.
3. The message of a save is shown in the bar, above or beside the
   button, so it is read where the mentor is. A message that names rows
   still marks those rows as today.
4. The colours, the spacing and the shadow or line of the bar use the
   names in the shared style file. No loose value is added.
5. No library is added.

Decided while building, because the issue did not say:

6. "A phone" is the app's one phone width, the width at which the menu
   folds away and the list of "Nilai pengasuhan" turns each mentee into
   a card. The bar of "Daftar hadir pertemuan (n)" sticks at the same
   width, so both forms change together.
7. In "Daftar hadir pertemuan (n)" the message of a save stands above
   the buttons on a phone, so the buttons do not move when a message
   comes. In "Nilai pengasuhan" it stays beside the button, and folds
   under it when it is long, as today. On a laptop both stay as today.
8. On a phone the bar has a line above it and a little room above and
   below the button, so the button does not touch the edge of the
   screen. At the end of the form the bar keeps that room; no other
   space is added.
9. A choice or a score box that the phone brings into view, such as the
   box being typed in, stops above the bar and not behind it.

## Steps

- [ ] 1. On a phone the buttons, the running count and the message of
  "Daftar hadir pertemuan (n)" stay in view while the list scrolls.
- [ ] 2. On a phone the button and the message of "Nilai anak asuh"
  stay in view while the list scrolls.

