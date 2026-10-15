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

## Steps

- [ ] 1. The table for appeals is added, with sample appeals waiting,
  accepted and rejected.
- [ ] 2. The rights to appeal and to decide are added to the permission
  list, with their checks.
- [ ] 3. Residents send an appeal with an optional proof file and see
  its result.
- [ ] 4. BAM sees "Advokasi masuk" and accepts or rejects.
- [ ] 5. The violation's status and the numbers follow the appeal.
