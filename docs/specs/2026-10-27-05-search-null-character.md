# A search with a null character breaks the list screen

Depends on: none
Group: Groundwork
Kind: fix, found while building "Groundwork: Error and not-found screens in the app's look"

## What we want

A search text that holds the null character (typed into the address as
`cari=%00`, or pasted) makes the database refuse the query, so the whole
screen fails and shows "Halaman tidak dapat ditampilkan". Seen on
Pembinaan › Karakter and Penilaian › Karakter: `?cari=%00` answers with
a server fault. The search text of every list is read by one shared
reader, which keeps the null character, so other lists that search by
text can fail the same way.

## Who it is for

Every role that uses a list with a search box.

## What should happen

- When a search text holds the null character, then the list opens as
  for the same text without it, with no server fault.
- When a search text is only null characters and spaces, then the list
  opens as with no search.
- When a search text is normal, then the list finds what it finds today.

## Not included

- Changing the longest search text allowed, or how a search matches.
- Null characters in saved texts, which the saves already refuse.

## Decisions

1. The null character is dropped from the search text where the shared
   reader of search texts reads it, so every list gets the fix at once.
2. The check that proves it opens Pembinaan › Karakter and Penilaian ›
   Karakter with a search that holds the null character.

Decided while building:

3. The null characters are dropped before the length of the text is
   counted, so a text that is as long as the search field takes once
   they are gone is searched for, as the same text without them is.

## Steps

- [x] 1. The shared reader of search texts drops the null character,
  with checks on Pembinaan › Karakter and Penilaian › Karakter.
