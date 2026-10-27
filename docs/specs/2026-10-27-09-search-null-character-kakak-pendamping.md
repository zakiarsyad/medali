# A null character in the search of Kakak pendamping breaks the screen

Depends on: "Groundwork: A null character in the search of six more lists breaks the screen"
Group: Groundwork
Kind: fix, found while building "Groundwork: A null character in the search of six more lists breaks the screen"

## What we want

A search text that holds the null character (typed into the address as
`q=%00`, or pasted) makes the database refuse the query, so the whole
screen fails and shows "Halaman tidak dapat ditampilkan". The search of
Asrama › Kakak pendamping (the student search of the panel that names a
kakak pendamping) reads its search text with its own reader, which keeps
the null character. Seen as Pengelola Asrama on this computer with
sample data: `/asrama/kakak?q=%00` answers with a server fault, while
`/asrama/kakak?q=an` opens.

## Who it is for

Pengelola Asrama, and every role that may name a kakak pendamping.

## What should happen

- When the search text of Asrama › Kakak pendamping holds the null
  character, then the screen opens as for the same text without it,
  with no server fault.
- When the search text is only null characters and spaces, then the
  screen opens as with no search.
- When the search text is normal, then the search finds what it finds
  today.

## Not included

- Changing the longest search text allowed, or how a search matches.
- Null characters in saved texts, which the saves already refuse.
- The other lists, which already drop the null character.

## Decisions

1. The screen drops the null character where it reads its search text
   from the address, before it counts the length, with the shared piece
   that drops the null character for the other lists.
2. The checks open the student search of Asrama › Kakak pendamping with
   a search that holds the null character.

## Steps

- [x] 1. The search of Kakak pendamping drops the null character, with
  checks that open its student search with a search that holds it.
