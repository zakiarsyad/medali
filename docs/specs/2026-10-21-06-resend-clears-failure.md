# Old failure message gone when a photo is sent again

Depends on: nothing beyond what is merged
Group: Kegiatan
Kind: fix, found by "Audit: Kegiatan"

## What we want

When sending an attendance photo fails, the student's card says "Foto
tidak terkirim. Periksa koneksi internet, lalu tekan Kirim presensi lagi."
When the student presses "Kirim presensi" again, that message stays on
screen for the whole new send, beside the button that says "Mengirim…".
The screen says "not sent" and "sending" at once. After this work the old
failure goes away when a new send starts.

Seen in "Audit: Kegiatan", on a local computer with sample data, as a
student on a phone (390 wide): the connection was dropped during a send,
then "Kirim presensi" was pressed again on a slow connection. For about 4
seconds the button said "Mengirim…" and the red message still said "Foto
tidak terkirim…". It went away only when the success message came.

## Who it is for

Mahasiswa, sending a photo from a phone.

## What should happen

- When the student presses "Kirim presensi" after a failed send, then the
  failure message goes away at once and the button says "Mengirim…".
- When that send fails too, then the failure message shows again.
- When it succeeds, then the card shows "Menunggu verifikasi" and the
  success message, as today.
- When the student chooses another photo after a failed send, then the
  failure message goes away too.
- A message about the chosen file, such as "Berkas harus berupa gambar."
  or "Ukuran foto maksimal 8 MB.", still goes away when another photo is
  chosen, as today.

## Not included

- Progress in percent while sending.
- The clarification form.

## Decisions

1. Clear the message on the new send, or on choosing a new photo? Both.
   Each is a moment the old message stops being true, and a message about
   the chosen file already goes away when another photo is chosen.
2. "Ulangi" alone does not clear the message: it only takes the photo
   away, and the message goes once another photo is chosen or sent.
3. Only the message of the same card is cleared. A message under another
   card is left as it is.

## Steps

- [ ] 1. A new send, or another chosen photo, clears the old failure
  message.
