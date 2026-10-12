# Asking before a PPKS activity is removed

Kind: fix, found by "Audit: UI of the merged screens"

## What we want

Every removal in the app asks first, except one. In Kurikulum, pressing
"Hapus" in the form of a Program kegiatan PPKS activity removes it at
once. After this work it asks first, like removing an account or a
student does.

What happens today, as Kepala Unit and Pegawai UPK, on a phone and on a
computer: "Ubah" on an activity, then "Hapus": the activity leaves the
list straight away with "Kegiatan dihapus dari daftar." No question is
asked.

## Who it is for

Kepala Unit and Pegawai UPK.

## What should happen

- When they press "Hapus" in the form of an activity, then a question
  shows first: 'Hapus kegiatan "(name)" dari daftar?'
- When they agree, then the activity leaves the list with the message
  "Kegiatan dihapus dari daftar.", as today.
- When they do not agree, then nothing is removed and the form stays open
  as it was.

## Not included

- "Hapus" on a row of "Kegiatan acuan" inside the Penjabaran form: it
  only takes a row out of a form that is not saved yet.
- Any change to who may remove an activity.

## Decided

1. The question is asked the same way as for removing an account and a
   student, with the browser's own question box.

Decided while building, because the issue did not say:

2. The name in the question is the name the activity is saved under, as
   the list shows it. A name typed into the form and not saved yet is
   not used, because the saved activity is what would be removed.

## Steps

- [ ] 1. "Hapus" in the form of a PPKS activity asks first and removes
  only after a yes.
