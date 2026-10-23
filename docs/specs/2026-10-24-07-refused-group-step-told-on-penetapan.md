# Refused change of steps 2 and 3 told on Penetapan angkatan baru

Depends on: New intake assignment; Refused save, fix or cancel told on
Penetapan angkatan baru
Group: Pengasuh

## What we want

On the tab "Penetapan angkatan baru", the controls of "2. Bentuk
kelompok" ("Bentuk kelompok" / "Bentuk ulang") and of "3. Pengasuh
setiap kelompok" (the pengasuh choice of a group, "Isi otomatis yang
kosong" and "Pindahkan ke…") keep their message under the control. When
someone else fixed the angkatan meanwhile, the server refuses the change
correctly and the page shows the fixed angkatan, but steps 2 and 3 are
no longer on the page, so the refusal "Angkatan ini sudah ditetapkan,
sehingga tidak bisa diubah lagi." goes with them and nothing says the
change was not saved.

Found while building "Refused save, fix or cancel told on Penetapan
angkatan baru", which fixed the same fault for "Simpan draf",
"Tetapkan" and "Batalkan penetapan" only.

## Who it is for

- Kepala Unit and Pegawai UPK, who change the draft of an angkatan.

## What should happen

- When Kepala Unit presses "Tetapkan" while Pegawai UPK picks a
  pengasuh for a group, moves a member with "Pindahkan ke…", presses
  "Isi otomatis yang kosong", or presses "Bentuk ulang", and
  "Tetapkan" wins, then the Pegawai UPK screen shows the fixed angkatan
  together with the message "Angkatan ini sudah ditetapkan, sehingga
  tidak bisa diubah lagi.", above the angkatan where "Simpan draf" now
  tells it.
- When a change of step 2 or 3 is refused for any other reason, such as
  "Draf sudah diubah orang lain…", then its message stays under its
  control, as today.
- When nobody else acted, then each control shows the same messages as
  today.
- Confirmed by a check that these refusals are told above the angkatan.

## Not included

- Any change to what the server allows or refuses, or to the data
  saved: both are right today.
- Other tabs of Pengasuh.

## Decided

1. The message is the server's refusal sentence as it is today, shown
   in the same place above the angkatan as for "Simpan draf", and it
   goes away at the next action on the tab or when another angkatan is
   opened.

## Steps

- [x] 1. A change of step 2 or 3 refused because the angkatan was fixed
  meanwhile is told above the angkatan, with a check.
