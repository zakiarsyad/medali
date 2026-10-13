# Special and additional activities

Depends on: nothing beyond what is merged
Group: Kurikulum

## What we want

The Kurikulum menu gets its last panel, "Kegiatan khusus dan tambahan",
built like the prototype: a list of activities outside PPKS, not tied to
a semester, which can later be scheduled in Kegiatan karakter for chosen
students, classes or cohorts. Staff who manage activities can add,
change and remove them, with the same form as PPKS activities. Everyone
else with the menu only reads them.

## Who it is for

- Add, change, remove: Kepala Unit and Pegawai UPK.
- Read only: Direktur / Wakil Direktur, Ketua Program Studi and
  Pengasuh.

## What should happen

- When any of the five roles opens Kurikulum, then below Penjabaran
  MEDALI they see "Kegiatan khusus dan tambahan" with the prototype's
  line about activities outside PPKS. It does not change with the chosen
  semester or tahap.
- When there are activities, then they see the same table as Program
  kegiatan PPKS: Kegiatan (name, description, "tidak wajib" when not
  required), Nilai, Indikator utama and Target peserta. An empty target
  shows "-".
- When there is none, then they see "Belum ada kegiatan khusus atau
  tambahan."
- When Kepala Unit or Pegawai UPK presses "Tambah kegiatan khusus", then
  the form opens titled "Kegiatan khusus atau tambahan", with the same
  fields, rules and messages as the PPKS form. The indicators show no
  "(level semester ini)", because no semester applies, and Target
  peserta starts empty.
- When they save a valid activity, then it appears in this panel only,
  never in a semester's PPKS table, with 'Kegiatan "(name)" disimpan.'
- When they press "Ubah" on a row, then the form opens filled in, titled
  "Ubah kegiatan"; "Simpan" keeps the changes and "Batal" closes it with
  nothing changed.
- When they press "Hapus" in that form, then they are asked to confirm,
  and on yes the activity leaves the list with "Kegiatan dihapus dari
  daftar." and a link "Urungkan" that brings it back.
- When they press "Hapus" in the form of a PPKS activity, then the
  same confirm, message and "Urungkan" apply, as both share one form.
- When one form is open, then the other "Tambah …" button on the page is
  hidden, so only one form is open at a time.
- When a read-only role opens the page, then there is no "Tambah
  kegiatan khusus" and no "Ubah".
- When the sample data command runs, then the panel holds the
  prototype's two made-up examples.
- When Pengasuh or Direktur sends a hand-made add, change or removal,
  then the server refuses it. Confirmed by a check.
- When "Simpan" is pressed twice quickly, then the activity is saved
  once.
- When two staff change the same activity at once, then the second save
  is refused with "Kegiatan ini baru saja diubah orang lain. Muat ulang
  untuk melihat versi terbaru." and nothing is overwritten.
- When an activity is removed, then it is only marked removed, with who
  and when, so a later schedule that refers to it still shows its name.
  Confirmed by a check.
- When the page is opened on a phone, then the table shows each activity
  as a readable block with no sideways scroll, and the form fields
  stack.
- When the page opens on the preview with sample data, then it shows
  within about 1 second. The list is short by nature; it shows all rows.

## Not included

- The "Dijadwalkan" column, and the warning that a removed activity is
  already scheduled (Scheduled count on Kurikulum).
- Choosing who takes part. That is done when scheduling (Extra activity
  schedule).

## Better than the prototype

- Removal asks to confirm and can be undone right away; the prototype
  removes at once.
- An empty target shows "-" as in the PPKS table; the prototype shows 0.
- Two people saving the same activity cannot overwrite each other.

## Decided

1. "Hapus" in the form of a PPKS activity gets the same confirm, message
   and "Urungkan", in the same PR, as both share one form.

## Decisions made while building

The issue did not say, so these were decided:

2. Nothing of the issue was built before. Only the question before a
   PPKS activity is removed was there already, from "Asking before a
   PPKS activity is removed".
3. Special and additional activities are kept in the same table as PPKS
   activities, with no semester. A later schedule then refers to one
   kind of activity, whichever panel it is from.
4. The list is in order of name, as the PPKS table is.
5. Pressing "Ubah" in one panel while a form is open in the other closes
   that other form, as pressing "Ubah" on another row of the same panel
   already does. What was typed there and not saved is dropped.
6. "Urungkan" shows beside "Kegiatan dihapus dari daftar." until the
   next message of that panel or until the page is loaded again. It
   brings the activity back as it was and shows "Kegiatan dikembalikan
   ke daftar." Only the person who removed the activity can bring it
   back this way, and the server checks that.
7. The check on two staff changing the same activity also holds for PPKS
   activities, as both share one form. An activity someone else removed
   in the meantime still answers "Kegiatan tidak ditemukan."
8. "Simpan" of a change pressed twice quickly keeps the change once; the
   form closes on the first answer.
9. The sample data's two examples are the prototype's: "Pelatihan
   kepemimpinan organisasi mahasiswa" and "Program mentor sebaya".

## Steps

- [x] 1. Activities can be stored without a semester, as special or
  additional, with who changed them and when; sample data adds two.
- [x] 2. The page shows the "Kegiatan khusus dan tambahan" panel and its
  table.
- [ ] 3. "Tambah kegiatan khusus" adds an activity, reusing the PPKS
  form.
- [ ] 4. "Ubah" changes an activity.
- [ ] 5. "Hapus" removes it after a confirm, with "Urungkan".

