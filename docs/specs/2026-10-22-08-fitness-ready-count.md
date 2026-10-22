# Fitness group form counts only scores that can be saved

Depends on: nothing beyond what is merged
Group: Penilaian
Kind: fix, found by "Audit: Penilaian"

## What we want

On "Penilaian jasmani", the group form of "Input hasil tes kebugaran"
says "(n) skor siap disimpan." while scores are typed. Today it counts
every field that is not empty, also a score the form itself marks as
wrong. The fitness test scores spec says typing a score shows its
category and "(n) skor siap disimpan.", and a score outside 0–100 saves
nothing. So the line promises scores that will not be saved. After this
work it counts only scores that can be saved.

Seen in "Audit: Penilaian", on a local computer with sample data, as
Kepala Unit, at computer width, group KP 24-D3PJK-01:

- Typed 72, 101 and 7.5: 101 and 7.5 show "Skor harus bilangan bulat
  0–100.", yet the line says "3 skor siap disimpan."
- Typed 72 and 101: the line says "2 skor siap disimpan."; "Simpan skor"
  then saves nothing, and the server says why.

## Who it is for

Kepala Unit and Penilai Mahasiswa, who enter fitness test scores.

## What should happen

- When scores are typed and every one is a whole number 0–100, then the
  line says "(n) skor siap disimpan." with n the number of filled
  fields, as today.
- When some typed scores are wrong, then n counts only the right ones:
  72, 101 and 7.5 give "1 skor siap disimpan.", and each wrong field
  keeps its "Skor harus bilangan bulat 0–100.".
- When every filled field is wrong, then the line says "Isi skor yang
  tersedia; kolom kosong dilewati." as with none filled.
- The count follows the same rule for a whole score as the field's own
  message. Confirmed by a check.
- On a phone the line reads the same.

## Not included

- What "Simpan skor" does with a wrong score: the server already
  refuses the whole save and says why.
- The file upload of fitness scores.
- Any other form's count line.

## Decisions

1. "Simpan skor" is not turned off while a wrong score is in the form.
   The fitness test scores spec only asks that such a save saves nothing
   and says why, which it does; this fix is only about the count.

## Steps

- [ ] 1. "(n) skor siap disimpan." counts only scores that can be saved,
  on a computer and on a phone.
