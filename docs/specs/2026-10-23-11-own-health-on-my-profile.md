# My health on my profile

Depends on: My profile, Fitness test scores, Health notes, Mental health
screening, Counselling consent, Counselling schedule changes and outcome,
Counselling session notes, Sharing a counselling summary, Sharing the
screening level
Group: Profil saya

## What we want

A student sees their own health records on Profil saya: the fitness test
and health notes, and the mental health screening with where they stand
with counselling. These are the most sensitive records in the app, so
only the student sees this view, and it always shows where to get help.

## Who it is for

- Mahasiswa: their own records only.

## What should happen

- When a student opens Profil saya, then "Kesehatan jasmani" shows their
  final category, "Skor tes kebugaran (year)" and "Tanggal tes", or "Belum
  mengikuti tes kebugaran."
- When a health note exists, then "Catatan kesehatan" shows its text,
  whoever wrote it, with the line "Catatan kesehatan Anda juga dapat
  dibaca pengasuh Anda dan petugas yang berwenang, untuk keselamatan
  dalam kegiatan." (Health notes and Dorm health notes name those
  roles.)
- When they have been screened, then "Kesehatan mental" shows the level,
  "Asesmen (instrument) pada (date). Rekomendasi: (…)", at every level,
  as in the prototype. Otherwise: "Belum ada asesmen kesehatan mental."
- When they look further down the card, then it shows "Persetujuan
  konseling" (its status or "Belum diminta"), "Sesi konseling" as "(n)
  sesi, terakhir (date)" or "Belum ada", and "Sesi berikutnya" when one
  is planned. What was said in a session is never shown.
- When a consent or a request to share their data waits for an answer,
  then a notice says so with the button "Buka Konseling", where they
  answer it.
- When their data is shared, then the card says with whom and what, and
  points to Konseling to withdraw.
- When they read the card, then it always ends with "Butuh bicara dengan
  seseorang sekarang? Hubungi konselor kampus atau orang yang Anda
  percaya. Dalam keadaan darurat, hubungi 119." When the setting
  "Kontak konseling kampus" is filled in, then its text shows after
  that line; while it is empty, nothing more shows. Confirmed by a
  check.
- When any other account, Kepala Unit and Konselor included, asks for
  this view of a student by a hand-made request, then it is refused;
  they use their own pages with their own limits. Confirmed by a check.
- When the page is read, then no session note, no "Risiko" mark, no
  "Catatan konselor (rahasia)" and no marker set by BAM - Kesehatan
  about possible mental health needs is sent to the browser. Confirmed
  by a check.
- When the page is opened on a phone, then both cards are one column
  with no sideways scroll.

## Not included

- Answering or withdrawing consent and sharing: they are on Konseling.
- Registering for counselling.
- Entering test results, health notes or screenings.
- A mark "sudah disampaikan" by Konselor before the level shows: the
  prototype has none.
- A screen to fill in "Kontak konseling kampus": it is a setting on the
  computer that runs the app, empty at the start.

## Better than the prototype

- Consent is answered in one place, Konseling; this page only points
  there. The prototype puts the buttons here and nowhere else.
- The help line shows even when there is no screening, and the level
  "Sangat berat" never shows without the advice and the help line.
- The server sends only the lines shown; the prototype keeps session
  records in the browser.

## Decided

1. A student reads their own screening level and recommendation here
   with no counsellor present, also at the heavier levels, always with
   the advice and the help line.
2. A student reads the health note written about them, including notes
   by BAM - Kesehatan, with the mark "berdasarkan catatan kesehatan"
   when the note made the category.
3. The emergency number stays 119. "Kontak konseling kampus" is an
   optional setting on the computer that runs the app, named in the
   example settings file; while it is empty, nothing more shows.
4. The student does not see the three DASS-21 scores: the level and the
   advice only.
5. When "Saya memiliki pikiran untuk menyakiti diri sendiri" was ticked,
   the student sees the advice of their level, not the crisis advice
   staff see: the crisis advice would give away the "Risiko" mark,
   which never reaches the browser. This is how a recipient of a
   sharing sees it too.
6. Two new rights in the list of what each role may do, given to
   Mahasiswa only: "Melihat kesehatan jasmani sendiri" (the fitness test
   and health note) and "Melihat kesehatan mental sendiri" (the
   screening, the consent, the sessions and the sharing). The page reads
   the signed-in student's own records only; nothing in the request says
   which student.
7. "Sesi konseling" and "Sesi berikutnya" come from the same summary the
   student already sees on Konseling.
8. The shared data shows while a sharing is approved or published, with
   its recipients and what it holds, the same words as on Konseling.
9. Both cards show for every student who may open Profil saya, whatever
   their status: they are the student's own records.
10. The two cards sit after "Riwayat per semester", "Kesehatan jasmani"
    first, as in the prototype.

Decided while building, because the issue did not say:

11. "Kontak konseling kampus" shows as "Kontak konseling kampus: (its
    text)", right after the help line. It is also named in the example
    settings file of the campus server package and in the hosting notes.
12. "Persetujuan konseling", "Sesi konseling" and "Sesi berikutnya" show
    also while a request waits; the notice comes under them, and the
    help line under the notices, so it still ends the card.
13. A shared line says with whom and what, as on Konseling, without the
    summary Konselor wrote for the recipients: that stays on Konseling,
    with the rest of the sharing.
14. The days of "Sesi konseling" and "Sesi berikutnya" are written as on
    Konseling, such as "19 Okt 2026".

## Steps

- [x] 1. The rights to read one's own fitness, health note, screening
  and counselling status are added to the permission list, with their
  checks.
- [x] 2. The card "Kesehatan jasmani".
- [x] 3. The card "Kesehatan mental" with screening, counselling status,
  the help line and the campus contact setting.
- [x] 4. The notices for a waiting consent or sharing request, with
  "Buka Konseling".
- [x] 5. Phone layout for both cards.
