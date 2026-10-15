# Dorm cleaning assessment

Depends on: Cleaning duties
Group: Asrama

## What we want

After a room has done its cleaning duty, BAM judges it Memenuhi or Tidak
memenuhi, and Pengelola Asrama confirms the judgement. A confirmed result
gives the room +1 or −1, and a failed duty is put on the schedule again
for the next day. Staff see the ranking of rooms; residents see their
room's results and score.

## Who it is for

- Judge: BAM - BPHK and BAM - Kerumahtanggaan.
- Confirm or send back: Pengelola Asrama.
- Read only: Kepala Unit, Direktur / Wakil Direktur and Ketua Program
  Studi.
- Mahasiswa who live in the dorm, for their own room.

## What should happen

- When BAM opens "Jadwal pembersihan", then each duty that is Terjadwal
  has a Catatan field and the buttons Memenuhi and "Tidak memenuhi". A
  duty of a later date has no buttons yet.
- When they press Memenuhi, then the duty becomes "Dinilai BAM" with the
  result, who and when, and a message says it waits for Pengelola
  Asrama. "Tidak memenuhi" needs a note on what is not clean; without
  it nothing is saved and the message says "Tulis catatan bagian yang
  belum bersih."
- When Pengelola Asrama presses "Validasi" on a duty that is "Dinilai
  BAM", then it becomes Divalidasi and the room gets +1 for Memenuhi or
  −1 for Tidak memenuhi, said in the message.
- When they validate Tidak memenuhi, then the same place and room get a
  new duty the next day, marked "Pembersihan ulang". When that place
  already has a duty that day, then the repeat goes to the next free
  day, and the message names the date. Confirmed by a check.
- When they press "Tolak penilaian" and give a reason of 5 letters or
  more, then the duty goes back to Terjadwal, shows "Penilaian
  sebelumnya ditolak: (reason)" and BAM judges it again.
- When staff look at the tab, then they also see the numbers "Menunggu
  validasi" and "Pembersihan ulang", the note on the scoring, and "Skor
  kebersihan kamar" with No, Kamar, +, − and Skor, best first. A read-only
  role sees the same without buttons.
- When a duty has been judged, then "Batalkan tugas" no longer shows.
- When a resident opens Pembersihan asrama, then they also see "Skor
  kebersihan kamar" for their room, and Hasil with "Memenuhi (+1)" or
  "Tidak memenuhi (−1)" and the note. A result shows only after it is
  validated.
- When Pengelola Asrama sends a hand-made judgement, BAM a hand-made
  validation, or BAM - KI either, then the server refuses it. Confirmed
  by a check.
- When "Validasi" is pressed twice, or two people decide the same duty
  at once, then the room gets one point and one "Pembersihan ulang", and
  the second sees a message. Each judgement, sending back and validation
  is kept with who and when. Confirmed by a check.
- When a room is removed on Ploting kamar, then its validated results
  stay in the history but it leaves the ranking. Confirmed by a check.
- When BAM judges on a phone, then each duty is a card with the note
  and both buttons, with no sideways scroll.
- When staff open the tab on the preview, then it shows within about 1
  second, and the ranking is paged.

## Not included

