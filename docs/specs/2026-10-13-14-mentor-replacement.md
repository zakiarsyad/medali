# Mentor replacement

Depends on: Mentor evaluation
Group: Pengasuh

## What we want

The tab "Evaluasi dan penggantian" gets its second part, "Penggantian".
Kepala Unit replaces the mentor of one group with a spare mentor, with a
reason, a start date and a letter number. The whole group moves to the
new mentor on that date; the group is never split, and its history
keeps every mentor it had.

## Who it is for

- Replace and cancel: Kepala Unit.
- Read: Direktur / Wakil Direktur, Pegawai UPK, and Ketua Program Studi
  (their program's groups only).

## What should happen

- When Kepala Unit opens the tab, then the form has two parts, Evaluasi
  and Penggantian, next to "Alur penggantian" (four steps), and below
  them "Riwayat penggantian" and "Evaluasi terbaru".
- When they choose Penggantian and a group, then a box shows the current
  mentor, since when, the member count and "Evaluasi terakhir", then:
  Alasan penggantian (Hasil evaluasi kurang, Mutasi, Pensiun, Tugas
  belajar, Permintaan sendiri, Lainnya), Tanggal efektif (today),
  Pengasuh pengganti (Cadangan mentors, the same unit first and marked),
  Nomor surat keputusan atau nota dinas, Status pengasuh lama (Cadangan
  or Tidak aktif; Tidak aktif is set for Mutasi, Pensiun and Tugas
  belajar), Keterangan, and a tick box that names the students, both
  mentors and the date.
- When the reason is Hasil evaluasi kurang and the mentor's last result
  for this group is not Kurang, then a note says so with "Lakukan
  evaluasi dulu", and the button stays off.
- When there is no spare mentor, then the choice says "Tidak ada
  pengasuh cadangan" with a link to Pengguna dan peran.
- When they press "Tetapkan penggantian" without a mentor or the tick,
  then nothing is saved and the message says what is missing.
- When it is saved for today, then the message says "Pengasuh (code)
  kini (name)."; the group page, the student detail and both lists show
  the new mentor, and "Riwayat pengasuh kelompok" shows the old one with
  the end date and reason. The old mentor shows as Cadangan, or Tidak
  aktif with the reason.
- When it is saved for a later date, then it shows as Terjadwal, the
  group page says "Penggantian terjadwal: (name) mulai (date)", and the
  change happens by itself on that date.
- When they press "Batalkan" on a Terjadwal row and confirm, then it
  becomes Dibatalkan and nothing changes for the group.
- When a group already has a Terjadwal replacement, or the chosen mentor
  is already named in another one, then a new one is refused with a
  message.
- When anyone with the menu looks at "Riwayat penggantian", then each row
  shows date, group, old mentor and their new status, new mentor,
  reason, letter and status (Berlaku, Terjadwal, Dibatalkan); with none,
  "Belum ada penggantian pengasuh." Kelompok pengasuhan shows the number
  "Penggantian tahun ini" with the count of spare mentors.
- When Kepala Unit opens a group page, then "Ganti pengasuh" opens the
  form with that group chosen; saving a Kurang evaluation does the same.
- When the replacement takes effect, then the old mentor can no longer
  see or change the group's students and the new mentor can. Confirmed
  by a check.
- When any other role sends a replacement or a cancel, or the button is
  pressed twice, then the server refuses it or saves once. Every
  replacement and cancel keeps who did it and when. Confirmed by a check.
- When the tab opens on a phone, then the form stacks and the history
  becomes cards; on the preview it shows within about 1 second.

No case was met on `main` before this spec: the tab had the Evaluasi
part only. All of it is built here.

## Not included

- Splitting or merging groups, or moving one student.

## Better than the prototype

- Cancelling asks for confirmation.
- One spare mentor cannot be promised to two groups.
- No spare mentor leads to the place where accounts get the role.

## Decided

1. The start date is today or later, never in the past, so notes and
   scores already recorded keep their true writer.
2. The letter number is required, as for penetapan.
3. Only a Cadangan mentor can be chosen. A mentor who already holds a
   group cannot take a second one this way.

## Decisions made while building

4. A replacement is stored as one record: the group, the old and the new
   mentor, the start date, the reason, the letter number, the old
   mentor's new status, the note, who set it and when, and, when it was
   cancelled, who cancelled it and when. It is never erased.
5. A replacement for a later date changes nothing when it is saved. It
   is carried out the first time the app is used on or after its date,
   before anything is shown: the old mentor's line ends and the new
   mentor's line starts on the start date, whatever day the app was
   opened. No timed job is needed, so it works the same on the hosting
   and on the campus server.
6. The old mentor's status is read from the replacement and nothing is
   changed on their account: they keep the Pengasuh role. A mentor who
   holds no group and whose latest replacement in force set them Tidak
   aktif shows as Tidak aktif since the start date, with the reason of
   the replacement, and is not offered as a spare mentor anywhere.
7. Seeing "Riwayat penggantian" needs no new right: whoever may open
   the tab sees it. Ketua Program Studi sees the rows of their program's
   groups only. Setting and cancelling a replacement is one new right,
   held by Kepala Unit only.
8. "Penggantian tahun ini" counts the replacements that are not
   cancelled and whose start date is in this calendar year, as the
   prototype does. Ketua Program Studi sees the count of their program's
   groups.
9. A replacement is Terjadwal until it is carried out, and the record
   keeps when that happened. It is Berlaku from then on, and Dibatalkan
   once it is cancelled. One that is carried out can no longer be
   cancelled.
10. The database itself refuses a second waiting replacement for one
    group, a new mentor named in two waiting replacements, a new mentor
    who is the old one, an empty letter number, and the deleting of a
    replacement.
11. On the day of a replacement the old mentor's line ends and the new
    mentor's line starts, both on that same day, as the prototype does.
    The reason kept on the old mentor's line is the reason as the form
    words it, such as "Permintaan sendiri".
12. The sample replacement is in the group of D3 Pajak of angkatan
    2025, so the sample Ketua Program Studi sees it too. It started 30
    days before the day the sample data is loaded, or on 1 January when
    that would fall in the year before. Its reason is Permintaan
    sendiri, so the old mentor is Cadangan.
13. Every other sample Pengasuh with a group holds several, so none of
    them would be a spare mentor after being replaced. One more made-up
    Pengasuh was added to the sample accounts as the old mentor: they
    held this one group only and are a spare mentor since. The new
    mentor is the sample spare mentor of the same jurusan. Penetapan
    angkatan baru still has three mentors to choose from.
14. The sample group whose first mentor left in 2025 stays as it was,
    with its earlier mentor and no replacement record: that change is
    from before replacements were recorded.
15. The list of rights that Kepala Unit sees names the new right
    "Menetapkan dan membatalkan penggantian pengasuh", worded like the
    right for penetapan angkatan baru.
16. The address of the tab keeps which of the two forms is open and
    which group is chosen, so a link can open the Penggantian form with
    a group chosen. An address that names no form opens Evaluasi, as
    before.
17. A mentor who is named as the new mentor of a Terjadwal replacement
    is kept for that group. Until its date they still show as Cadangan,
    but they are offered neither in "Pengasuh pengganti" nor in the
    mentor choice of Penetapan angkatan baru: otherwise the replacement
    could not be carried out on its date.
18. A mentor a replacement set Tidak aktif shows so since the start
    date, with the replacement's reason, also when the account is
    removed later. Nothing in this spec makes such a mentor Cadangan
    again: that needs a new piece of work.
19. A spare mentor is "unit sama" when their account has the same unit
    as the current mentor's. A mentor without a unit matches nobody.
20. The form opens with the first reason, Hasil evaluasi kurang, as the
    prototype does. The note and the switched-off button show until a
    Kurang evaluation exists or another reason is chosen.
21. The box above the form and the sentence beside the tick box count
    the Aktif students of the group, as the Evaluasi part does.
22. The letter number takes 100 characters at most, as for penetapan.
    Keterangan takes 1,000 at most, as Catatan evaluasi.
23. With no spare mentor, the link to Pengguna dan peran reads "Beri
    peran Pengasuh kepada akun pegawai di Pengguna dan peran."
24. The form sends everything to the server, which says what is
    missing in the form's own message: first the spare mentor, then the
    tick. After a save the fields start again.
25. Setting a replacement and fixing a penetapan wait for each other,
    so one spare mentor cannot get a group from both at the same moment.
26. A Terjadwal replacement whose date has come is carried out before
    anything is shown or saved for someone who is signed in. Most of the
    time this is one small read that finds nothing. Two people opening
    the app at the same moment carry it out once.
27. From the start date on, the group is the new mentor's: the old
    mentor's line ends and the new one starts on that day, and the
    sample notes of that day are the new mentor's.
28. The start date cannot be before the day the current mentor took the
    group, which can lie ahead when a penetapan starts later.
29. What could stop a Terjadwal replacement on its date is refused where
    it would begin. The account of its new mentor cannot be removed and
    cannot lose the Pengasuh role until the replacement is cancelled,
    and the message says so. Cancelling a penetapan also cancels the
    Terjadwal replacements of its groups, as the work of the person who
    cancelled the penetapan, so their new mentors are free again.
30. Should a Terjadwal replacement still be impossible on its date (the
    group is ended, its mentor is another one by then, or the new mentor
    holds a group), nothing changes and it stays Terjadwal until Kepala
    Unit cancels it. The app never cancels one by itself, because every
    cancel keeps who did it.
31. When one spare mentor is chosen for two groups at the same moment,
    the first gets them and the second is told to choose another.
32. "Riwayat penggantian" shows the 20 replacements with the latest
    start date, as "Evaluasi terbaru" shows 20. Each role sees the rows
    of the same groups as in "Evaluasi terbaru". A replacement of a
    group whose penetapan was cancelled is not listed, as for
    evaluations.
33. The number under the group code counts the Aktif students the group
    holds today. The code opens the group page only for someone who may
    open that group.
34. A Dibatalkan row says who cancelled it and when, under its status.
35. "Batalkan" asks with the browser's own question box, as every other
    question in the app does: the app has no box of its own for this.
    After it, the message stays in the row.
36. A new mentor who is named in another Terjadwal replacement is
    refused with "Pengasuh pengganti ini sudah ditetapkan pada
    penggantian terjadwal kelompok lain. Pilih pengasuh cadangan lain,
    atau batalkan penggantian itu dulu di riwayat." A cancel that comes
    too late is told the replacement is already cancelled, or already
    in force.

## Steps

- [x] 1. Replacements are stored, with the old mentor's new status and
  reason, and one sample replacement.
- [x] 2. The permission to replace, with its checks.
- [x] 3. The Penggantian form with its rules and the tick box.
- [x] 4. A replacement takes effect today or on its date, in the group,
  its history and the mentor row rule.
- [x] 5. "Riwayat penggantian", cancelling, and the two refusals.
- [ ] 6. The note and button on the group page, the jump after Kurang,
  and "Penggantian tahun ini".
- [ ] 7. Read-only view, double press and the phone layout.
