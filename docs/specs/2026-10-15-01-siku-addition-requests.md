# SIKU addition requests

Depends on: SIKU adjustments, File storage
Group: Penilaian

## What we want

A student who did something that can add to SIKU reports it in Penilaian
SIKU with a date, a short report and photos as proof. Penilai Mahasiswa
checks the report and approves it with points, or rejects it with a note.
An approved request becomes a normal gain in the SIKU history.

## Who it is for

- Ask and withdraw: Mahasiswa, for themselves (right "Ajukan penambahan
  SIKU dengan foto bukti").
- Approve or reject: Kepala Unit and Penilai Mahasiswa (right "Persetujuan
  pengajuan penambahan SIKU").
- Read only: Direktur / Wakil Direktur, Ketua Program Studi (own program)
  and Pengasuh (own mentees).

## What should happen

- When a student opens Penilaian SIKU, then above "Transparansi nilai
  SIKU" they see "Ajukan penambahan SIKU" and "Pengajuan saya", and the
  number SIKU akhir says "(n) pengajuan menunggu" or "tidak ada pengajuan
  menunggu".
- When they fill Kriteria penambahan (the five gain reasons), Tanggal
  kegiatan, Keterangan (laporan kegiatan) and Foto bukti kegiatan (1 to 3
  images, 5 MB each, each shown small with × to take it out) and press
  "Kirim pengajuan", then it shows in "Pengajuan saya" as Diajukan with
  "Pengajuan terkirim. Penilai Mahasiswa akan memeriksanya."
- When something is missing or wrong, then nothing is sent and the message
  says "Pilih kriteria penambahan.", "Isi tanggal kegiatan.", "Tanggal
  kegiatan tidak boleh di masa depan.", "Keterangan minimal 20 karakter
  agar penilai memahami kegiatan Anda.", "Unggah minimal satu foto bukti
  kegiatan.", "Hanya berkas gambar yang diterima." or "Maksimal 3 foto."
  What they typed stays in the form.
- When they look at "Pengajuan saya", then each request shows its status
  (Diajukan, Disetujui with the points, Ditolak, Dibatalkan), reason,
  date, report, photos, time sent, the role that checked it (not the
  staff member's name) and when, and "Catatan penilai". With none:
  "Belum ada pengajuan."
- When they press "Tarik pengajuan" on a request still Diajukan and
  confirm, then it leaves the list with "Pengajuan ditarik."
- When a staff role opens Penilaian SIKU, then the first panel is
  "Pengajuan penambahan SIKU dari mahasiswa": a choice of Diajukan (at the
  start), Disetujui, Ditolak and Semua, each with its count, and a card
  per request with student, NIM, program studi, reason, dates, report and
  photos, 12 a page. With none: "Tidak ada pengajuan pada status ini."
- When anyone allowed presses a photo, then it opens large in the page.
- When the file storage settings are empty, as on a preview before the
  owner fills them in, then no photo can be kept: "Kirim pengajuan"
  saves nothing and says photos cannot be stored yet. The cases with
  photos are then confirmed on a local computer or by a check, with
  pictures that show no person.
- When Penilai Mahasiswa sets Poin (whole, 1–30, 2 at the start), may add
  "Catatan penilai" and presses "Setujui", then the card shows Disetujui
  with the points, the student's SIKU rises, the history gets an entry
  marked "Pengajuan mahasiswa", and the message says "Disetujui: +(n)
  SIKU untuk (name)." Points outside the range: "Poin harus 1–30."
- When they press "Tolak" without a note, then nothing changes: "Isi
  catatan alasan penolakan." With a note, the card shows Ditolak and the
  student sees the note. The message says "Pengajuan ditolak."
- When that history entry is later cancelled with "Batalkan", then the
  request shows Dibatalkan and the student sees "Penambahan poin dari
  pengajuan ini dibatalkan oleh penilai."
- When a read-only role opens the panel, then it has no Poin, "Setujui" or
  "Tolak", and says "Pengajuan diperiksa oleh Penilai Mahasiswa."
- When a student sends a request for another student, withdraws one that
  is decided, or opens another student's photos; or when Pengasuh, Direktur
  or a student sends a decision by hand, then the server refuses. Every
  approval goes into the log that cannot be edited. Confirmed by a check.
- When "Kirim pengajuan" or "Setujui" is pressed twice, then one request or
  one gain is saved. When the student withdraws while staff decide, or two
  staff decide the same request, then the second is refused with a
  message. Confirmed by a check.
- When a student uses a phone, then form and list are one column with no
  sideways scroll, and photos can come from the camera.
- When Penilaian SIKU opens with sample data on the preview, then it still
  shows within about 1 second; photos load small first.

## Not included

- Requests for a loss; a loss is only entered by staff.
- An objection to a gain or loss already recorded.
- A limit on how old the activity may be, and a limit on how many
  requests may wait: the prototype has neither.
- A clean-up of proof photos, which needs its own spec.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- A withdrawn request is marked, not erased; its photos stay stored and
  are shown to nobody.
- Only JPG and PNG are accepted; the prototype took any image kind.
- A withdrawal and a decision at the same moment cannot both win.
- The card warns staff when the student already has a gain with the same
  reason on the same date, so one deed is not counted twice.
- The cards are paged; the prototype stopped at 30.

## Decided

1. The activity may be of any age, as in the prototype; only a date in
   the future is refused.
2. A student may have any number of requests waiting, as in the
   prototype.
3. A rejected request may be sent again for the same deed, as a new
   request.

## Steps

- [x] 1. Requests are stored with their photos, status and decision. The
  rights to ask and to decide are added, with their checks. Sample data adds
  requests in every status, with drawn placeholder photos.
- [x] 2. The student sends a request from "Ajukan penambahan SIKU".
- [x] 3. "Pengajuan saya" shows the requests, with "Tarik pengajuan".
- [x] 4. Staff see the panel with the status choice and the cards.
- [ ] 5. "Setujui" adds the gain; "Tolak" needs a note.
- [ ] 6. Cancelling the gain shows the request as Dibatalkan.
