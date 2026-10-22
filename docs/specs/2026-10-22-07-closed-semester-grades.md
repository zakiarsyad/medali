# Grades of a closed semester

Depends on: Closing a semester, Character grade list, Score limit under a
discipline penalty, Academic period
Group: Penilaian

## What we want

Once a semester is closed, staff can read its fixed grades on Penilaian
> Penilaian karakter, beside the live grades of the running semester.
The list looks the same; only the numbers come from the fixed copy and
cannot change.

## Who it is for

Read only, the same roles and rows as "Daftar nilai karakter": Kepala
Unit, Direktur / Wakil Direktur, Penilai Mahasiswa, Ketua Program Studi
(own program) and Pengasuh (the students who are their mentees today).

## What should happen

- When one of these roles opens Penilaian karakter and at least one
  semester is closed, then above "Daftar nilai karakter" they see the
  choice "Semester" with "Berjalan" chosen and each closed period below
  it, newest first. With no closed semester the choice is not shown.
- When they pick a closed period, then the four numbers and the list
  show the fixed grades of that period: Kehadiran, Pengasuhan, SIKU,
  SKPM, Nilai akhir, Huruf and Keterangan, with the line "Nilai semester
  (period), ditetapkan (date). Tidak berubah lagi."
- When they look at "Skema bobot" for a closed period, then it shows the
  weights and letter limits kept with that period, read only, also for
  Kepala Unit.
- When a grade was held at 70, then the row shows "dibatasi 70" as it
  did when the semester was closed.
- When a student was kept as "Belum lengkap", then the row shows "-" for
  the missing parts and "Belum lengkap".
- When they search or use the filters "Belum memenuhi batas lulus" and
  "Belum lengkap", then these work on the fixed grades, 25 a page.
- When a student has left the campus since, then their fixed row still
  shows for the roles that may read every student; Ketua Program Studi
  and Pengasuh see only students inside their rows today.
- When they pick "Berjalan" again, then the live grades show as before.
- When the choice is made, then it is kept in the page address.
- When Pengasuh asks by hand for a fixed grade outside their mentees,
  Ketua Program Studi for another program, or a student, Konselor,
  Pegawai UPK or a BAM role for any, then it is refused. Confirmed by a
  check.
- When the list is opened on a phone, then each student is a card and
  the choice sits above the cards, with no sideways scroll.
- When a closed period is opened with sample data, then the tab shows
  within about 1 second with 25 rows.

## Not included

- Closing a semester (Closing a semester).
- The student's own past grades on Profil saya.
- Past grades in the student detail and on the Dashboard.
- A printed report or a file to download.
- Comparing two semesters side by side.

## Decided

1. The student does not see their own fixed grades in this spec;
   Profil saya keeps showing the running semester only.
2. For a past semester Pengasuh sees the students they mentor today, the
   same rows as everywhere else, even when a group changed mentor since.
3. Ketua Program Studi sees the fixed rows of the students whose program
   today is their own, whatever the student's status today. Pengasuh
   sees the fixed rows of their mentees today. The roles that read every
   student see every fixed row of the period.
4. The four numbers of a closed period are worked out from its fixed
   rows that the role may see, in the same way as the live numbers, with
   the pass letter kept with that closing.
5. A name in the list of a closed period opens the student over the tab
   with the same rule as the live list; a student the role may no longer
   open is shown as a name only.
6. The date in the line is the day of closing on campus, as on
   Periode akademik. Each closed period is named in the choice as
   periods are named elsewhere on screen.
7. A period in the address that is not closed, or not a period at all,
   shows "Berjalan".
8. The sample data holds no closed period, as "Closing a semester"
   decided; a period is closed on the app first to try this.
9. The speed is confirmed on this computer with sample data, since a PR
   has no preview.

## Steps

- [x] 1. The right to read fixed grades, with the same row limits as the
  live list, and its checks.
- [x] 2. The choice "Semester", kept in the address.
- [ ] 3. The numbers, the list and "Skema bobot" read from the fixed
  copy of the chosen period.
- [ ] 4. Search, filters, paging and the refusals.
- [ ] 5. The phone layout and the speed check.
