# My tasks: clarifications and cleaning assessments

Depends on: My tasks: leave and return reports, Dorm attendance clarification, Cleaning assessment
Group: Tugas saya

## What we want

Tugas saya gains two more sections for Pengelola Asrama: attendance
clarifications that BAM has passed on, and cleaning assessments by BAM
that wait for validation. Both are decided on this page, with the same
effect as on their Asrama tabs.

## Who it is for

- Pengelola Asrama only.

## What should happen

- When Pengelola Asrama opens Tugas saya, then two more number cards
  show, "Klarifikasi kehadiran" and "Penilaian kebersihan", and both
  count toward the number in the menu.
- When they look at "Klarifikasi kehadiran menunggu validasi", then each
  card shows the student, room, activity, reason, explanation, the file
  and BAM's note, as on Klarifikasi kehadiran.
- When they press "Terima sebagai hadir" or "Terima sebagai izin", then
  the clarification leaves the list and the student's dorm attendance
  for that activity changes to match.
- When they press "Tolak" with a note and confirm, then it is rejected
  and the message says so. Without a note nothing is saved.
- When they look at "Penilaian kebersihan menunggu validasi", then each
  row shows Tanggal, Tempat, Kamar and "Penilaian BAM" (Memenuhi or
  Tidak memenuhi, the note and who assessed).
- When they press "Validasi" on Memenuhi, then the room gains 1 point.
  On Tidak memenuhi the room loses 1 point and a repeat cleaning is set
  by the rule in Cleaning assessment (the next day, or the next free
  day when that one is taken); the message names that date.
- When they press "Tolak" on an assessment, then a small form asks for
  the reason (5 letters or more, as in Cleaning assessment), and the
  duty goes back to BAM to assess again.
- When a section is empty, then it shows "Beres" and "Tidak ada yang
  menunggu."
- When any other role sends one of these decisions by a hand-made
  request, then it is refused. Confirmed by a check.
- When an item was already decided on its Asrama tab, or a button is
  pressed twice, then one decision stands and the late one is refused
  with a message; a repeat cleaning is never made twice. Confirmed by a
  check.
- When the page is opened on a phone, then the cleaning rows become
  cards and the three clarification buttons stack, with no sideways
  scroll.

## Not included

- BAM's own steps: verifying a clarification and assessing a cleaning.
- The section "Penetapan SP" (My tasks: warning letters and violations
  to watch).

## Better than the prototype

- Rejecting an assessment uses a form on the page; the prototype uses a
  browser pop-up that accepts an empty reason.
- Rejecting a clarification asks for confirmation, because a rejected
  clarification can lead to an SP once Dorm warning letters is built.
- Validation and the repeat cleaning are saved together, so one cannot
  happen without the other.

## Decided

1. A reason is required when an assessment is sent back to BAM, at
   least 5 letters; the rule lives in Cleaning assessment and this page
   uses the same action.
2. If the next day already has a duty for that place, the repeat
   cleaning goes to the next free day, named in the message; the rule
   lives in Cleaning assessment and this page uses the same action.

## Decisions made while building

1. Both sections show their 20 oldest items with how many wait in all,
   as the sections of leave and return reports do. "Oldest" means the
   earliest sent for a clarification and the earliest date for a
   cleaning duty.
2. The clarifications are those of every student the account may see
   through its right to decide them, as on Klarifikasi kehadiran. The
   cleaning duties are those of every dorm, as on Pembersihan asrama,
   where a duty names a room by number only and never a student.
3. A clarification card is the one on Klarifikasi kehadiran, with its
   status, when it was sent and BAM's check with who and when; a press
   on the file name opens the file over the page, as there. The section
   says what the prototype says: "Sudah diterima BAM. Terima sebagai
   hadir atau izin, atau tolak. Penolakan memicu penetapan SP."
4. A kept decision says what Klarifikasi kehadiran already says:
   "Klarifikasi diterima; status kehadiran diperbarui." or
   "Klarifikasi ditolak.", above the list of the section, as the card
   leaves it. "Tolak" with an empty note sends nothing and says "Tulis
   alasan penolakan di kolom catatan."; with a note it asks first, such
   as "Tolak klarifikasi (name), Apel pagi, 12 Okt 2026, 05.00–06.00?".
5. When more than 20 wait, "Lihat semua di Klarifikasi kehadiran"
   opens that tab at Diverifikasi BAM, where all of them are.

## Steps

- [x] 1. The server adds clarifications and cleaning assessments to the
  count and the lists, with its checks.
- [x] 2. The section "Klarifikasi kehadiran menunggu validasi" with its
  three decisions.
- [ ] 3. The section "Penilaian kebersihan menunggu validasi" with
  Validasi and Tolak.
- [ ] 4. The two number cards; stale and double decisions are refused.
- [ ] 5. Phone layout for both sections.
