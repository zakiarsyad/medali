# Dashboard: character achievement

Depends on: Student list and detail; Character assessment; Academic period
Group: Dashboard

## What we want

The Dashboard gets its frame, built like the prototype: the title
"Dashboard pembangunan karakter", the filter for groups of students, the
row of aspect cards, and the first section, Capaian karakter. Later specs
add the other sections into the same frame.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their own
program only). Pengasuh gets "Dashboard anak asuh" in a later spec.

## What should happen

- When one of the three roles opens Dashboard, then they see the title,
  the intro line, the filter, the card "Capaian karakter", and section 1
  "Capaian karakter" with "Lihat rincian" to Penilaian > Asesmen karakter.
- When they look at the filter, then it holds Tahapan, Program studi,
  Reguler atau alih program, Provinsi, Afirmasi, Pembibitan,
  Internasional and Instansi. Each choice shows how many students it
  would give, and choices with none are hidden.
- When they pick one or more filters, then every number on the page counts
  only those students, the line says "(n) mahasiswa sesuai (k) filter",
  and "Atur ulang filter" clears them.
- When no active student matches, then they see "Tidak ada mahasiswa aktif
  dengan kombinasi filter ini." and no section.
- When they look at the card, then it shows the MEDALI average, "Hasil
  asesmen (n) dari (total) mahasiswa", "(n) emas, (n) perlu pembinaan"
  as in the prototype (the count of each predikat, not the coaching
  list), and a bar of the predikat spread. Pressing it scrolls to
  section 1.
- When they look at section 1, then they see the average of each nilai
  with the change from last semester (or "Semester pertama"), the medal
  chart with last semester as a dashed line, "Rerata (score) ·
  (predikat)", and how many are assessed.
- When they look at "Capaian MEDALI per angkatan", then each cohort (year,
  Reguler or Alih program, semester) shows the count, the six nilai
  coloured by predikat, the average and the predikat spread. Without a
  filter, cohorts under 20 students are left out. A cohort under 5
  students is never shown.
- When the filtered group holds fewer than 5 students, then the card and
  section 1 show no averages, only "Rekap ditampilkan setelah minimal 5
  mahasiswa, agar nilai perorangan tidak dapat ditebak." The server
  sends no numbers for it. Confirmed by a check.
- When the page speaks of this semester or last semester, then it reads
  the running period from "Academic period".
- When Ketua Program Studi opens Dashboard, then every number counts only
  their program, and Program studi is not in the filter.
- When Konselor, Mahasiswa, Pegawai UPK or a BAM role opens the Dashboard
  address, or sends a hand-made request for its numbers, or Ketua Program
  Studi asks by hand for another program, then it is refused. Confirmed
  by a check.
- When the page is opened on a phone, then the filter folds into one
  "Filter" button, the cards and nilai stack, and the cohort table shows
  each cohort as a readable block, with no sideways scroll.
- When the page opens on the preview with sample data, then it shows
  within about 1 second; numbers are worked out by the database, not by
  loading every student.
- When a filter is chosen, then it is kept in the page address, so
  reloading or sharing the link shows the same view.

## Not included

- Sections 2 to 4 and Pendampingan, and their cards (Dashboard character
  grade, Dashboard physical health, Dashboard mental health, Dashboard
  mentoring summary).
- The Asrama filter. No issue builds it now; it needs its own spec.
- The limit of 20 students for a cohort is one of
  the prototype's values, to be confirmed by the campus before launch.
- Dashboard anak asuh for Pengasuh (Mentor dashboard overview). Until
  then Pengasuh sees "Dashboard anak asuh" as an empty page.

## Better than the prototype

- The filter is kept in the address; the prototype forgets it on reload.
- On a phone the filter folds away instead of filling the screen.

## Decisions

1. Any number that covers fewer than 5 students is never shown, also
   when the whole filtered group is under 5. Without a filter, a cohort
   under 20 students is still left out.
2. The running period is read from "Academic period"; this spec has no
   rule of its own.

## Decided while building

1. Reading the Dashboard is its own right in the permission list, held
   by Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi.
   Ketua Program Studi sees only the students of their own program.
   Every number is read only after this right is checked.
