# Dorm violations

Depends on: Dorm residents and rooms, Academic period
Group: Asrama

## What we want

The tab Pelanggaran gets its content. BAM records the day's violations
of dorm rules, each with a reason and a punishment, and sets the hour
they are announced. Once announced, residents see them, and after 3
hours a violation counts and goes up to Pengelola Asrama. Staff see the
count per student for the semester.

## Who it is for

- Record, schedule and cancel before the announcement: BAM - BPHK, KI,
  Kerohanian, Konsumsi, Senipora and Kesehatan.
- Read only: Pengelola Asrama and Kepala Unit.
- Mahasiswa who live in the dorm: their own record and the announcement.

## What should happen

- When BAM opens Pelanggaran, then they see "Input dan publikasi
  pelanggaran" with Tanggal pelanggaran, "Diumumkan pada" (date and
  hour, 21:00 to start with), Mahasiswa, Alasan pelanggaran (pick from
  the list or type) and Jenis hukuman: Penindakan langsung, Teguran, TKS
  or Hukuman lainnya, which asks what it is.
- When they press "Tambahkan ke daftar", then the row joins the list
  below and can be taken out with "Hapus". No student, a reason under 3
  letters, or an empty Hukuman lainnya is refused with a message. A BAM
  member cannot pick themselves; a hand-made entry for themselves is
  refused. Confirmed by a check.
- When they press "Simpan dan jadwalkan publikasi", then the rows show
  under "Jadwal publikasi" with the announcement hour, and a note says
  until when an appeal is possible. A violation date in the future, or
  an announcement before the violation date, is refused.
- When BAM presses "Batalkan" on a waiting row and confirms, then it is
  never announced. After the announcement hour the button is gone.
- When the hour comes, then the violations show under "Pengumuman
  pelanggaran" for that day with Masa advokasi and the hour it ends, and
  3 hours later with Naik ke Pengelola.
- When staff open the tab, then they see the numbers "Diumumkan hari
  ini", "Dalam masa advokasi" and "Naik ke Pengelola Asrama", and "Rekap
  pelanggaran per mahasiswa" with "Cari nama atau NIM" and a semester
  filter. Pressing a row opens that student's violations. The semester
  is the one "Academic period" gives for the violation date.
- When a resident opens the tab, then they see "Pelanggaran tercatat"
  for the semester, "Rekam jejak pelanggaran saya" with a period filter,
  and "Pengumuman pelanggaran" with the announced violations of
  residents of their own dorm only. Nothing shows before its hour.
- When there is nothing to show, then each list says so, such as "Belum
  ada pelanggaran yang diumumkan."
- When BAM - Kerumahtanggaan, Direktur, Ketua Program Studi, Pengasuh or
  a student outside the dorm types the address, then it is refused. When
  a resident asks for another resident's record or for the announcement
  of another dorm, or a read-only role sends a hand-made entry, then the
  server refuses it. Confirmed by a check.
- When "Simpan dan jadwalkan publikasi" is pressed twice, then the rows
  are saved once. A cancel at the announcement hour either wins fully or
  is refused. Every entry and cancel adds a line to the change log, and
  a cancelled row is marked, not deleted. Confirmed by a check.
- When BAM records on a phone, then the form fits one column with no
  sideways scroll.
- When staff open the tab on the preview, then it shows within about 1
  second, and the lists are paged.

## Not included

- Appeals, warning letters, reductions and the proposal to Kepala Unit
  (Dorm violation appeals, Dorm warning letters, Dorm violation
  reductions, Discipline proposal after SP 2).
- Violations feeding the SIKU score or Pembinaan: the prototype has no
  such link.
- The 3 hours and the announcement hour of 21:00 are
  the prototype's values, to be confirmed by the campus before launch.

## Better than the prototype

- The server works out the status from the time, so a changed clock on
  a phone cannot hide or reopen a violation.
- The list per student is paged instead of cut off at 40, and the day
  picker is not cut off at 60 days.
- Entries and cancels are logged, as for every discipline record.

## Decided

1. Every resident sees the names, reasons and punishments of the
   announced violations under "Pengumuman pelanggaran", as the
   announcement is the rule, but only those of residents of their own
   dorm. The prototype shows every dorm.
2. A BAM member may not record a violation for themselves.
3. A wrong entry cannot be corrected after it is announced; the resident
   appeals, or Pengelola Asrama reduces it.
4. "Terlambat kembali dari izin" and a missed cleaning duty are not
   recorded automatically; BAM records them by hand.

Decided while building, because the issue did not say:

