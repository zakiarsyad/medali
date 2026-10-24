# Content centred with one widest size on wide screens

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

On a wide screen the content stops at 1360 px and sits against the side
menu, so an empty strip shows on the right: 312 px at 1920 px and
952 px at 2560 px. The top bar and its line run the full width, which
makes the strip stand out. The same happens on Ganti peran. Up to
1440 px the content fills the window, so the strip only shows on wider
screens.

## Who it is for

Every role, on every screen with the side menu, on a wide computer
screen.

## What should happen

- When the window is wider than the side menu plus 1440 px, then the
  content is 1440 px wide and centred in the space beside the side
  menu, with equal space on its left and right.
- When the window is narrower, then the content fills the space beside
  the side menu as today.
- When the content is centred, then the top bar's own content (page
  name, account) lines up with the content's edges, and the top bar's
  background and line still run the full width.
- When the window is 1024, 1280, 1440, 1920 or 2560 px wide, then no
  page scrolls sideways.
- The side menu stays on the left at every computer width.
- The sign-in page stays as it is.

## Not included

- The side menu's width or the phone menu.
- How each screen lays out its own content inside the width.

## Decisions

1. Widest content 1440 px, centred, side menu on the left, as decided
   in the audit.
2. The top bar's background runs the full width so the page has no
   bare edge; only its content lines up with the page content.
3. Already met on `main`: the widest content is 1440 px, set by the
   shared set of UI values. What was left is the centring and the top
   bar lining up with it.
4. Decided while building: the top bar holds the menu button and the
   unit's name. Its row of words takes the same widest size and the
   same room at its sides as the content, so its left edge lines up
   with the content's text at every width, also on a phone.

## Steps

- [x] 1. The content and the top bar's row are centred at the widest
  content size, with the top bar's background and line still running
  the full width.
