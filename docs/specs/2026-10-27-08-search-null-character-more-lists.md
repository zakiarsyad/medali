# A null character in the search of six more lists breaks the screen

Depends on: none
Group: Groundwork
Kind: fix, found while building "Groundwork: A search with a null character breaks the list screen"

## What we want

A search text that holds the null character (typed into the address as
`q=%00`, or pasted) makes the database refuse the query, so the whole
screen fails and shows "Halaman tidak dapat ditampilkan". The fix for
the lists that search with `cari` went into the shared reader of search
texts, but six lists read their search text with their own reader and
still fail. Seen as Kepala Unit Pembangunan Karakter on this computer
with sample data, each answering with a server fault:

- Mahasiswa: `/mahasiswa?q=%00`
- Pengasuh › Daftar pengasuh: `/pengasuh/daftar?q=%00`
- Pengasuh › Kelompok: `/pengasuh/kelompok?q=%00`
- Pengaturan › Pengguna dan peran: `/pengaturan/pengguna?q=%00`
- Pengaturan › Mahasiswa: `/pengaturan/mahasiswa?q=%00`
- Asrama › Kamar: `/asrama/kamar?q=%00`

## Who it is for

Every role that opens one of these lists.

## What should happen

- When the search text of one of these lists holds the null character,
  then the list opens as for the same text without it, with no server
  fault.
- When the search text is only null characters and spaces, then the
  list opens as with no search.
- When the search text is normal, then the list finds what it finds
  today.

## Not included

- Changing the longest search text allowed on each list, or how a
  search matches.
- Null characters in saved texts, which the saves already refuse.
- The lists that already read their search with the shared reader.

## Decisions

1. Each of these lists drops the null character where it reads its
   search text from the address, before it counts the length, as the
   shared reader of search texts does.
2. The checks open each of the six lists with a search that holds the
   null character.

Decided while building:

3. The dropping of the null character is one shared piece, used by the
   shared reader of search texts and by the six lists, so the reason for
   it is kept in one place.
4. On Asrama › Kamar the search of the form "Tambah penghuni" is read by
   the same reader as the list "Belum diplot", so it drops the null
   character too.

## Steps

- [ ] 1. The six lists drop the null character from their search text,
  with checks that open each of them with a search that holds it.
