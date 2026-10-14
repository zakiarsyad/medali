# A page past the end on Pengguna dan peran

Kind: fix, found by "App-wide audit: Students and mentoring"

Depends on: nothing beyond what is merged

## What we want

Every paged list answers a page number past its last page with its last
page, except the list of accounts on Pengaturan > Pengguna dan peran.
There the list comes back empty with "Tidak ada pengguna pada filter
ini.", although accounts exist. After this work it shows its last page,
like the other lists.

Seen in the audit, on a local computer with sample data, as Kepala
Unit, with page 99 asked for in the address of each list:

- Mahasiswa showed "176–193 dari 193 mahasiswa".
- Pengasuh > Kelompok pengasuhan showed "26–37 dari 37 kelompok".
- Pengasuhan > Catatan pendampingan showed "41–58 dari 58 catatan".
- Pengaturan > Pengguna dan peran showed no account and "Tidak ada
  pengguna pada filter ini.", with 24 accounts in the list.

The same empty answer is what Kepala Unit gets from a saved or shared
link to a page that no longer exists, for example after accounts were
removed.

## Who it is for

Kepala Unit.

## What should happen

- When Kepala Unit opens Pengguna dan peran with a page number past the
  last page, then the list shows its last page, with the count line of
  that page.
- When a search or a role filter is in the address as well, then the
  last page of that search or filter is shown.
- When the search or the filter matches no account at all, then the
  list says "Tidak ada pengguna pada filter ini.", as today.
- When the page number in the address is not a number, or is below 1,
  then the first page is shown, as today.
- When the list of students with a BAM role on the same tab is asked
  for a page past its end, then it shows its last page as well.
  Confirmed by a check.
- The rule that decides which page is shown is confirmed by a check.

## Not included

- The number of accounts on a page, which stays 25.
- The list of added students on Pengguna baru mahasiswa, which gets its
  pages in "Pages on the list of added students".
- Any change to the other lists.

## Decided

1. A page past the end shows the last page, not the first page and not
   an error, as Mahasiswa, Kelompok pengasuhan and Catatan pendampingan
   already do.

Decided while building, because the issue did not say:

2. The list of students with a BAM role already shows its last page for
   a page past its end, with a check for it, so it is not changed.
3. The page shown is the one the account list's links keep, such as
   "Ubah" and "Sebelumnya", so they lead to a page that exists rather
   than repeating the page number past the end.
4. The rule that picks the page is the one the other lists already
   share, so all lists answer a page past the end the same way.

## Steps

- [ ] 1. The account list shows its last page, with its count line, when
  a page past the end is asked for.
