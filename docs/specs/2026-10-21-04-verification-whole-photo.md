# Whole upright photo on the cards of Verifikasi presensi

Depends on: nothing beyond what is merged
Group: Kegiatan
Kind: fix, found by "Audit: Kegiatan"

## What we want

A photo from a phone is upright, but the card on "Verifikasi presensi"
shows it in a wide box 200 px high, cut to fill it. Pegawai UPK sees only
the middle half of an upright photo, and the photo cannot be opened larger.
A face near the top is lost, so "Wajah tidak terlihat jelas" cannot be
judged fairly. After this work the whole photo shows on the card and can be
opened larger.

Seen in "Audit: Kegiatan", on a local computer with sample data:

- A student sent an upright test picture (1200x1600) with three bands:
  "ATAS", "TENGAH" and "BAWAH". It was kept as 960x1280. As Pegawai UPK the
  card showed it at 306x200 on a phone (390 wide) and 322x200 on a computer
  (1366 wide), cut to fill the box: only "TENGAH" and thin strips of the
  other two showed, about half the picture's height.
- Pressing the photo did nothing: no link, no larger view.
- The prototype shows the card photo upright, 3 wide by 4 high.

## Who it is for

Pegawai UPK, who judges each photo, on a phone and on a computer.

## What should happen

- When a card shows an upright photo, then the whole photo shows in a box 3
  wide by 4 high, nothing cut off, on a phone and on a computer.
- When the photo is wider than high, then the whole photo shows in the same
  box, with an even plain background above and below.
- When Pegawai UPK presses the photo, then the full photo opens in a new
  tab, from the address the photo already has.
- Photos still load as they scroll into view, and the list still shows 24 a
  page.
- "Foto tidak tersimpan di sini." still shows in place of a photo that is
  not kept.
- The page does not scroll sideways on a 390 px phone.

## Not included

- A smaller copy of the photo for the list. The photo is already made
  smaller on the phone before it is sent (at most 1280 px, about 30–100 KB).
- The student's own page.

## Decisions

1. Cut to fill, or show the whole photo? The whole photo, so nothing that
   decides a rejection is lost.
2. How does it open larger? A link on the photo to its own address, in a
   new tab, with no new pop-up.
3. The box with no kept photo, "Foto tidak tersimpan di sini." or the words
   for a removed photo, takes the same 3 by 4 box, so a card keeps its
   height while its photo loads, as today.

## Steps

- [ ] 1. The card shows the whole photo upright and opens it in a new tab.