2. Pengasuh keeps the Dashboard page without that right, and sees an
   empty page titled "Dashboard anak asuh". A person who is both staff
   and Pengasuh sees the staff Dashboard. Konselor, Mahasiswa, Pegawai
   UPK and the BAM roles do not have the page at all.
3. The numbers are read only by the page itself; there is no separate
   address for them. A Program studi asked for by hand by Ketua Program
   Studi counts as not chosen, and the Program studi filter is not shown
   to them.
4. Only Aktif students count, as the prototype's "mahasiswa aktif". A
   removed student never counts.
5. "This semester" is each student's latest character assessment, and
   "last semester" the one before it, as on Asesmen karakter. The
   running period gives each cohort its semester and the Tahapan filter.
   While no period runs, the Tahapan filter is not shown and the cohorts
   show no semester, as the student list does.
6. Averages count assessed students only. "Hasil asesmen (n) dari
   (total) mahasiswa": n is the assessed students, total the Aktif
   students in the filtered group. The card and section 1 show their
   numbers only when at least 5 students are assessed; otherwise only
   the "Rekap ditampilkan…" line, and the server reads out none of those
   numbers.
7. The change from last semester of a nilai is the average, over the
   students with an earlier assessment, of their latest score less their
   earlier one. The dashed line is the average now less that change.
   They are shown only when at least 5 students have an earlier
   assessment; otherwise every nilai says "Semester pertama" and the
   medal has no dashed line.
8. The card says "Hasil asesmen (n) dari (total) mahasiswa. (n) emas,
   (n) perlu pembinaan." with the MEDALI Rerata as its number, and its
   bar shows the spread of the four predikat. Pressing it moves the page
   to section 1.
9. "Capaian MEDALI per angkatan" has one row per angkatan and per
   Reguler or Alih program, the newest angkatan first and Reguler before
   Alih program, written "Angkatan (year)", "Reguler · Smt (n)".
   "Jumlah" is the assessed students of the row. A row is shown only
   with at least 5 assessed students, and without any filter at least 20.
   Each nilai carries the dot of its predikat. On a phone each row is a
   block.
10. The filter has one list per group, with the prototype's labels and
    "all" choices. Each choice says how many Aktif students it would
    give with the other chosen filters; a choice with none is hidden
    unless chosen. The database counts them, one small count per group.
    The line says "(n) mahasiswa sesuai (k) filter", or "(n) mahasiswa
    aktif" with no filter. A choice in the address that is not known
    counts as not chosen. Choosing sends the filter at once, as on the
    student list.
11. The choices of Provinsi and Instansi are those the Aktif students the
    account sees hold, in alphabetical order, with "Tanpa instansi
    (reguler)" first; a Provinsi or Instansi in the address that none of
    them holds counts as not chosen.
12. Afirmasi, Pembibitan and Internasional each offer yes and no, as in
    the prototype: "Afirmasi" or "Non afirmasi", "Pembibitan" or "Non
    pembibitan", "Internasional" or "Domestik".
13. With no Aktif student matching, the page shows "Tidak ada mahasiswa
    aktif dengan kombinasi filter ini." and no card or section.
14. "Lihat rincian" goes to Penilaian > Asesmen karakter, and shows only
    to an account that may open that tab.
15. The title is "Dashboard pembangunan karakter" with the prototype's
    intro line as it is.
16. The line under the medal adds "Garis putus-putus menunjukkan
    semester lalu." only when the dashed line is shown.
17. When no cohort may be shown, the table says "Tidak ada angkatan
    dengan minimal 20 mahasiswa yang sudah diasesmen.", or 5 with a
    filter.
18. The filter of a phone, its count of choices and the line of
    "Atur ulang filter" are the same shared parts the student list uses.

## Steps

- [ ] 1. The Dashboard frame, title and intro, open to the three roles,
  with Ketua Program Studi limited to their program.
- [ ] 2. The filter with counts, "Atur ulang filter", the empty message,
  and the filter kept in the address.
- [ ] 3. The "Capaian karakter" card.
- [ ] 4. Section 1: averages per nilai, change from last semester and the
  medal chart.
- [ ] 5. "Capaian MEDALI per angkatan".
