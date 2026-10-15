# Dorm dashboard

Depends on: Dorm activities, Dorm attendance, Dorm leave requests, Return from leave
Group: Asrama

## What we want

The tab Dashboard asrama gets its content: one screen that tells staff
how the three dorms are doing today. It shows how many residents there
are, who is out and who is late, how many leave requests wait, and how
well dorm activities were attended in the last 7 days.

## Who it is for

- Pengelola Asrama, Kepala Unit, Direktur / Wakil Direktur and Ketua
  Program Studi (their study program only).
- Every BAM role, with names limited as said below.
- Nobody changes anything here.

## What should happen

- When staff open Dashboard asrama, then they see four numbers:
  "Penghuni asrama" with the count per dorm, "Sedang di luar asrama"
  with how many are "terlambat kembali", "Izin menunggu verifikasi", and
  "Kehadiran 7 hari terakhir" as a percentage with the number of
  activities, leave left out.
- When they look at "Kehadiran kegiatan", then they see today's and the
  last 7 days' activities with Waktu, Penanggung jawab, Peserta, Hadir,
  Izin, Tidak hadir and Kehadiran. An activity not announced yet shows
  "Belum diumumkan" and no absences.
- When they press a row, then Kegiatan asrama opens on that activity.
- When they look below, then they see "Kehadiran per penanggung jawab"
  and "Kehadiran per asrama" as bars with percentages, and "Perizinan
  bulan ini" with the count per kind of leave.
- When Pengelola Asrama, BAM - BPHK, Kepala Unit or Direktur looks at
  "Sedang di luar asrama", then they see each resident with the kind of
  leave, the time due back, Tujuan, the room and "Terlambat" when late.
  With nobody out it says "Tidak ada."
- When another BAM role opens the tab, then they see the numbers but no
  names, destinations or rooms under "Sedang di luar asrama".
- When Ketua Program Studi opens it, then every number and name covers
  only residents of their study program.
- When there is no activity or leave yet, then each part says so
  instead of showing an empty table or 0% as if it were a result.
- When a resident, Pengasuh, Konselor or Pegawai UPK types the address,
  or asks for the numbers by hand, then the server refuses it. When a
  BAM role without the right asks for the names by hand, then it gets
  none. Confirmed by a check.
- When leave is approved or an absence is announced, then the numbers
  are right the next time the tab is opened; nothing is stored twice.
  Confirmed by a check.
- When the tab is opened on a phone, then the numbers stack, the bars
  fit the width and the table turns into cards.
- When staff open the tab on the preview with the full sample data,
  then it shows within about 1 second.

## Not included

- The panels "Kesehatan jasmani penghuni" and "Kesehatan mental
  penghuni" (Dorm dashboard health).
- Numbers about violations, cleaning or rooms.
- Changing the period.

## Better than the prototype

- Names and destinations of residents on leave show only to the roles
  that may read leave requests; the prototype shows them to every BAM
  role.
- The numbers are counted by the database for the role's own students,
  not in the browser over everyone's data.
- Parts with no data say so.
- The activity table opens the last 7 days in full, paged, instead of
  cutting off at 14 rows.

## Decided

1. Names, destinations and rooms under "Sedang di luar asrama" show to
   the roles that read leave requests: Pengelola Asrama, BAM - BPHK,
   Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their
   own students only).
2. Violations and cleaning scores are not counted here.
3. "Kehadiran 7 hari terakhir" includes today's activities that are
   over.

Decided while building, because the issue did not say:

4. Seeing Dashboard asrama is a right of its own, held by Kepala Unit,
   Direktur / Wakil Direktur, Ketua Program Studi, Pengelola Asrama and
   every BAM role. Seeing the names on it is a second right, held by the
   roles in 1. A student who is also a BAM member sees the dashboard
   through the BAM role.
5. "Today" and "now" are campus time (WIB). "Today and the last 7 days"
   is today and the 7 dates before it, as in the prototype.
6. "Penghuni asrama" counts who lives in each dorm today, by the rule the
   app already uses, with each dorm's short name and count under it.
7. "Sedang di luar asrama" counts the residents out now, as the number
   "Sedang di luar" on Perizinan asrama does. Under it: "(n) terlambat
   kembali" for those out past their return time, or "dengan izin
   disetujui" when none is late, as in the prototype.
8. "Izin menunggu verifikasi" counts the requests that wait, as
   "Menunggu verifikasi" on Perizinan asrama does.
9. Kehadiran counts as on Kegiatan asrama: only announced activities that
   are over, Hadir out of Hadir and Tidak hadir, with approved leave and
   accepted clarifications applied, rounded to a whole percentage.
   "Kehadiran 7 hari terakhir" says "(n) kegiatan, izin tidak dihitung",
   n being those announced activities; with none it shows "-" and "Belum
   ada kegiatan yang diumumkan".
10. "Kehadiran kegiatan" lists every activity of today and the 7 dates
    before, the latest first, 25 a page. Peserta, Hadir, Izin and Tidak
    hadir are those of the announced count. An activity not announced
    shows its Peserta as Jadwal harian counts them and "-" for the
    others; one not over shows its state instead of Kehadiran. With no
    activity it says "Belum ada kegiatan asrama dalam 7 hari terakhir."
11. A row opens Jadwal harian of Kegiatan asrama on its date, with the
    activity chosen in "Penghitungan kehadiran" for those who count.
12. "Kehadiran per penanggung jawab" has one bar for each of UPK,
    Pelatih and BAM with the number of announced activities; "Kehadiran
    per asrama" one bar per dorm, counting each resident by the dorm they
    live in today, with its number of residents. A bar with nothing
    counted shows "-" instead of 0%.
13. "Perizinan bulan ini" counts the requests whose start falls in the
    current month, in every status, as in the prototype, per kind: Izin
    pesiar, ITMK and Izin khusus, with the total beside the title. With
    none it says "Belum ada pengajuan izin bulan ini."
14. The list under "Sedang di luar asrama" shows the soonest return time
    first, at most 20, with "Lihat semua di Perizinan asrama" when there
    are more. The roles without the right to names see only "(n)
    penghuni sedang di luar asrama." or "Tidak ada."; the server does not
    read names, destinations or rooms for them.
15. Nothing is stored for the dashboard: every number is counted from
    the records each time the tab opens.
16. "Penghuni asrama" and "Kehadiran per asrama" name the four dorms the
    app keeps, Wismantara Putra and Wismantara Putri apart, where the
    prototype names Wismantara as one.

## Steps

- [x] 1. The right to see Dashboard asrama, and the right to see names
  on it, are added to the permission list, with their checks.
- [x] 2. The four numbers show.
- [ ] 3. "Kehadiran kegiatan" shows, with the link to the activity.
- [ ] 4. The bars per penanggung jawab and per dorm show.
- [ ] 5. "Perizinan bulan ini" and "Sedang di luar asrama" show, with
  names for the allowed roles only.
- [ ] 6. Ketua Program Studi sees only their study program.
