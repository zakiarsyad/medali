# Small health counts found by subtracting

Depends on: Dashboard physical health; Dashboard mental health; Dorm dashboard health
Group: Dashboard

## What we want

The health panels hide a count of 1 to 4 as "<5", but they show the
exact total beside it ("(n) dari (total) sudah dites", "(n) penghuni
sudah diasesmen") and the other counts exactly. When only one count in
a set is "<5", subtracting the others from the total gives its exact
value, so a small group can still be picked out. The same happens on
Dashboard asrama when one dorm row is held back: the bars minus the
other rows give that row's counts.

Found while building the health panels of Dashboard asrama, with sample
data: a bar total of 7 for Perlu tindak lanjut medis, one dorm at 5,
one at "<5" and two at 0 means that dorm has exactly 2.

## Who it is for

Everyone who sees the health counts: Kepala Unit, Direktur / Wakil
Direktur and Ketua Program Studi on Dashboard, and the roles that see
the two health panels on Dashboard asrama.

## What should happen

- When exactly one count in a set (the four fitness categories, the
  mental health levels, or one dorm row) shows "<5", then the smallest
  other count above 0 in that set is hidden too: "<5" if it is 1 to 4,
  otherwise "5+". No hidden count can then be worked out from the total
  and the other counts. Confirmed by a check.
- When exactly one dorm row on Dashboard asrama is held back because
  fewer than 5 of its residents are tested, then the smallest other row
  with tests is held back too. Confirmed by a check.
- When Prima or Baik is hidden, then the card's percent "prima dan
  baik" shows "-".
- The server sends no hidden number, also by a hand-made request.
  Confirmed by a check.
- When no count is "<5", then every panel shows as it does today.

## Not included

- Changing the limit of 5 or the line shown when the whole group is
  under 5.
- The other Dashboard sections.

## Decided

1. Hiding one more count is used instead of hiding or rounding the
   total, so the "(n) dari (total)" lines stay exact and readable.
2. A second hidden count of 5 or more shows as "5+", which stays true
   and shows the least.

## Decisions made while building

3. On Dashboard asrama each category column of the dorm table is a set
   too, with its bar as the total, because the example above is such a
   column. When the bar shows an exact number and exactly one dorm in
   that column is hidden, the smallest other dorm above 0 in it is
   hidden too. Rows and columns are checked again after each change,
   until no row and no column has exactly one hidden count.
4. When two counts tie for the smallest, the one listed first on screen
   is hidden: the category or level order, and the dorm order.
5. "With tests" for a dorm row means the same as the hold-back rule
   already uses: residents in reach with a fitness category, by test or
   by health note.
6. A count shown as "5+" draws no bar, like "<5".

## Steps

- [x] 1. A set of fitness categories or mental health levels with one
  "<5" hides one more count, and the card's percent shows "-" while
  Prima or Baik is hidden.
- [ ] 2. On Dashboard asrama a second dorm row is held back when one
  is, and each dorm row and column with one hidden count hides one
  more.
