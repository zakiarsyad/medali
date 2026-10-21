# One decimal on Kehadiran and SKPM in Daftar nilai karakter

Depends on: nothing beyond what is merged
Group: Penilaian
Kind: fix, found by "App-wide audit: Activities and scores"

## What we want

"Daftar nilai karakter" writes Kehadiran and SKPM as whole numbers when
they have no decimals ("80", "0") and with one decimal otherwise
("66,7"), so one column mixes two forms. The same numbers are written
with one decimal on the screens they come from: "Nilai kehadiran
kegiatan" on the student's Kegiatan karakter, and "Nilai SKPM" on Data
SKPM. The attendance spec says Nilai kehadiran is shown with one
decimal, the SKPM spec says a Nilai SKPM is shown to one decimal
wherever anyone looks at it, and the audit asks that a score and a
percentage are written the same way everywhere. After this work both
parts are written with one decimal in the list too.

Seen in "App-wide audit: Activities and scores", on a local computer with
sample data, as Kepala Unit and as each student:

- Adit Nugraha: Kegiatan karakter shows "80,0%" with "6/8 kegiatan
  karakter · 2/2 pertemuan pengasuhan"; Daftar nilai karakter shows
  Kehadiran "80" with "8/10".
- Anisa Kartika: Kehadiran "66,7" in the same column as "80", "75",
  "100" and "0" of other students.
- Ayu Lestiani: Data SKPM shows Nilai SKPM "80,0"; Daftar nilai
  karakter shows SKPM "80". Students with no SKPM rows show "0" there.
- Nilai akhir in the same list is always written with one decimal
  ("46,7", "77,0").

## Who it is for

Kepala Unit, Direktur / Wakil Direktur, Penilai Mahasiswa, Ketua Program
Studi and Pengasuh, who read Penilaian karakter.

## What should happen

- When a student's Kehadiran is shown in the list, then it has one
  decimal: "80,0", "66,7", "100,0", "0,0", with attended/counted under
  it as today.
- When a student's SKPM is shown in the list, then it has one decimal,
  the same as Nilai SKPM on Data SKPM: "80,0", and "0,0" for a student
  with no rows once an upload counts.
- The same number is shown for the student on Kegiatan karakter, on
  Data SKPM and in the list. Confirmed by a check.
- Pengasuhan and SIKU, which are whole numbers, stay as today ("72",
  "65").
- A missing part still shows "-", and the phone cards show the same
  forms as the table.

## Not included

- How the list is read and paged: it has its own issue, "Penilaian:
  Daftar nilai karakter worked out for every student on each load".
- The "%" on Kegiatan karakter and every other screen.
- The grade rule itself.

## Decisions

1. No "%" on Kehadiran in the list. All four parts in the list are
   scores out of 100 summed by the weights, and the column heading names
   the part; only the decimal follows the source screen.
2. Whole numbers without decimals, as the prototype's list writes them,
   are not kept. The attendance and SKPM specs and the audit ask for one
   form everywhere; the prototype also writes these two numbers with one
   decimal on their own screens.
3. The list already works out both numbers by the same rules as the
   screens they come from, so only how they are written changes. The
   check reads one student's Kegiatan karakter, Data SKPM and the list
   from the same records, and holds the written numbers equal.
4. A student with no SKPM rows still shows "-" on Data SKPM and "0,0" in
   the list once an upload counts, as the grade already counts them; only
   the form of the number follows Data SKPM.

## Steps

- [x] 1. Kehadiran and SKPM are written with one decimal in "Daftar
  nilai karakter", on a computer and on a phone.
