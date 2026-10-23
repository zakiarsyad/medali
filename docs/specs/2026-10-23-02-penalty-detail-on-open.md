Depends on: nothing beyond what is merged
Group: Pembinaan
Kind: fix, found by "Audit: Pembinaan"

## What we want

"Audit: Pembinaan" asks that "Rincian" on "Pelanggaran disiplin" loads
only when one penalty is opened. Today the tab sends the whole "Rincian"
of every penalty on the page with the page itself: Uraian, the kerja
sosial form and place, Nomor keputusan, who recorded it, the conditions
and Keputusan, and for Pembina Disiplin Mahasiswa the "Konseling wajib"
box of every row. With a full page of 25 penalties, all 25 travel on
every load, though most are never opened. After this work the list sends
only what its rows show, and "Rincian" asks the server for one penalty
when it is opened.

Seen in "Audit: Pembinaan", on a local computer with sample data, as
every role that can open the tab, at phone and computer width: before any
"Rincian" was pressed, the page already held every row's Uraian and
Nomor keputusan, and opening the first "Rincian" sent no request. The
page weighed about 67 KB for 6 penalties.

## Who it is for

Pembina Disiplin Mahasiswa and Kepala Unit, who record and follow up
penalties; Direktur / Wakil Direktur, Ketua Program Studi and Pengasuh,
who read them.

## What should happen

- When "Pelanggaran disiplin" opens, then the page holds for each row
  only what the row shows: the student, Tanggal, Hukuman, Kerja sosial
  dates and Status. No Uraian, Nomor keputusan, conditions, Keputusan or
  "Konseling wajib" box is in the page or its data. Confirmed by a check.
- When someone presses "Rincian" on a row, then the app asks the server
  for that one penalty and shows everything "Rincian" shows today, with
  the same words, for the same roles. While it loads, "Rincian" shows
  "Memuat rincian…".
- When the server cannot answer, then "Rincian" shows "Rincian tidak
  dapat dimuat. Coba lagi." with a "Coba lagi" button, and the list
  stays as it is.
- When "Rincian" is closed and opened again, then it is asked for again,
  so it shows what was changed meanwhile.
- When a role asks by hand for the "Rincian" of a penalty outside its
  rows (Pengasuh for a student who is not their mentee, Ketua Program
  Studi for another program), or a role without the tab asks at all,
  then the server refuses it with the same answer as for a made-up
  penalty. Confirmed by a check.
- Status changes, the conditions, Keputusan and "Tugaskan konseling
  wajib" work from the loaded "Rincian" as today, and the row's Status
  follows them.
- Each opening of "Rincian" answers within about 1 second on the preview
  of `main`.

## Not included

- "Catatan pelanggaran" and "Pembinaan karakter": their rows have no
  "Rincian".
- "Riwayat pelanggaran disiplin" in the student detail.
- Any change to what "Rincian" shows or who may see it.
- Logging who opened a "Rincian": no spec asks for it.

## Decided

1. What does "Rincian" show while it loads? "Memuat rincian…" in its
   place, like "Memuat catatan kesehatan…" elsewhere in the app.
2. Is a loaded "Rincian" kept when it is closed and opened again? No, it
   is asked for again, so it never shows an old status after another
   staff member changed it.
3. A refused or unknown penalty shows the same "Rincian tidak dapat
   dimuat. Coba lagi." as a server that cannot answer, so the screen
   tells nobody whether the penalty exists. Decided by the builder.
4. When the page is read again while "Rincian" is open, such as after
   "Tugaskan konseling wajib", "Rincian" is asked for again, and the
   loaded one stays on screen until the new one comes. Decided by the
   builder.
5. An answer that comes after "Rincian" was closed, or after a later ask,
   is dropped. Decided by the builder.
6. A role without the tab is refused before anything is read, for a
   real penalty and a made-up one alike, so it too gets the same answer
   as for a made-up penalty. On screen every refusal shows "Rincian
   tidak dapat dimuat. Coba lagi." Decided by the builder.

## Steps

- [x] 1. The list of "Pelanggaran disiplin" sends only what its rows
  show, and "Rincian" loads one penalty from the server when opened, with
  the same access rules as the list.
