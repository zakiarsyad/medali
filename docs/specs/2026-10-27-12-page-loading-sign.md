# A sign that a page is loading

Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

When you press a tab, a menu item or "Cari", nothing changes until the
new page has arrived. With the server held back for 4 seconds, the old
page stayed exactly as it was: the same title, the old tab still marked,
nothing dimmed, no words. On a slow connection the app looks frozen and
people press again. "A sign that a save is running" covered save
buttons; this covers moving to another page, tab, filter or search.

## Who it is for

Every role, on a phone and on a computer.

## What should happen

- When a tab or a side menu item is pressed, then it shows as chosen at
  once, before the new page arrives.
- When a new page, tab, filter, search or page of a list is loading,
  then the content area dims and cannot be pressed until the new content
  shows.
- When the new content shows, then the dimming goes away.
- When the new content arrives in under a fifth of a second, then
  nothing dims, so nothing flickers.
- While the content loads, the side menu and the top bar stay usable,
  and pressing another menu item goes there instead.
- When a link opens in a new tab, or goes to the page already open, then
  nothing dims.

## Not included

- Save buttons, which "A sign that a save is running" covered.
- A bar, a spinner or new words.
- Making pages load faster.

## Decided

1. The sign is the dimmed content area and the pressed tab or menu item
   marked as chosen, with no spinner, as the sign of a running save.
2. The dimming starts after a fifth of a second, so fast changes do not
   flicker.
3. It is set once, around the content area of every page, so every link,
   search and filter of the app gets it, and one added later does too.

## Steps

1. [x] Dim the content area while a pressed link loads its page.
2. [x] Mark the pressed tab or side menu item as chosen at once.
3. [ ] Dim the content area while a search or filter form loads.
4. [ ] Dim the content area while a filter or a day choice changes the
   page by itself.
