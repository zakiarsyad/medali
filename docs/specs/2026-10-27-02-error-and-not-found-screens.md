# Error and not-found screens in the app's look

Depends on: none
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

When something goes wrong on the server, the app shows the framework's
own screen in English: "This page couldn't load. Reload to try again,
or go back." The menu disappears and nothing looks like the app. Seen
on Pengaturan › Pengguna dan peran when the "Tambah pengguna" save did
not reach the server; any server fault on any screen would show the
same.

The "page not found" screen also has two looks: an unknown address
with one or two parts, such as a wrong tab, shows it inside the menu,
while a longer one shows a card with no menu.

A wrong record in the address is handled three ways: on Mahasiswa and
Dashboard it opens a "Mahasiswa tidak ditemukan" window, on Penilaian
› Karakter and Pembinaan › Karakter it is ignored, and on Pengasuh ›
Kelompok it shows "page not found" for the whole page.

## Who it is for

Every role.

## What should happen

- When a screen cannot load because of a fault, then the screen shows
  inside the menu, in the app's look and in Bahasa Indonesia, saying
  that the page could not be shown, with a button "Coba lagi" and a
  link back to the home page.
- When the whole app cannot load, then the same message shows on its
  own page in the app's look.
- When a save cannot reach the server, then the form stays on screen
  with its typed values and a message under the button, as other
  refused saves do.
- When a signed-in person opens any unknown address, however long,
  then "Halaman tidak ditemukan" shows inside the menu.
- When a signed-out person opens an unknown address, then the card
  without the menu shows, as today.
- When the address names a student, group or record that does not
  exist, then the page opens and says "… tidak ditemukan" in the same
  way on Mahasiswa, Dashboard, Penilaian › Karakter, Pembinaan ›
  Karakter and Pengasuh › Kelompok.

## Not included

- What causes a fault, or reporting faults to anyone.
- The "Akses ditolak" screen, which already shows in the app's look.

## Decisions

1. The words: "Halaman tidak dapat ditampilkan. Coba lagi, atau kembali
   ke halaman utama." with "Coba lagi" and "Kembali ke halaman utama".
2. A wrong record shows the "tidak ditemukan" window, as on Mahasiswa,
   because it keeps the page usable.
3. The server's own fault detail is never shown on screen.

Decided while building:

4. The heading is "Halaman tidak dapat ditampilkan" and the line below
   it "Coba lagi, atau kembali ke halaman utama.", with the two buttons
   under it. "Coba lagi" loads the screen again; "Kembali ke halaman
   utama" opens the first address, which leads each account to its own
   first page.
5. When the menu itself cannot load, the whole app counts as not able to
   load, and the message shows on its own page, in a box like the
   sign-in page.

## Steps

- [x] 1. A screen that cannot load, and the whole app when it cannot
  load, show the message of decision 1 in the app's look, with checks.
- [ ] 2. A save that cannot reach the server keeps the form and its
  typed values and shows a message under the button, with checks.
- [ ] 3. Any unknown address shows "Halaman tidak ditemukan" inside
  the menu for a signed-in person, and the card without the menu for
  a signed-out person, with checks.
- [ ] 4. A wrong student, group or record in the address opens the page
  with the "… tidak ditemukan" window on Mahasiswa, Dashboard,
  Penilaian › Karakter, Pembinaan › Karakter and Pengasuh › Kelompok,
  with checks.
