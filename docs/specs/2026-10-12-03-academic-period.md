# Academic period

## What we want

The app knows which academic period is running: the year and Ganjil or
Genap, with a start and an end date. Pengaturan gets a small page
"Periode akademik" where it is set. Every area that says "this semester"
reads it from here, so a student's semester, the counts per semester and
the period choices all agree.

## Who it is for

- Set the periods: Kepala Unit only.
- Everyone else: no page; they only see the running period used on
  other screens.

## What should happen

- When Kepala Unit opens Pengaturan > Periode akademik, then they see
  the running period (for example "Ganjil 2026/2027", with its dates)
  and a list of all periods, newest first.
- When no period exists yet, then the page says "Belum ada periode
  akademik." and offers "Tambah periode".
- When they press "Tambah periode", then the form suggests 1 August for
  Ganjil and 1 February for Genap as Mulai. When they fill Tahun
  akademik, Ganjil or Genap, Mulai and Selesai, and save, then it shows
  in the list with a message.
- When the end is not after the start, the dates overlap another
  period, or the same year and Ganjil or Genap already exists, then
  nothing is saved and the message says why.
- When they change the dates of a period that has not ended, then the
  new dates show; a period that has ended can no longer be changed.
- When today falls inside a period, then that period is the running one
  everywhere. Confirmed by a check.
- When today falls between two periods, or after the last one, then the
  period that ended last stays the running one until the next starts.
  The app never makes a period by itself. Confirmed by a check.
- When another spec asks which period runs on a given date, then the
  same rule answers for that date as for today. Only a date before the
  first stored period has no period, and the rule says so. Confirmed by
  a check.
- When the app works out a student's semester, then it uses the
  student's angkatan year and the running period only: twice the number
  of years from the angkatan year to the first year of the running
  Tahun akademik, plus 1 in Ganjil or 2 in Genap, never below 1 and
  never above 8. So in Ganjil 2026/2027 angkatan 2026 is in semester 1,
  angkatan 2025 in semester 3, and angkatan 2022 in semester 8. Old
  periods need not exist. Confirmed by a check.
- When an account without the right opens the page or sends a hand-made
  change, then it is refused. Confirmed by a check.
- When a period is added or changed, then a line goes to a log of
  period changes: who, when, before and after. The log cannot be
  changed or emptied. Confirmed by a check.
- When the sample data command runs, then the running period and the
  three before it exist.
- When the page is opened on a phone, then the list becomes cards with
  no sideways scroll, and it shows within about 1 second on the preview.

## Not included

- Closing a semester and fixing its grades.
- Holidays, exam weeks or any calendar inside a period.
- Changing the screens that already work out a semester; each area
  switches to this setting in its own spec.
- A reminder to add the next period.
- Making the next period by itself.

## Open questions

None. Settled with the owner: dates are typed per period, only Kepala
Unit sets them, the app makes no period by itself, and period changes
get their own log.

## Steps

- [x] 1. The tables for academic periods and for the log of period
  changes are added, with sample periods.
- [x] 2. The right to set periods is added to the permission list, with
  its checks.
- [x] 3. One rule answers "which period runs on a given date" (today or
  any other date) and "which semester is this student in", with checks.
- [x] 4. Pengaturan > Periode akademik shows the running period and the
  list.
- [x] 5. Kepala Unit adds a period and changes one that has not ended,
  and each change goes to the log.
