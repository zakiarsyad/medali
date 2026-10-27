# A sign that a page is loading

Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

When you press a tab, a menu item or "Cari", nothing changes until the
new page has arrived. With the server held back for 4 seconds, the old
page stayed exactly as it was: the same title, the old tab still
marked, nothing dimmed, no words. After "Cari" the address changes
straight away but the old list stays. On a slow connection the app
looks frozen and people press again.

"A sign that a save is running" already covers save buttons. This
covers moving to another page, tab or filter.

## Who it is for

Every role, on a phone and on a computer.

## What should happen

- When a tab or a menu item is pressed, then it shows as chosen at
  once, before the new page arrives.
- When a new page, tab, filter or search is loading, then the content
  area dims and cannot be pressed until the new content shows.
- When the new content shows, then the dimming goes away.
- When the content arrives in under a fifth of a second, then nothing
  flickers.
- The side menu and top bar stay usable while the content loads.

## Not included

- Save buttons, which "A sign that a save is running" covered.
- A bar or a spinner.
- Making pages load faster.

## Decided

1. Dimming of the content area and marking the pressed tab or menu
   item, with no spinner, as the sign of a running save does.
2. The dimming starts after a fifth of a second so fast changes do not
   flicker.

Decided while building, because the issue did not say:

3. The content dims as pale as a switched-off button, so both signs
   look alike.
4. Every move to another page of the app gives the sign, whatever
   started it: a link, a tab, the menu, a filter, a search, a row of a
   list, closing a box, or the browser's own step back and forward.
5. A page that opens elsewhere, such as in a new tab, gives no sign.

## Steps

- [ ] 1. The pressed tab or menu item shows as chosen at once, and the
  content area dims after a fifth of a second until the new page shows.
