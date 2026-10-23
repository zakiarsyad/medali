# Asrama: dorm dashboard health

Depends on: Dorm dashboard; Dorm health notes; Dashboard physical health;
Dashboard mental health; Fitness test scores; Mental health screening;
Shared counselling data for recipients; Sharing the screening level
Group: Asrama

## What we want

Dashboard asrama gets two more panels below the rest: "Kesehatan jasmani
penghuni" and "Kesehatan mental penghuni". They show counts for dorm
residents only. Names appear in two places and only for roles allowed
to see them: residents who need medical follow-up, and data a counsellor
has shared with the viewer with the student's consent. No role sees more
here than Dorm health notes and Mental health screening give it.

## Who it is for

- "Kesehatan jasmani penghuni", counts: the roles that open Kesehatan
  in Dorm health notes and also see Dashboard asrama: Pengelola Asrama,
  Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi (their
  study program only), BAM - Kesehatan and BAM - BPHK.
- Names of residents who need care: Pengelola Asrama, Kepala Unit,
  BAM - Kesehatan and BAM - BPHK, the roles that read the list in Dorm
  health notes. Never Direktur or Ketua Program Studi.
- "Kesehatan mental penghuni": Kepala Unit, Direktur / Wakil Direktur
  and Ketua Program Studi (their study program only), the roles Mental
  health screening gives counts to. Never Pengelola Asrama or a BAM
  role.
- Shared counselling data: only the role it was shared with, among
  those three.

## What should happen

- When one of the six roles opens Dashboard asrama, then "Kesehatan
  jasmani penghuni" shows how many residents are tested out of all, a
  bar per category (Prima, Baik, Perlu perhatian, Perlu tindak lanjut
  medis), and a table with the count per category for each dorm.
- When a count in the bars or the table covers 1 to 4 residents, then
  it shows as "<5". When fewer than 5 residents in the viewer's reach
  are tested, then the bars and the table are replaced by "Rekap
  ditampilkan setelah minimal 5 penghuni dites, agar identitas tidak
  dapat ditebak." This is the same rule as on Dashboard.
- When Pengelola Asrama, Kepala Unit, BAM - Kesehatan or BAM - BPHK
  looks under "Perlu perhatian dan tindak lanjut medis", then they see
  up to 8 residents, heaviest first, with the room and the last note or
  "Belum ada catatan kesehatan.", and a link to the full list on
  Kesehatan. With none it says "Tidak ada."
- When Direktur or Ketua Program Studi looks at that panel, then they
  see the counts and no names or notes.
- When another BAM role opens Dashboard asrama, then neither panel
  shows. When Pengelola Asrama, BAM - Kesehatan or BAM - BPHK opens it,
  then "Kesehatan mental penghuni" does not show.
- When Kepala Unit, Direktur or Ketua Program Studi looks at "Kesehatan
  mental penghuni", then they see "rekap anonim": a bar per level with
  how many residents, and "(n) penghuni sudah diasesmen · (n) sesi
  konseling 30 hari terakhir". A level that covers 1 to 4 residents
  shows as "<5".
- When fewer than 5 residents in the viewer's reach are assessed, then
  the bars and the session count are replaced by "Rekap ditampilkan
  setelah minimal 5 penghuni diasesmen, agar identitas tidak dapat
  ditebak." With none assessed it says "Belum ada asesmen kesehatan
  mental penghuni."
- When a counsellor has shared a resident's data with the viewer's
  role, then it shows under "Data yang dipublikasikan konselor untuk
  Anda" with the name, the room and what was shared. Otherwise it says
  that data on one person only shows when the counsellor shares it with
  the student's consent.
- When Ketua Program Studi opens the tab, then all counts cover only
  their study program, and the rules of 5 apply to that smaller group.
- When a role without the right asks by hand for a panel, the names,
  the notes, the level counts or one resident's level, then the server
  gives none. Confirmed by a check, with Pengelola Asrama and a BAM role
  asking for the mental health counts among the refused.
- When consent is withdrawn or sharing is stopped, then the resident is
  gone from the panel the next time it is opened. Confirmed by a check.
- When the panels are opened on a phone, then they stack and the table
  per dorm fits with no sideways scroll.
- When staff open the tab on the preview, then the two panels do not
  push the whole tab past about 1 second.

## Not included

- The mark "Potensi kesehatan mental": it never shows on a dashboard.
- Writing health notes, assessments or counselling data.
- The campus-wide panels on Dashboard.

## Better than the prototype

- The prototype shows the names and health notes of residents who need
  follow-up to every role on the dashboard, including BAM roles that
  cannot open Kesehatan. Here names follow the same rights as Kesehatan.
- The prototype shows the mental health counts to Pengelola Asrama and
  every BAM role. Here they show only to the roles that get such counts
  in Penilaian.
- The link under the names goes to Kesehatan on Asrama, which the
  viewer can open, not to Penilaian jasmani, which BAM cannot.
- The rules of 5 are applied by the server and also per study program.
- A count that covers 1 to 4 residents shows as "<5", so one person
  cannot be picked out from the bars.

## Decided

1. Small counts are hidden: a count of 1 to 4 shows as "<5", the same
   rule as on Dashboard.
2. The mental health counts and "sesi konseling 30 hari terakhir" show
   only to Kepala Unit, Direktur and Ketua Program Studi, not to
   Pengelola Asrama or BAM roles as in the prototype.
3. The panels reuse the Dashboard panels' counting and small-count
   rules with a filter to dorm residents, so the numbers always agree.

## Steps

- [x] 1. The rights for the two panels and for the names on them are
  added to the permission list, with their checks.
- [x] 2. "Kesehatan jasmani penghuni" shows the counts and the table
  per dorm, with the small-count rules.
- [x] 3. The residents who need follow-up show to the allowed roles.
- [ ] 4. "Kesehatan mental penghuni" shows the anonymous count with
  the rules of 5, to the three roles only.
- [ ] 5. Data shared by a counsellor shows to the role it was shared
  with.
