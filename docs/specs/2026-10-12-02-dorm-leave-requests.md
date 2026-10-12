# Dorm leave requests

## What we want

Students can ask for dorm leave on the Perizinan asrama tab of Asrama, and
Pengelola Asrama can approve or refuse each request. The screens, wording
and rules follow the prototype. This is the first of three parts; reporting
back to the dorm and the link to dorm activities come later.

## Who it is for

- Mahasiswa: submits, sees and cancels their own requests.
- Pengelola Asrama: sees all requests, approves or refuses.
- Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi (own
  programme only), BAM - BPHK: see requests, change nothing.

## What should happen

1. When a Mahasiswa opens Perizinan asrama, then they see "Ajukan izin"
   with three kinds (Izin pesiar, Izin Tidak Mengikuti Kegiatan (ITMK),
   Izin khusus), the "Ketentuan" panel, and "Riwayat izin saya".
2. When a Mahasiswa picks Izin khusus, then "Jenis keperluan" appears. When
   they pick ITMK, then the time labels become "Dari" and "Sampai", and
   "Tujuan" and "Kontak yang bisa dihubungi" are hidden.
3. When a Mahasiswa fills both times, then they see the length in hours,
   and whether it passes a night.
4. When the return time is not after the leave time, the leave time is
   already past, an Izin pesiar is 12 hours or more or passes a night, or
   the times overlap another of their requests that is Diajukan or
   Disetujui, then they see the prototype's warning and the request is not
   saved.
5. When "Keperluan" has fewer than 5 characters, then the request is not
   saved and they are told to explain it.
6. When a Mahasiswa presses "Ajukan izin" with valid input, then the
   request appears at the top of "Riwayat izin saya" with status Diajukan.
7. When a Mahasiswa presses "Batalkan" on a request that is Diajukan, then
   its status becomes Dibatalkan. Other statuses have no "Batalkan".
8. When Pengelola Asrama opens Perizinan asrama, then they see the counts
   "Menunggu verifikasi" and "Izin 30 hari terakhir", and a list of
   requests, opened on those waiting, earliest leave time first.
9. When they search by name or NIM, or filter by status (Menunggu
   verifikasi, Disetujui, Ditolak, Semua) or by kind, then the list shows
   only matching requests, or "Tidak ada pengajuan pada filter ini."
10. When Pengelola Asrama presses "Setujui" or "Tolak", with an optional
    note, then the status becomes Disetujui or Ditolak, and the Mahasiswa
    sees the status, the note and who decided.
11. When a view-only role opens the tab, then they see the same list
    without "Setujui" and "Tolak". Ketua Program Studi sees only their own
    programme's students.
12. When anyone but the owning Mahasiswa tries to cancel, or anyone but
    Pengelola Asrama tries to decide, then the server refuses (confirmed by
    a check).

## Not included

- "Lapor kembali" with a photo, BAM verification, "Catat sudah kembali",
  "Sedang di luar", "Terlambat kembali", and the status Selesai.
- ITMK marking dorm activities as attended, and any wording about it.
- Limiting requests to dorm residents, and showing the room. For now every
  Mahasiswa may submit.
- Leave figures on Dashboard asrama.

## Open questions

None.

## Steps

1. [ ] Add storage for leave requests, sample requests in each status, and
   the two permissions: submit a leave request, decide a leave request.
2. [ ] Add "Ajukan izin" with the three kinds, the time rules and the
   "Ketentuan" panel.
3. [ ] Add "Riwayat izin saya" with "Batalkan".
4. [ ] Add the staff list with the two counts, search and filters.
5. [ ] Add "Setujui" and "Tolak" with a note.
