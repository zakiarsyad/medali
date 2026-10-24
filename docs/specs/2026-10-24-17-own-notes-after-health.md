# Profil saya: Catatan pengasuhan after the health panels

Depends on: none
Group: Profil saya
Kind: fix, found by "Audit: Profil saya and Tugas saya"

## What we want

On Profil saya, "Catatan pengasuhan" stands before "Kesehatan jasmani"
and "Kesehatan mental". Today the order is: Capaian karakter, Nilai
karakter, SIKU, Riwayat pelanggaran disiplin, Riwayat per semester,
Pembinaan, Catatan pengasuhan, Kesehatan jasmani, Kesehatan mental.

"My coaching, mentoring notes and sanction status" and "My health on my
profile" both place their panels as in the prototype. The prototype's
own profile goes Pembinaan, Kesehatan jasmani, Kesehatan mental, then
Catatan pengasuhan last.

Seen as every sample student, for example one with notes and a running
pembinaan, on a phone and on a computer.

## Who it is for

Mahasiswa, on their own Profil saya.

## What should happen

- When a student opens Profil saya, then after "Riwayat per semester"
  the panels come in this order: Pembinaan, Kesehatan jasmani,
  Kesehatan mental, Catatan pengasuhan.
- When a student has no running pembinaan, then Kesehatan jasmani
  follows Riwayat per semester, and Catatan pengasuhan is still last.
- The panels above "Riwayat per semester" keep their order.
- On a phone and on a computer the order is the same.

## Not included

- What any panel shows, or who sees it.
- The student detail that staff open on Mahasiswa.

## Decisions

1. The order follows the prototype's own profile, as both specs ask.

## Steps

- [ ] 1. Catatan pengasuhan moves after Kesehatan mental on Profil saya,
  with a check.
