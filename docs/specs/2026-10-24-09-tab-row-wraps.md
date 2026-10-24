# Tabs on more than one line, with no scroll

Depends on: nothing beyond what is merged
Group: Groundwork
Kind: fix

## What we want

On Asrama, Kepala Unit and Direktur / Wakil Direktur have more tabs than
fit on one line. The row of tabs then scrolls sideways and shows scroll
buttons. After this work, tabs that do not fit go onto the next line, so
every tab is in view with no scroll. The prototype scrolls this row; the
owner chose to change that.

## Who it is for

- Kepala Unit and Direktur / Wakil Direktur, on Asrama above all.
- Every role on a page whose tabs do not fit on one line.

## What should happen

- When Kepala Unit opens Dashboard asrama on a computer, then all their
  Asrama tabs show, on as many lines as needed, with no scroll bar and no
  scroll buttons.
- When Direktur / Wakil Direktur opens Dashboard asrama on a computer,
  then the same holds.
- When either of them opens Asrama on a phone, then all tabs show on
  several lines, with no sideways scroll.
- When a tab is open, then it is marked with the gold line under it, as
  today.
- When a role's tabs fit on one line, on any page, then the row looks as
  today.
- The tab names, their order, and which tabs each role may open stay as
  today.

## Not included

- Shorter tab names. "Klarifikasi kehadiran asrama" and "Pelanggaran
  asrama" stay as an earlier spec set them.
- A drop-down list in place of the tabs.

## Decisions

1. The rule is in the shared row of tabs, so it holds on every page with
   tabs. A page whose tabs already fit does not change.
2. On a phone, many tabs may take 4 or 5 lines. That is accepted: every
   tab stays in view.

## Steps

- [ ] 1. Tabs that do not fit on one line go onto the next line, with no
  sideways scroll.
