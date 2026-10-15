# Dorm violation appeals

Depends on: Dorm violations, File storage
Group: Asrama

## What we want

A resident who thinks an announced violation is wrong can appeal
(advokasi) within 3 hours of the announcement, with a reason and a file
as proof if they have one. BAM accepts or rejects it. An accepted appeal
means the violation does not count; a rejected one goes up to Pengelola
Asrama like any other.

## Who it is for

- Appeal: Mahasiswa who live in the dorm, for their own violations.
- Decide: BAM - BPHK and BAM - KI.
- Read the result: Pengelola Asrama, Kepala Unit and the other BAM roles
  that see Pelanggaran.

## What should happen

- When a resident opens "Rekam jejak pelanggaran saya", then each
  violation in Masa advokasi has the button "Ajukan advokasi", and the
  numbers "Dalam masa advokasi" and "Advokasi diterima" show above.
- When they press it, then they see "Alasan advokasi", "Bukti pendukung
  (opsional, PDF atau gambar maks. 5 MB)", "Kirim advokasi", "Batal" and
  the deadline "Batas pengajuan".
- When they press "Kirim advokasi" with a reason of 15 letters or more,
  then the violation shows Advokasi diproses and a message says BAM will
  check it.
- When the reason is too short, the file is too big or the wrong kind,
  the 3 hours have passed, or the violation already has an appeal, then
  nothing is saved and the message says why. The proof used is a
  made-up paper or a picture with no person in it. A preview whose
  file storage settings are still empty keeps no file ("File
  storage"), so the cases that send or open a proof file are confirmed
  on a local computer or by a check.
- When BAM - BPHK or BAM - KI opens the tab, then they see "Advokasi
  masuk" with the number waiting and one card per appeal: the student,
  the violation, the reason, the proof to open, "Catatan BAM", "Terima"
  and "Tolak". With none it says "Tidak ada advokasi yang menunggu."
- When they press "Terima", then the violation shows Advokasi diterima
  and no longer counts. When they press "Tolak" with a note, then it
  shows Naik ke Pengelola with "advokasi ditolak". "Tolak" without a
  note is refused. A BAM member's appeal on their own violation shows
  no buttons to them, and their hand-made decision on it is refused;
  the other deciders decide it. Confirmed by a check.
- When the resident opens their record again, then they see the result
  and the note from BAM.
- When another resident, Pengelola Asrama, Kepala Unit or a BAM role
  that may not decide asks for the appeal's reason or proof file, or
  sends a hand-made decision, then the server refuses it. They see only
  the result on the violation. A resident cannot appeal another's
  violation. Confirmed by a check.
- When "Kirim advokasi" is pressed twice, then one appeal is saved. When
  two BAM members decide the same appeal, then the second is refused
  with a message. Every decision adds a line to the change log.
  Confirmed by a check.
- When a resident appeals on a phone, then the form fits one column and
  the file can be taken with the camera.
- When BAM opens the tab on the preview, then "Advokasi masuk" shows
  within about 1 second, and it is paged.

## Not included

- Changing or withdrawing an appeal once sent.
- Reducing a violation after the appeal was rejected (Dorm violation
  reductions).
- The 3 hours and the 15 letters are the prototype's values, to be
  confirmed by the campus before launch.
- The line about waiting appeals on Tugas saya (My tasks: warning
  letters and violations to watch).

## Better than the prototype

- The server checks the 3 hours, the one appeal per violation, and the
  file's kind and size.
- Only the resident and the roles that decide can open the proof file.
- Two decisions on one appeal cannot both win.
- The number of waiting appeals is shown to the deciders even when the
  list is long, because it is paged.

## Decided

1. A BAM member may not decide an appeal on their own violation. They
   may decide one on a violation they recorded themselves.
2. There is no deadline for BAM: an appeal that is never decided stays
   Advokasi diproses and never counts. The number waiting on Tugas saya
   waits for the issue that adds that line.
3. Nobody besides the resident and the deciders reads the reason and the
   proof. Pengelola Asrama, Kepala Unit and the other BAM roles see only
   the result.

Decided while building, because the issue did not say:

4. Alasan advokasi holds 15 to 500 letters and Catatan BAM at most 500,
   not counting spaces around them.
5. Sample data: the first sample resident by name has an accepted
   appeal with a made-up paper as proof on their violation of three days
   ago, a rejected one six days ago, one still waiting nine days ago,
   and a violation of an hour ago still in Masa advokasi to appeal. The
   sixth resident's violation of an hour ago has a waiting appeal with
   the paper as proof. Each is sent an hour after its announcement, or
   half an hour ago for the last; BAM - KI accepts and BAM - BPHK
   rejects, an hour after it was sent.
6. The proof of a sample appeal is the same drawn paper the sample
   clarifications get, added to the file storage by the same sample
   files command.
7. Two new rights: appealing one's own violation ("Mengajukan advokasi
   atas pelanggaran asrama sendiri") for Mahasiswa, and deciding appeals
   with reading their reason and proof ("Menerima dan menolak advokasi
   pelanggaran asrama, dan membuka alasan serta buktinya") for BAM -
   BPHK and BAM - KI. Every other role gets neither.
8. Only a student who lives in a dorm today may appeal, as only they
   open the tab, and only from the announcement hour until 3 hours
   later by the server's clock. A violation not announced yet, or of
   another resident, answers "Pelanggaran ini tidak ditemukan. Muat
   ulang halaman." A second appeal of a violation is refused with
   "Pelanggaran ini sudah diajukan advokasi, dan advokasi tidak dapat
   diubah. Muat ulang halaman untuk melihat statusnya."
9. The proof takes what the file of a clarification takes: a PDF, JPEG
   or PNG picture of at most 5 MB, a picture made smaller in the browser
   first. Where the file storage is not set, an appeal with a proof is
   refused and nothing is kept; one without a proof is kept.
10. In "Rekam jejak pelanggaran saya" the column Advokasi shows the
    appeal as Diajukan, Diterima or Ditolak, the first 80 letters of its
    reason, "BAM: " with the note, and "Lihat bukti: " with the name of
    the proof, which downloads it; or "Ajukan advokasi" while the appeal
    time lasts; or "-".
11. Sending an appeal adds a line to the log of the violation, as each
    decision does, since it changes where a discipline record stands.
12. "Advokasi masuk" stands under "Jadwal publikasi" for BAM - BPHK and
    BAM - KI only, the soonest sent first, 20 a page. Each card shows the
    name, "NIM · diajukan" with the hour, "Pelanggaran" with the day,
    reason and punishment, the reason of the appeal, and "Lihat bukti:"
    with the name of the proof, which downloads it.
13. A decider's own appeal stays on their list, without "Catatan BAM",
    "Terima" and "Tolak", and says "Advokasi atas pelanggaran Anda
    sendiri diputuskan oleh anggota BAM yang lain."; a hand-made decision
    on it is answered the same.
14. Catatan BAM may be left empty on "Terima". A decision on an appeal
    decided already is refused with "Advokasi ini sudah diputuskan oleh
    anggota BAM yang lain. Muat ulang halaman."
15. A rejected appeal makes its violation Naik ke Pengelola at once,
    also within the 3 hours, with "advokasi ditolak" under it. An
    accepted one shows Advokasi diterima and never counts as Tercatat
    or under "Naik ke Pengelola Asrama".
16. "Dalam masa advokasi" counts the violations in Masa advokasi or
    Advokasi diproses now, of any day, on the staff screen and for a
    resident their own. Under it BAM - BPHK and BAM - KI read "(n)
    advokasi menunggu keputusan"; every other role reads "batas 3 jam
    setelah diumumkan", so the roles that only read learn no more than
    the results.
17. A resident's "Advokasi diterima" counts their own accepted appeals
    of the running semester, as "Pelanggaran tercatat" does.
18. In the rekap the column Masa advokasi becomes "Proses advokasi",
    Masa advokasi and Advokasi diproses together, and "Advokasi
    diterima" is added, as in the prototype. Every list shows only the
    status of an appeal, never its reason.
19. A resident who also holds a BAM role, or any other role that sees
    the staff screen, sees that screen as before with their own record
    below it, under the heading "Pelanggaran saya": their own numbers and
    "Rekam jejak pelanggaran saya" with "Ajukan advokasi". It shows only
    their own violations, and only while they live in a dorm.

## Steps

- [x] 1. The table for appeals is added, with sample appeals waiting,
  accepted and rejected.
- [x] 2. The rights to appeal and to decide are added to the permission
  list, with their checks.
- [x] 3. Residents send an appeal with an optional proof file and see
  its result.
- [x] 4. BAM sees "Advokasi masuk" and accepts or rejects.
- [x] 5. The violation's status and the numbers follow the appeal.
