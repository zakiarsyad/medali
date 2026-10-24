# One shared set of UI values

Depends on: nothing beyond what is merged
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

The app has one set of named values for colour, text size, spacing,
corners and shadows, and the screens use only those names. But the set
does not name the values of the parts that repeat on every screen, so
each screen picks its own: form fields come in 12 sizes, buttons in two
heights, cards in four paddings, notes in two, section headings in four
styles and the "nothing here yet" text in five. The set also holds
names that mean the same thing: two text sizes 0.5 px apart (12.5 and
13 px), and pairs of colour names with the same colour. The content's
widest size is 1360 px, while the app should use 1440 px.

After this work the shared set names one value for each repeating part,
holds no two names for the same value, and the later fixes for each
part use these names.

## Who it is for

Everyone who uses the app. Nothing changes on screen yet, apart from
text at 12.5 px becoming 13 px, menu and tab text at 14.5 px becoming 15 px,
and the content growing to 1440 px on a very wide screen.

## What should happen

- When a builder styles a repeating part, then the shared set has one
  named value for it:
  - form field: text 15 px at normal weight, height 40 px;
  - main and second button: text 15 px semibold, height 40 px, the same
    inner space;
  - status badge: one text, background and border colour for each of
    "good", "warning", "bad" and "plain";
  - card: inner space 12 px top and bottom and 16 px at the sides,
    corner 14 px, no shadow, 8 px between its lines;
  - note: inner space 8 px and 12 px, text 13 px in the muted colour,
    thin border;
  - section heading: 15 px, extra bold, navy;
  - "nothing here yet" for a whole list: 15 px muted, centred, 24 px
    inner space; for one section of a panel: 13 px muted, left, no
    inner space;
  - space under the tab bar and under the page description: one value
    each;
  - smallest tap size on a phone: 44 by 44 px;
  - content's widest size: 1440 px.
  Confirmed by a check.
- When the shared set is read, then no two colour names hold the same
  colour and no two text sizes are less than 1 px apart. Confirmed by a
  check.
- When a badge colour is set, then its text reaches a contrast of at
  least 4.5 to 1 on its background. Confirmed by a check.
- When a screen used a name that was merged, then it now uses the kept
  name and looks as before; text that was 12.5 px is 13 px.

## Not included

- Changing the screens to use the new part values. Each part has its
  own fix issue that depends on this one.
- Dark mode, new colours or a new font.

## Decisions

1. The kept value of each part is the one most screens already use, so
   the later fixes change the fewest screens. Where the issue gives no
   number, such as the badge colours, the button's inner space and the
   space under the tab bar and the page description, the value most
   screens use today is taken.
2. The two close text sizes become one, 13 px, because 0.5 px cannot be
   told apart on screen.
3. Of each pair of colour names with the same colour, the name that
   says what it is for is kept. Where both say it, the one more screens
   use is kept: gold over emas, ok over vD, bad over bina.
4. The widest size is 1440 px, as decided in the audit.
5. Decided while building: two colour names count as the same only when
   they hold the same colour in light and in dark mode. Navy and the
   side menu's colour, and white surfaces and the side menu's strongest
   text, are the same in light mode only; merging them would change dark
   mode, which this work leaves alone, so they stay apart. Three pairs
   are merged, not five.
6. Decided while building: the text size of the menu, the tabs and two
   parts of Kurikulum, 14.5 px, is also less than 1 px from 15 px, so by
   the same reason as decision 2 it becomes 15 px, the size more screens
   use.

## Steps

- [x] 1. Merge the names that hold the same value: the close text sizes
  and the colour pairs, with a check that no two remain.
- [ ] 2. Name one value for each repeating part, with the content's
  widest size at 1440 px, a check for each value and a check of the badge
  contrast.