- Room scores on Dashboard asrama.
- A failed duty turning into a violation ("Tidak melaksanakan jadwal
  piket kebersihan").
- A score per semester: the prototype counts for all time.
- The +1 and −1 are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- "Tolak penilaian" asks for the reason in the page and requires it,
  instead of a browser box that fills in a default.
- A double press cannot give two points or two repeat duties.
- A duty cannot be judged before its date.
- Empty states for a date without duties and a ranking without results.

## Decided

1. The room score is counted for all time, as in the prototype.
2. A "Pembersihan ulang" that fails again gives another −1 and another
   repeat, without end, as in the prototype.
3. The −1 does not follow residents who later move rooms: the score
   belongs to the room.
4. A "Pembersihan ulang" goes to the next free day when the next day
   already has a duty for that place. This rule lives here, and Tugas
   saya uses the same action.
5. A reason is required for "Tolak penilaian", at least 5 letters.

Decided while building, because the issue did not say:

6. Two new rights: judging cleaning ("Menilai pembersihan asrama") for
   BAM - BPHK and BAM - Kerumahtanggaan, and validating or sending back
   a judgement ("Memvalidasi penilaian pembersihan asrama") for
   Pengelola Asrama. BAM - KI, Pengasuh and the read-only roles get
   neither; the read-only roles see the results through the right they
   have to see cleaning.
7. A duty keeps where it stands (Terjadwal, Dinilai BAM, Divalidasi),
   its result and note with who judged it and when, the last sending
   back with its reason, who and when, and who validated it and when.
   Each judgement, sending back and validation also adds a line to a
   log of who, when, what and the note; the database refuses to change
   or delete a line of it, and a duty with a line in it cannot be
   deleted.
8. The points are not kept apart: a room's + is the number of its
   validated Memenuhi duties, its − the number of its validated Tidak
   memenuhi duties, and its Skor is + minus −.
9. A duty may be judged on its date or later, never before. A duty of a
   past date that was never judged may still be judged.
10. Catatan holds at most 200 letters. It may be left empty for
    Memenuhi. A reason for "Tolak penilaian" holds 5 to 200 letters,
    and is asked for in the row, with "Kirim penolakan" and "Batal".
11. Sending back clears the result from the duty, which is Terjadwal
    again; the result sent back stays in the log. "Penilaian sebelumnya
    ditolak: (reason)" shows while the duty waits to be judged again.
12. The repeat goes to the day after the day of the validation, as a
    duty is never put in the past; when the place, or the room's own
    room for an own-room duty, already has a duty that day, it goes to
    the first later day that is free. No repeat is made when the place
    or the room has been removed since; the message then says so. One
    duty has at most one repeat, kept by the database.
13. "Batalkan tugas" shows and is allowed only for a duty that was
    never judged, also after a judgement was sent back, so that no
    judgement in the log loses its duty.
14. A room removed on Ploting kamar takes with it only its duties from
    today on that were never judged. Its judged duties stay with the
    room's number, and as a removed room has no row on Ploting kamar it
    leaves the ranking.
15. "Menunggu validasi" counts the duties that are Dinilai BAM, and
    "Pembersihan ulang" the repeats still to be judged, of every date,
    in the dorms the switch shows.
16. "Skor kebersihan kamar" lists the rooms on Ploting kamar now with
    at least one validated result, of the dorms the switch shows, as
    "Kamar (number) · (dorm)", by Skor high to low, then by more +,
    then by room number; 20 rooms a page, with the page kept in the
    address. Without results it says "Belum ada penilaian yang
    divalidasi."
17. Staff see on each duty the result, the note, and the name of the
    account that judged it and of the one that validated it, with the
    date and time. A resident sees no names.
18. A resident sees Skor kebersihan kamar of their room now, with
    "+(n) / −(m)" under it; the Status of each duty (Terjadwal, Dinilai
    BAM or Divalidasi), "Pembersihan ulang" on a repeat, and Hasil only
    once validated, "-" before. "Tugas terjadwal" now counts only the
    duties still Terjadwal.
19. The messages are "Dinilai memenuhi. Menunggu validasi Pengelola
    Asrama.", "Dinilai tidak memenuhi. Menunggu validasi Pengelola
    Asrama.", "Tulis catatan bagian yang belum bersih.", "Divalidasi:
    +1 poin untuk kamar.", "Divalidasi: −1 poin. Pembersihan ulang
    dijadwalkan (date).", "Divalidasi: −1 poin. Pembersihan ulang tidak
    dijadwalkan karena tempat atau kamar sudah dihapus.", "Penilaian
    dikembalikan ke BAM.", "Tulis alasan penolakan minimal 5 huruf.",
    "Tugas ini belum dapat dinilai sebelum tanggalnya.", "Tugas ini
    sudah dinilai oleh petugas lain. Muat ulang halaman.", "Penilaian
    ini sudah diputuskan oleh petugas lain. Muat ulang halaman.",
    "Tugas ini belum dinilai BAM. Muat ulang halaman." and "Tugas yang
    sudah dinilai tidak dapat dibatalkan.".
20. Sample data: in Dana Rakca and Cipta Bakti, the duties of the three
    days before today were judged by the sample BAM -
    Kerumahtanggaan and validated by the sample Pengelola Asrama on
    their day, every fifth Tidak memenuhi with a note and its
    "Pembersihan ulang" on the next free day; one duty of yesterday is
    Dinilai BAM and waits; today and later are Terjadwal.
21. On a phone each duty is a card, as the schedule already is, with
    Catatan and both buttons folding under each other.

## Steps

- [x] 1. Duties keep their judgement, sending back and validation, with
  sample results for the past week.
- [x] 2. The rights to judge and to validate cleaning are added to the
  permission list, with their checks.
- [x] 3. BAM judges a duty Memenuhi or Tidak memenuhi.
- [x] 4. Pengelola Asrama validates or sends back, and a failed duty is
  scheduled again.
- [ ] 5. Staff see the two numbers and "Skor kebersihan kamar".
- [ ] 6. Residents see their room's results and score.
