# Stage breakdown

## What we want

The Kurikulum menu gets the panel "Penjabaran MEDALI tahap (name)", built
like the prototype: for the chosen tahap, six boxes that say what each
nilai means at that tahap. The Indikator utama MEDALI boxes also mark the
level of the chosen tahap. Staff who manage the curriculum can change each
box. Everyone else with the menu only reads them.

## Who it is for

- Change: Kepala Unit and Pegawai UPK.
- Read only: Direktur / Wakil Direktur, Ketua Program Studi and Pengasuh.

## What should happen

- When any of the five roles opens Kurikulum, then in each Indikator utama
  MEDALI box the level 1 line is marked, because Tahap 1 is chosen at the
  start.
- When they choose another tahap, then the mark moves to that tahap's
  level in all six boxes.
- When they look below Program kegiatan PPKS, then they see "Penjabaran
  MEDALI tahap (name)" with six boxes (Mandiri to Integritas). Each box
  shows the text, the list "Kegiatan acuan", and "Indikator tahap" with
  code and text.
- When nothing was changed yet, then the content is the prototype's and
  the note says "Isi awal. Indikator tahap dipilih dari indikator utama."
- When they choose another tahap, then the title and the six boxes change
  to that tahap.
- When the text of a main indicator is changed in Indikator utama, then
  the same code under "Indikator tahap" shows the new text.
- When Kepala Unit or Pegawai UPK presses "Ubah" on a box, then that box
  becomes a form with:
  - "Penjabaran tugas",
  - "Kegiatan acuan" with "Hapus" per row and "Tambah kegiatan",
  - "Indikator tahap (dari indikator utama (nilai))": the four indicators
    to tick, with "(level tahap ini)" on the one for this tahap,
  - "Simpan" and "Batal".
- When they press "Simpan" with at least one indicator ticked, then the
  box shows the new content, the message says "Penjabaran (nilai)
  disimpan.", and the note changes to "Diperbarui (date) oleh (name)." for
  that tahap. Empty Kegiatan acuan rows are dropped.
- When no indicator is ticked, then nothing is saved and the message says
  "Pilih minimal satu indikator tahap."
- When they press "Batal" or choose another tahap, then the form closes
  with nothing changed.
- When a read-only role opens the page, then there is no "Ubah" on the
  boxes.
- When a role without the right sends a change, then the server refuses
  it. Confirmed by a check.

## Not included

- "Rerata tahap" and the score beside each nilai. Both wait for student
  scores to exist in the app.
- Kegiatan khusus dan tambahan (later spec).

## Open questions

None.

## Steps

- [x] 1. The breakdown is stored per tahap and nilai, with who changed it
  and when, and starts with the prototype's content.
- [x] 2. Indikator utama MEDALI marks the level of the chosen tahap.
- [x] 3. The page shows the "Penjabaran MEDALI tahap (name)" panel with
  its six boxes.
- [ ] 4. "Ubah" changes and saves one box.
