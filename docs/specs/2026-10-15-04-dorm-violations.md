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

## Steps

- [ ] 1. The table for dorm violations is added, with sample violations
  waiting, in Masa advokasi and Naik ke Pengelola.
- [ ] 2. The rights to record and to read violations are added to the
  permission list, with their checks.
- [ ] 3. BAM records violations and schedules the announcement.
- [ ] 4. BAM sees "Jadwal publikasi" and cancels a waiting row.
- [ ] 5. Staff see the numbers, the announcement per day and the count
  per student.
- [ ] 6. Residents see their own record and the announcement.
