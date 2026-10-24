# Tabs first, then the chosen tab's description, on every page

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

On every page with tabs the page title and a description sit above the
tab bar. Most tabs bring their own description, so its length changes
from tab to tab and the tab bar jumps up and down when you switch tabs.
Measured on a computer, the tab bar's top moves by:

- Pengaturan: 23 px (Pengguna dan peran and Pengguna baru mahasiswa
  have a longer description than Periode and Berkas);
- Penilaian: 45 px;
- Asrama: 74 px (Kakak pendamping has no description above the tabs,
  Pelanggaran and Kesehatan have long ones);
- Asrama for a student: 22 px; there the description place shows the
  room status, "Belum diplot", instead of a description;
- Pengasuhan, Pembinaan, Kegiatan karakter: 22 to 23 px.

Dashboard already does it the right way: the choice of dashboard sits
first, then the title and the description. Other differences seen:

- Kakak pendamping puts its description under the tabs, at 13 px
  instead of the 15 px every other page uses.
- Konseling has no description at all. The prototype has one.
- Many tabs have a second small note under the tabs, for example
  "Menu asrama dikelola oleh Pengelola Asrama…". The space under it is
  0 px on some tabs and 16 px on others, and on Pengasuh › Penetapan,
  Pembinaan and Asrama › Klarifikasi it sits further down the page.
- The space under the dashboard choice is 16 px; under every other tab
  bar it is 24 px.

## Who it is for

Every role, on every page with tabs: Dashboard, Penilaian, Pembinaan,
Asrama, Pengasuh, Pengasuhan, Kegiatan karakter and Pengaturan, and on
Konseling.

## What should happen

- When a page has tabs, then the order is: the page title, the tab bar,
  then the chosen tab's description, then the tab's content. The title
  and the tab bar do not depend on the chosen tab.
- When you switch between any two tabs of a page, at any width, then
  the tab bar stays at the same place, to the pixel.
- When a tab has a description, then it sits right under the tab bar,
  at 15 px in the muted colour, with the shared space under the tab bar
  above it and the shared space under the description below it.
- When a tab has a second note, such as who manages the menu, then it
  sits right after the description, in the shared note look, with the
  same space on every tab.
- When a student opens Asrama, then the room status shows in the tab's
  content, not in the description place.
- When Konseling opens, then it shows the prototype's description under
  its title: "Daftar konseling secara sukarela, dan pantau jadwal
  konseling yang ditugaskan kepada Anda. Isi pembicaraan dalam sesi
  bersifat rahasia antara Anda dan konselor."
- When the dashboard choice shows, then the space under it is the same
  as under every other tab bar.
- When a page has no tabs, then its description shows as today.

## Not included

- New words for the descriptions, apart from Konseling's, which is the
  prototype's.
- Which tabs a role sees.

## Decisions

1. Tabs first, then the chosen tab's description, everywhere, as
   decided in the audit.
2. The page title stays above the tab bar, as on Dashboard, and keeps
   no description of its own on a page with tabs, so nothing above the
   tab bar can change length.
3. Konseling takes the prototype's description, as the reference for
   wording.
4. Decided while building: the title above the tab bar is the page's
   name in the menu, such as Asrama, Penilaian and Pengaturan, as
   Pengasuh, Pembinaan, Pengasuhan and Kegiatan karakter already show.
   The open tab's own name shows marked in the tab bar.
5. Decided while building: Dashboard keeps its order, the choice of
   dashboard first and then the chosen dashboard's title and
   description, as this spec calls it right. The choice takes the look
   of the tab bar and the shared space under it.
6. Decided while building: a role that sees only one tab has no tab
   bar, so its description stays under the title, as on a page without
   tabs.
7. Decided while building: the notes that move under the description
   are those that speak for the whole tab: who manages it or fills it
   in, and that the list holds only the account's own mentees. A note
   that sits inside a panel, in place of a form there, stays in its
   panel.
8. Decided while building: the note look takes the light grey
   background and the 8 px rounded corner the notes of the app already
   have. Two notes of one tab sit 8 px apart.
9. Decided while building: the space between the title and the tab bar
   is the shared space under a page heading, 24 px, as Kakak pendamping
   already had.
10. Decided while building: a student's room status is the first line
    of the tab's content, with the same words and in the same muted
    15 px text it had. On Perizinan asrama the description no longer
    starts with it.

## Steps

- [x] 1. One shared page head for pages with tabs: the title, the tab
  bar, then the chosen tab's description and its note, with the shared
  spaces; every page with tabs and the dashboard choice use it.
- [x] 2. A student's room status on Asrama moves into the tab's content.
- [x] 3. Konseling shows the prototype's description under its title.
