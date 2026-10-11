# Curriculum main indicators

## What we want

The Kurikulum menu gets its first content, built like the prototype: the
Indikator utama MEDALI, the Nilai dasar SIKU and the Skala predikat
MEDALI. Staff who manage the curriculum can change the indicators and the
base score. Everyone else with the menu only reads them.

## Who it is for

- Change: Kepala Unit and Pegawai UPK.
- Read only: Direktur / Wakil Direktur, Ketua Program Studi and Pengasuh.

## What should happen

- When any of the five roles opens Kurikulum, then they see the title
  "Kurikulum pembangunan karakter", the intro text from the prototype, and
  three panels: Indikator utama MEDALI, Nilai dasar SIKU and Skala
  predikat MEDALI.
- When they look at Indikator utama MEDALI, then they see six boxes
  (Mandiri, Empati, Disiplin, Adaptif, Loyal, Integritas), each with four
  indicators marked with a code (M1 to M4 and so on), the level and the
  tahap name. Before any change the texts are the prototype's, with the
  note "Isi awal, dapat disesuaikan."
- When Kepala Unit or Pegawai UPK presses "Ubah indikator utama", then the
  24 texts become fields, with "Simpan indikator utama" and "Batal".
- When they save with every field filled, then the new texts show, the
  message "Indikator utama disimpan." appears, and the note changes to
  "Diperbarui (date) oleh (name)."
- When they save with an empty field, then nothing is saved and the
  message says "Isi keempat level indikator (nilai)."
- When they press "Batal", then the old texts show again.
- When they look at Nilai dasar SIKU, then they see the number (65 at the
  start, with the note "Nilai awal 65."), and the line "SIKU akhir = nilai
  dasar + penambahan − pengurangan, dibatasi 0–100."
- When Kepala Unit or Pegawai UPK saves a whole number from 0 to 100 with
  "Simpan nilai dasar", then the number is kept, a message confirms it,
  and the note changes to "Diatur (date) oleh (name)."
- When the number is empty or outside 0 to 100, then nothing is saved and
  the message says "Nilai dasar harus 0–100."
- When a read-only role opens the page, then there is no "Ubah indikator
  utama" and no "Simpan nilai dasar", and the number field cannot be typed
  in.
- When they look at Skala predikat MEDALI, then they see the prototype's
  table of four predikat with score range and meaning.
- When a role without the right sends a change to the indicators or the
  base score, then the server refuses it. Confirmed by a check.
- When Kepala Unit opens Pengguna dan peran, then the right to change the
  curriculum shows for Kepala Unit and Pegawai UPK.

## Not included

- Tahapan, Penjabaran MEDALI per tahap, and the highlight of the current
  tahap's level in the indicator boxes (next spec).
- Program kegiatan PPKS, and Kegiatan khusus dan tambahan (later specs).
- Recalculating SIKU when the base score changes. It comes with Penilaian
  SIKU.

## Open questions

None.

## Steps

- [x] 1. The main indicators and the base score are stored, each with who
  changed it and when, and start with the prototype's content.
- [x] 2. The right to change the curriculum is added to the permission
  list for Kepala Unit and Pegawai UPK, with its checks.
- [x] 3. The page shows the title, the intro and the three panels.
- [x] 4. "Ubah indikator utama" changes and saves the 24 texts.
- [ ] 5. "Simpan nilai dasar" saves the base score.