5. Three new rights: recording violations, with scheduling and
   cancelling their announcement ("Mencatat pelanggaran asrama,
   menjadwalkan, dan membatalkan pengumumannya"), for BAM - BPHK, KI,
   Kerohanian, Konsumsi, Senipora and Kesehatan; reading them ("Melihat
   pelanggaran asrama") for those six, Pengelola Asrama and Kepala Unit;
   and a resident's own ("Melihat pelanggaran asrama sendiri dan
   pengumuman pelanggaran asramanya") for Mahasiswa. Direktur, Ketua
   Program Studi, Pengasuh and BAM - Kerumahtanggaan get none, as the
   tab is not theirs.
6. Alasan pelanggaran offers the prototype's eight reasons, and any other
   may be typed. It holds 3 to 200 letters, Hukuman lainnya at most 100,
   not counting spaces around them.
7. A BAM member's own student is the student their account belongs to:
   the search never offers them, and the server refuses a row for them.
   An account that is no student has no such limit.
8. Only a student who lives in a dorm on the day of the save can be
   picked, from any dorm. A violation keeps the dorm its resident lives
   in then, and the announcement of a dorm shows the violations kept
   with it.
9. The form starts at today and 21:00. One save keeps at most 50
   violations, all of them or none. The announcement may be set at most
   7 days after today. An hour that has already passed announces the
   violations at the moment they are saved, so the 3 hours of appeal
   always start when residents can see them.
10. "Simpan dan jadwalkan publikasi" pressed twice keeps the list once
    and answers both the same. The same form sent again with other
    content, or by another account, is refused and nothing is saved.
11. "Batalkan" is per row, and any account that may record may cancel a
    row another recorded. It asks "Batalkan publikasi pelanggaran ini?"
    and says "Publikasi dibatalkan.". From the announcement hour on, by
    the server's clock, it is refused with "Pelanggaran ini sudah
    diumumkan, jadi tidak dapat dibatalkan lagi.". A cancelled row keeps
    who cancelled it and when, and shows nowhere.
12. Only those who record see "Jadwal publikasi": Pengelola Asrama and
    Kepala Unit see a violation once it is announced. It lists every
    waiting row, the soonest announcement first, 20 a page, each with
    the hour it is announced and "advokasi s.d." the hour the appeal time
    ends.
13. A violation is Terjadwal before its hour, in Masa advokasi from its
    hour until 3 hours later, and Naik ke Pengelola from then on.
14. "Diumumkan hari ini" counts the violations whose announcement hour
    fell on today, campus time, and has passed. "Dalam masa advokasi"
    counts those in Masa advokasi now, of any date. "Naik ke Pengelola
    Asrama" counts those that went up with a violation date in the
    semester chosen for the rekap.
15. The semester choice offers every stored academic period, newest
    first, and starts at the running one.
16. "Rekap pelanggaran per mahasiswa" lists each student with an
    announced violation in the semester: Mahasiswa with the NIM, Asrama
    (the dorm of their latest violation), Tercatat (those that went up)
    and Masa advokasi; the most Tercatat first, then by name, 20 a page.
    Pressing a row opens a box with that student's announced violations
    of the semester, the latest first, 20 a page. The prototype's
    columns on appeals, clarifications and warning letters wait for
    those features.
17. "Pengumuman pelanggaran" offers every violation date with an
    announced violation, with how many, the latest first, and starts at
    the latest; it lists them 20 a page, the earliest announced first,
    then by name. Staff see the name, NIM and dorm; a resident sees the
    names only.
18. A resident's "Pelanggaran tercatat" counts their own violations of
    the running semester that went up. "Rekam jejak pelanggaran saya"
    offers "Semua periode" and every stored period, starts at the running
    one, and lists 20 a page, the latest first.
19. The empty lists say "Belum ada pelanggaran di daftar.", "Tidak ada
    pelanggaran yang menunggu diumumkan.", "Belum ada pelanggaran yang
    diumumkan.", "Tidak ada pelanggaran pada semester ini.", "Tidak ada
    pelanggaran pada periode ini." and "Tidak ada penghuni asrama yang
    cocok.". A save says "(n) pelanggaran disimpan dan dijadwalkan
    diumumkan (hour). Advokasi dapat diajukan sampai (hour).".
20. Each entry and each cancel adds a line to the log with who, when and
    which; the database refuses to change or delete a line, and a
    violation with a line cannot be deleted.
21. Sample data, in the running period, of the first 24 sample residents
    by name: two violations on each of the ten days before today and a
    third for the first resident every third day, announced at 21:00 of
    their day, one with Hukuman lainnya; three announced an hour ago, in
    Masa advokasi; and three of today waiting for the next 21:00 at
    least an hour away, one of them cancelled. The sample BAM - BPHK
    records those of even dates and the sample BAM - KI the others.

## Steps

- [x] 1. The table for dorm violations is added, with sample violations
  waiting, in Masa advokasi and Naik ke Pengelola.
- [x] 2. The rights to record and to read violations are added to the
  permission list, with their checks.
- [x] 3. BAM records violations and schedules the announcement.
- [x] 4. BAM sees "Jadwal publikasi" and cancels a waiting row.
- [x] 5. Staff see the numbers, the announcement per day and the count
  per student.
- [x] 6. Residents see their own record and the announcement.
