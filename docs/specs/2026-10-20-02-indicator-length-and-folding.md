# Indicator length and folding

Depends on: nothing beyond what is merged
Group: Kurikulum
Kind: fix, found by "Audit: Kurikulum"

## What we want

"Ubah indikator utama" on Kurikulum takes a text of any length for each
of the 24 main indicators, and a long word in an indicator or in a
Penjabaran box runs out of its box. After this work an indicator has a
longest length, checked by the server, and typed text folds inside its
box on a phone and on a computer.

Seen in "Audit: Kurikulum", on a local computer with sample data:

- As Kepala Unit and as Pegawai UPK, the server saved an indicator text
  of 5,000 letters and one of 200,000 letters, sent by hand. The box has
  no longest length either. With the 200,000 letters the page grew from
  about 70 KB to about 470 KB for every role who opens Kurikulum, and
  took 0.70 second to load in place of 0.19.
- Every other text on Kurikulum already has a limit checked by the
  server: an activity name 100, a description 500, a Penjabaran text 500,
  a kegiatan acuan 100.
- A word of 46 letters with no blank, in an indicator box on a phone
  (390 wide), made the page scroll sideways (421 wide). On a computer
  (1366) the text ran 53px past its box into the next one.
- The same word in the Penjabaran text, in "Kegiatan acuan" and in
  "Indikator tahap" ran past its box on a phone (to 364, 380 and 389px,
  with the box ending at 349px) and 4 to 29px into the next column on a
  computer.
- The PPKS table and "Kegiatan khusus dan tambahan" already fold such a
  word correctly.

## Who it is for

Kepala Unit and Pegawai UPK, who change the indicators, and every role
that reads Kurikulum.

## What should happen

- When Kepala Unit or Pegawai UPK saves the main indicators with one text
  longer than 300 characters, then nothing is saved and the message says
  "Teks indikator paling banyak 300 karakter."
- When they type in an indicator box, then the box takes no more than 300
  characters.
- When a request sent by hand holds a text longer than 300 characters,
  then the server refuses it with the same message. Confirmed by a check.
- Lengths are counted after the blanks around the text are taken off, as
  the empty-text check does today.
- When an indicator text is one long word with no blank, then it folds
  inside its box in Indikator utama MEDALI and under "Indikator tahap",
  on a phone and on a computer, and the page does not scroll sideways.
- When a Penjabaran text or a kegiatan acuan is one long word, then it
  folds inside its box the same way.
- When the texts are of normal length, then everything shows and saves
  as today, with the same messages.

## Not included

- Texts saved before this work. The sample data holds none over the
  limit, and no table change is made.
- The limits of the activities and of Penjabaran, which are already in
  place.
- Saving the indicators or a Penjabaran box from two windows at once:
  each has its own issue, "Kurikulum: Main indicators saved from two
  windows" and "Kurikulum: A Penjabaran box saved from two windows".

## Decided

1. The limit is 300 characters. The longest starting indicator text is
   under 200, and a Penjabaran text, which says more, takes 500.
2. The limit is named once beside the other checks of the indicator
   texts, and used by the form and by the server.
3. A long word folds with the fold the app already uses for typed text
   (text may break anywhere when a word is longer than its box), not a
   new style. The shared style for typed text in a cell of a list also
   holds a narrowest and a widest width, made for table columns; the
   boxes of Kurikulum take only its fold, since a widest width would
   leave a long text narrower than its box.
4. The texts are checked in the order shown, and the first text that is
   empty or too long gives the message.

## Steps

- [x] 1. The server refuses an indicator text over 300 characters, and
  the boxes take no more.
- [x] 2. A long word folds in Indikator utama MEDALI, "Indikator tahap",
  the Penjabaran text and "Kegiatan acuan".
