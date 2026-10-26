# One look and wording for "nothing here yet"

Depends on: Groundwork: One shared set of UI values
Group: Groundwork
Kind: fix, found by "Audit: UI consistency on every screen"

## What we want

The text that says a list or a section is empty has five looks and
several wordings:

- Most lists use one look: 15 px muted, centred. But "Tidak ada." on
  Asrama › Dashboard and "Belum ada pelanggaran di daftar." on Asrama ›
  Pelanggaran are left-aligned with no space around them.
- On Profil saya and on Penilaian › SIKU for a student, six empty
  sections use four looks at 12.5 and 13 px. On SIKU "Belum ada
  pengajuan." is the big centred look, while "Belum ada penambahan."
  and "Belum ada pengurangan." beside it are small and left-aligned.
- Empty table cells ("Belum ada responden" on Pengasuh › Survei,
  "Belum ada catatan" on Jasmani, "Belum ada data" on SKPM, "Belum ada
  kamar bertugas" on Asrama › Bersih) show in full dark text instead of
  muted.
- Wording differs for a list with no match: most say "Tidak ada <hal>
  pada filter ini.", but the Penilaian lists say "Tidak ada data pada
  filter ini.", Pembinaan › Pelanggaran disiplin says "Belum ada
  pelanggaran pada filter ini.", Mahasiswa says "Tidak ada mahasiswa
  yang cocok. Ubah kata kunci atau filter." and Ploting kamar says
  "Tidak ada penghuni belum diplot yang cocok. Ubah kata kunci."
- Wrong text: on Asrama › Pelanggaran, a search that matches nobody
  makes the summary list say "Tidak ada pelanggaran pada semester
  ini.", while the number cards above show 58 violations this semester.

## Who it is for

Every role, on lists and panels that can be empty.

## What should happen

- When a whole list is empty, then its text has the shared look for an
  empty list: centred, muted, with space around it.
- When one section of a panel or profile is empty, then its text has
  the shared look for an empty section: small, muted, left-aligned.
  The SIKU sections beside each other use the same one.
- When a table cell has no value, then its text is muted.
- When filters or a search match nothing, then the text is "Tidak ada
  <hal> pada filter ini.", naming the thing listed, such as
  "Tidak ada mahasiswa pada filter ini."
- When nothing exists yet and no filter is set, then the text starts
  with "Belum ada".
- When a search matches nobody on Asrama › Pelanggaran, then the
  summary list says "Tidak ada pelanggaran pada filter ini."

## Not included

- The small "no match" hint inside a name picker while typing.
- Changing what a list shows.

## Decisions

1. "Tidak ada … pada filter ini." for no match and "Belum ada …" for
   nothing yet, because most lists already say so.
2. Two looks: one for a whole empty list, one for an empty section, as
   in the shared set of values.

## Steps

- [ ] 1. Every whole empty list and every empty section takes its
  shared look, with a check.
- [ ] 2. Every empty table cell is muted, with a check.
- [ ] 3. Every "no match" text says "Tidak ada <hal> pada filter ini."
  and every "nothing yet" text starts with "Belum ada", the summary
  list on Asrama › Pelanggaran included, with checks.
