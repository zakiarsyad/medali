# Refused save, fix or cancel told on Penetapan angkatan baru

Depends on: New intake assignment
Group: Pengasuh

## What we want

On the tab "Penetapan angkatan baru", a person whose "Simpan draf",
"Tetapkan" or "Batalkan penetapan" is refused because someone else
acted first is told so on screen, as the spec of the tab asks: "the
second is told the draft changed and is shown the latest".

Today the server refuses the second action correctly and the data stays
right, but when the other person's "Tetapkan" or "Batalkan penetapan"
won, the screen only switches to the new state of the angkatan and shows
no message. For example, Pegawai UPK presses "Simpan draf" with a new
Nomor surat keputusan at the same moment as Kepala Unit presses
"Tetapkan": the angkatan is fixed, the Pegawai UPK's number is never
saved, and nothing on their screen says so. The message is kept inside
the "4. Penetapan" form, and that form is removed when the page shows
the fixed angkatan.

## Who it is for

- Kepala Unit and Pegawai UPK, who change the draft of an angkatan.

## What should happen

- When Kepala Unit presses "Tetapkan" while Pegawai UPK presses "Simpan
  draf" on the same angkatan, and "Tetapkan" wins, then the Pegawai UPK
  screen shows the fixed angkatan together with the message "Angkatan
  ini sudah ditetapkan, sehingga tidak bisa diubah lagi."
- When two Kepala Unit screens press "Tetapkan" on the same draft at
  once, then the angkatan is fixed once, and the second screen shows the
  fixed angkatan together with the same message.
- When two screens press "Batalkan penetapan" on the same angkatan at
  once, then it is cancelled once, and the second screen shows the
  angkatan as Dibatalkan together with the message "Angkatan ini belum
  ditetapkan, sehingga tidak ada yang dibatalkan."
- When "Simpan draf" wins over "Tetapkan", then the "Tetapkan" screen
  still shows "Draf sudah diubah orang lain. Draf terbaru sekarang
  ditampilkan, periksa lalu ulangi perubahan Anda.", as today.
- When nobody else acted, then saving, fixing and cancelling show the
  same messages as today.
- Confirmed by a check that a refused action whose refusal changes the
  page still leaves its message on screen.

## Not included

- Any change to what the server allows or refuses, or to the data
  saved: both are right today.
- Other tabs of Pengasuh.

## Decided

1. The message is the server's refusal sentence as it is today, shown
   above the angkatan in the place where the tab shows its other
   messages, so it stays visible after the page shows the latest state.
2. The message goes away when the person takes their next action on the
   tab or opens another angkatan.

## Decisions made while building

3. "Ajukan ke Kepala UPK" stands in the same form as "Simpan draf", so
   when it is refused because the angkatan was fixed meanwhile, it is
   told above the angkatan the same way.
4. A refusal that leaves the form or the button on the page, such as
   "Draf sudah diubah orang lain…", stays under its button, as today.

## Steps

- [ ] 1. A refused save, fix or cancel keeps its message on screen after
  the tab shows the latest state of the angkatan, with a check.
