# Character coaching list

Depends on: Mentor groups, Character assessment, Students needing coaching, Student list and detail, Academic period
Group: Pembinaan

## What we want

"Pembinaan karakter" lists the active students whose character
assessment says they need coaching: an average under 65, or one value
under 58. Each has a level (Intensif, Sedang, Ringan). Who is listed and
at which level is read from the rule that Students needing coaching
owns; it is not worked out again here. Each also has a status that
staff move forward after each coaching step: Teridentifikasi, Konseling,
Pemantauan, Selesai.

## Who it is for

- Change the status: Kepala Unit, and Pengasuh for their own mentees.
- Read only: Direktur / Wakil Direktur, and Ketua Program Studi (their
  program only).

## What should happen

- When Kepala Unit opens the tab, then they see the numbers "Belum
  selesai" (out of all identified), "Intensif" (average under 60),
  "Sedang" (average 60 to 64) and "Ringan" (one value under 58), and the
  list of students not yet "Selesai".
- When they look at a row, then they see the student (name, NIM,
  program studi, semester), their Pengasuh, the level, "Aspek terlemah"
  with its value, "Rerata" and the status. Rows are ordered Intensif
  first, then by lowest Rerata.
- When they use "Cari nama atau NIM", the filter by level, or the
  filter by status ("Belum selesai", "Semua status" or one status), then
  the list narrows; an empty result shows "Tidak ada mahasiswa pada
  filter ini."
- When they choose another status for a student, then they may add a
  short "Catatan" of what was done, a message says
  "Status (name): (status)", the row shows the note, and the numbers
  update. The note is read by the roles with this tab, within their
  rows, and by the student on Profil saya. A student set to
  "Selesai" leaves the "Belum selesai" view.
- When a student has no saved status yet, then they show as
  "Teridentifikasi".
- When anyone looks at the list, then a line under it says "Status
  Konseling di sini hanya penanda; mahasiswa tidak otomatis didaftarkan
  konseling."
- When a new assessment lifts a student above both limits, then they
  leave the list; when it drops them below, they appear as
  "Teridentifikasi".
- When Pengasuh opens the tab, then they see "Menampilkan mahasiswa
  binaan Anda." and only their own mentees, and can change their status.
- When Direktur or Ketua Program Studi opens the tab, then the status
  shows but cannot be changed. Ketua Program Studi sees only their
  program.
- When a student is pressed, then their student detail opens, for roles
  allowed to open it.
- When a role with this tab looks at the menu, then the Pembinaan item
  shows the number of students not yet "Selesai" among the rows that
  role may see, and no number at zero.
- When Pembina Disiplin Mahasiswa, Mahasiswa, Konselor, Penilai
  Mahasiswa, Pengelola Asrama or a BAM role types the address, a reading
  role sends a hand-made status change, or Pengasuh changes a student
  outside their mentees, then the server refuses it. Confirmed by a
  check.
- When two people change one student's status at once, then the second
  is refused with a message and sees the current status. Each change
  adds a line to the log: who, when, before and after. Confirmed by a
  check.
- When the tab is opened on a phone, then each student is a card with
  the status choice, with no sideways scroll.
- When the tab is opened on the preview, then it shows within about 1
  second, and the list is paged, 25 at a time.

## Not included

- "Perlu pembinaan" on the Dashboard (Dashboard mentoring summary).
- The card "Pembinaan (level)" that shows a student their own level,
  status, weakest aspect and the staff note (My coaching, mentoring
  notes and sanction status). This spec saves the note; that one shows
  it on Profil saya.
- Starting the status again each semester.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.
- "Panggil konseling" from Asesmen karakter (Students needing coaching).
- Coaching notes by Pengasuh (Mentoring notes).

## Better than the prototype

- The prototype gives students with no saved status a made-up one; here
  everyone starts at "Teridentifikasi".
- The list is paged instead of cut off at 80.
- Two people changing one status cannot overwrite each other, and the
  change is logged.

## Decided

1. Choosing "Konseling" here does not send anyone to counselling; it is
   only a label, and a line under the list says so, since counselling is
   asked for on Konseling.
2. A status change may carry an optional short note of what was done,
   shown in the row and, through My coaching, mentoring notes and
   sanction status, to the student.
3. The student's own "Pembinaan (level)" card is kept, and is built by
   My coaching, mentoring notes and sanction status, not here.
4. One status per student runs on; it does not start over in a later
   semester. A student who left the list and is identified again shows
   as "Teridentifikasi", with the change in the log.
5. The limits 65, 60 and 58 are fixed, in the one rule that Students
   needing coaching owns.
6. "Catatan" holds at most 300 characters. A status is never deleted,
   and its log cannot be changed or deleted.
7. Reading the tab needs no right of its own: a role that opens the tab
   reads its rows. Only the new right "Mengubah status pembinaan
   karakter dan catatannya" changes a status, for Kepala Unit on every
   student and for Pengasuh on their own mentees. An account with
   several roles sees the rows of each role that opens the tab, and
   changes only the rows of its roles with that right: a Ketua Program
   Studi who is also Pengasuh reads the program and changes only the
   mentees.

## Steps

- [x] 1. The table for coaching status is added, with sample statuses.
- [x] 2. The right to change a coaching status is added to the
  permission list, with its checks.
- [ ] 3. The numbers and the list with levels, search and filters and
  the line about "Konseling", read only and limited to each role's
  rows.
- [ ] 4. Changing a status, with the optional note and the log.
- [ ] 5. Refusing a change made on an outdated status.
- [ ] 6. The number beside the Pembinaan menu item.
