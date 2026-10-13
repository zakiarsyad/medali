# Words of "Mahasiswa tidak ditemukan" outside the Mahasiswa list

Depends on: Student list and detail, Mentor groups, Mentoring notes

## What we want

The box "Mahasiswa tidak ditemukan" tells the reader to go "kembali ke
daftar mahasiswa", also when the student's detail was opened from a
group page, a mentor page or the list of mentoring notes. There its
button "Tutup" goes back to that page, not to the Mahasiswa list, and
Pengasuh has no Mahasiswa list at all. The words should name the place
the button really returns to.

## Who it is for

Every role that opens a student's detail: Kepala Unit, Direktur / Wakil
Direktur, Ketua Program Studi, Pegawai UPK and Pengasuh.

## What should happen

- When the detail of a student who does not exist, or whom the account
  may not open, is asked for from the Mahasiswa list, then the box says
  as today to go back to the Mahasiswa list.
- When it is asked for from a group page, a mentor page or the tab
  "Catatan pendampingan", then the box names that page instead:
  "kembali ke halaman kelompok", "kembali ke halaman pengasuh" and
  "kembali ke daftar catatan", and "Tutup" returns there as it does
  today.
- When Pengasuh gets the box, then its words never mention the
  Mahasiswa list.
- The box still says the same for a student who does not exist and for
  one the account may not open, so it tells nothing about who exists.

The first and the last case were met on `main` before this spec, and
stay as they were. The second and the third are built here.

## Not included

- Any change to who may open a student's detail.
- Any change to where "Tutup" leads.

## Decided

1. The words for each place are the three examples of the issue, in
   the same sentence the box has today: "halaman kelompok", "halaman
   pengasuh" and "daftar catatan".
2. Decided while building, since the issue did not say: the tab "Nilai
   pengasuhan" also opens a student's detail, and Pengasuh reaches it.
   There the box says "kembali ke daftar nilai", in the way the tab
   "Catatan pendampingan" is called "daftar catatan". Without this the
   box would still name the Mahasiswa list to Pengasuh.

## Steps

- [ ] 1. The box takes the name of the place it returns to from the
  page that shows it, with a check for each of the four pages.
