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
3. Decided while building: an empty section is a part inside a panel,
   a profile, a card or a detail that has nothing in it, such as
   "Belum ada catatan." under Catatan pengasuhan, "Belum ada penghuni."
   in a room box or "Belum ada pengajuan." on SIKU. Everything else
   that stands in place of a list takes the list look, including the
   parts of Asrama › Dashboard, as the spec names "Tidak ada." there.
4. Decided while building: an empty section has no space above or
   below it, as its words sit right under the heading of its part.
5. Decided while building: these keep their own look, as they are not
   an empty list or section: a note or a warning, the hint inside a
   name picker, a line inside a number card on Dashboard, the parts a
   grade still waits for, a choice in a drop-down, the sign-in page,
   and the line that a page cannot be used until an academic period
   runs.
6. Decided while building: on Asrama › Dashboard the line that says how
   many residents are out keeps its old look; only "Tidak ada." in its
   place takes the list look.
7. Decided while building: "Belum ada catatan" on Jasmani and on the
   list of sick students was a gold warning badge, as in the prototype.
   It becomes muted words like every other cell with no value, as the
   spec names it.
8. Decided while building: "Tidak ada" under "Jadwal aktif" of a
   referral on Konseling, "Belum ada asesmen" in the list of shared
   data and the Predikat of a group without one on Pengasuh › Survei
   are cells with no value too and are muted the same way. A dash
   for a missing number is not changed.
9. Decided while building: the Penilaian lists of Asesmen karakter,
   Nilai karakter, Jasmani, SIKU and SKPM list students, so they say
   "Tidak ada mahasiswa pada filter ini."; Kegiatan › Verifikasi lists
   photos and says "Tidak ada foto pada filter ini." The same wording
   now holds for Mahasiswa baru, the Dashboard filter, the screening
   list on Konseling, the participants of a count on Asrama ›
   Kegiatan, and the searches of "Tambah penghuni" and "Tetapkan
   kakak pendamping".
10. Decided while building: "Belum ada" is for things that come over
    time and have not come yet: "Belum ada rujukan dari asrama.",
    "Belum ada pelanggaran tercatat semester ini." and a student's own
    "Belum ada pelanggaran pada periode ini." Words that say nothing is
    waiting now, nothing happens on a day, or nobody needs attention,
    such as "Tidak ada yang menunggu." or "Tidak ada kegiatan hari
    ini.", keep "Tidak ada", as they are not "not yet".
11. Decided while building: a status tab that names what it waits for,
    such as "Tidak ada klarifikasi yang menunggu verifikasi BAM.",
    keeps its words, as they say more than "pada filter ini".
12. Decided while building: a list is "with no filter set" while its
    search is empty and every choice is the one it starts with. Then
    it says "Belum ada …": "Belum ada pelanggaran disiplin.", "Belum
    ada catatan pelanggaran pada semester ini." (or "Belum ada catatan
    pelanggaran." with past notes shown), "Belum ada mahasiswa yang
    sakit.", "Belum ada kelompok pada periode ini.", "Belum ada
    peserta.", "Belum ada mahasiswa aktif non asrama." and "Belum ada
    mahasiswa yang dapat ditetapkan." Choosing a semester or a period
    is not a filter.
13. Decided while building: the list on Asrama › Izin starts at
    "Menunggu", so there it says "Tidak ada pengajuan yang menunggu.",
    like the other status tabs. With "Semua" status and nothing else
    chosen it says "Belum ada pengajuan izin."

## Steps

- [x] 1. Every whole empty list and every empty section takes its
  shared look, with a check.
- [x] 2. Every empty table cell is muted, with a check.
- [x] 3. Every "no match" text says "Tidak ada <hal> pada filter ini."
  and every "nothing yet" text starts with "Belum ada", the summary
  list on Asrama › Pelanggaran included, with checks.
