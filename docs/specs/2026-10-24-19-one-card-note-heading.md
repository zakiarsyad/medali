# One look for cards, notes and section headings

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

Cards, notes and section headings each come in several looks, because
each screen writes its own copy:

- Cards: 16/24 px and a shadow on Kegiatan, Asrama › Kegiatan and
  Pengasuhan › Hadir; 12/16 px without a shadow on Asrama › Izin,
  Klarifikasi, Konseling and Tugas saya; 12/12 px on Penilaian › SIKU
  and Asrama › Pelanggaran; 12/16 px with 8 px corners and a grey
  background on Asrama › Kamar, Bersih and Kurikulum. 6 or 8 px between
  the lines. The card look is written in eight places.
- Notes: "Menu asrama dikelola oleh Pengelola Asrama…" has 12/16 px on
  Asrama › Kegiatan, Kamar, Kakak and Bersih and 8/12 px on Izin and
  Klarifikasi. On Asrama › Kegiatan the warning "Belum diumumkan. 0 dari
  145…" shows with no box, in 15 px dark text; it should be the muted
  note box with an amber border.
- Section headings: 15 px extra bold navy on Asrama › Dashboard,
  Pengasuh and Konseling; 15 px bold dark on Penilaian › SIKU and SKPM;
  13 px muted on Jasmani and Penilaian › Karakter; 14.5 px extra bold
  dark on Kurikulum.

## Who it is for

Every role.

## What should happen

- When a card shows on any screen, then it has the shared card look:
  the same inner space, corners, border and space between its lines,
  and no shadow.
- When a note shows on any screen, then it has the shared note look; a
  warning note has the same box with an amber border.
- When "Belum diumumkan…" shows on Asrama › Kegiatan, then it is in the
  warning note box.
- When a section heading shows inside a page, then it has the shared
  heading look.
- What the cards, notes and headings say does not change.

## Not included

- Badges, fields and buttons, which have their own issues.
- The "nothing here yet" text, which has its own issue.
- What a card holds, or its order.

## Decisions

1. Each look kept is the one in the shared set: cards 12/16 px, corner
   14 px, no shadow; notes 8/12 px; headings 15 px extra bold navy.
2. The room and cleaning boxes on Asrama and the boxes on Kurikulum are
   cards too and take the same look.
3. Decided while building: a card is a box that holds one item of a
   list, such as an activity, a leave request, a room or a meeting. The
   number boxes at the top of a screen, the tiles of Dashboard, panels,
   pop-ups and the sign-in box are not cards and keep their look.
4. Decided while building: a photo card on Kegiatan › Verifikasi, where
   the photo reaches the edges of the card, keeps no inner space.
5. Decided while building: a note is a box of words that explains or
   warns, wherever it stands, also inside a card or a pop-up. A line of
   small muted words without a box, such as a hint under a field, is not
   a note. A box that shows facts or numbers, such as a sum or a
   summary of a request, is not a note either and keeps its look.
6. Decided while building: a note that warns takes the warning note
   look: the box of a note with an amber border. Its words take the
   muted note colour too, like every note. This includes the boxes
   about counselling consent on Konseling and the note that a student's
   scores are held lower, which had a red border.
7. Decided while building: the amber border of a warning note is named
   once in the shared set, as the warning colour.
8. Decided while building: a section heading is the heading of a part
   inside a panel, such as "Riwayat asesmen" or "Penambahan". A panel's
   own heading and a Dashboard section's heading are one level above
   and keep their larger look; the title of a single card, such as
   "Pertemuan 1", belongs to the card and keeps its look.
9. Decided while building: a card's lines stand apart by the card's
   space between lines only, so space that a line kept above or below
   itself inside a card is taken away.

## Steps

- [x] 1. Every card takes the shared card look, with a check.
- [ ] 2. Every note takes the shared note look and every warning note
  its amber border, "Belum diumumkan…" in it, with a check.
- [ ] 3. Every section heading inside a page takes the shared heading
  look, with a check.
