# Shared counselling data for recipients

Depends on: Sharing a counselling summary, Mental health screening,
Mentor groups
Group: Penilaian

## What we want

Staff whom a student agreed to share with read what Konselor published
for them, on Penilaian > Kesehatan mental, under "Data yang
dipublikasikan untuk Anda". They see only students published to their
role, within their own rows, and only while the sharing is still on.

## Who it is for

- Read only: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi
  (their program only) and Pengasuh (their own mentees only), each only
  for students where their role was named as recipient.
- Everyone else, and these roles for any other student: nothing.

## What should happen

- When one of these roles opens Penilaian > Kesehatan mental, then they
  see the note that personal data shows only when Konselor publishes it
  with the student's consent and that session notes are never shared,
  the number "Dipublikasikan untuk Anda", the campus-wide number "Sesi
  konseling 30 hari" (no names; a count of 1 to 4 shows as "<5"), and
  the list. These are the same four roles that Mental health screening
  gives the campus count to; no other role gets either number.
- When a student's data is published to their role and in their rows,
  then the list shows name, NIM, program studi, Pengasuh, "Data yang
  dibagikan" and the date published.
- When they press "Rincian", then they see only what the student agreed
  to: for "Status konseling" the number of sessions, the last date, the
  follow-up and the next session; for "Ringkasan konselor" the summary;
  and "Dipublikasikan (name) pada (date) dengan persetujuan mahasiswa.
  Gunakan hanya untuk keperluan pendampingan dan jangan disebarluaskan."
- When nothing is published for them, then the list says "Belum ada data
  kesehatan mental yang dipublikasikan untuk Anda" ("untuk anak asuh
  Anda" for Pengasuh).
- When Ketua Program Studi is a recipient for a student of another
  program, or Pengasuh for a student who is no longer their mentee, then
  that student is not listed. Confirmed by a check.
- When the sharing is withdrawn by either side, then the student is gone
  from the list on the next load, and an open "Rincian" asked again is
  refused with a message.
- When Penilai Mahasiswa, Pegawai UPK, Pengelola Asrama, a BAM role or a
  role not named as recipient sends a hand-made request for a student's
  shared data, or a recipient sends one for a student outside their rows
  or for data the student did not agree to share, then the server
  refuses it. Confirmed by a check.
- When a recipient opens the list or "Rincian", then session notes, the
  student's story, schedules, Topik and consent details are never sent
  to the browser. Confirmed by a check.
- When a recipient opens "Rincian", then that reading is logged: who,
  whose data and when, never the content. Confirmed by a check.
- When opened on a phone, then each row becomes a card with no sideways
  scroll.
- When the list is long, then it loads 20 at a time and shows within
  about 1 second on the preview.

## Not included

- Konselor's own view of Kesehatan mental and the screening, its level
  and its advice (Mental health screening, Sharing the screening level).
- The same data on Beranda (Dashboard mental health) and on a student's
  detail page (Scores in the student detail).
- Pengelola Asrama and BAM as recipients.

## Better than the prototype

- A campus-wide count of 1 to 4 shows as "<5", so a small number cannot
  point to a person; the server sends no smaller number.
- The server sends only the parts the student agreed to, instead of
  hiding the rest on screen.
- The list is paged.

## Decided

1. Mental health screening already built the tab Kesehatan mental for
   these four roles, with "Sudah diasesmen" and the note; this spec adds
   its part to it.
2. Each opening of "Rincian" is logged: who, whose data, which sharing
   and when, never the content.
3. Only the recipients get the two numbers and the list.

## Decisions

1. One right, "view shared counselling data", is added to the four
   roles. It gives both the list and "Sesi konseling 30 hari", so no
   other role gets either; a check keeps it on the same roles as the
   campus count of Mental health screening.
2. A person with several of these roles sees a student when at least one
   of their roles is named on the sharing and the student is in that
   role's own rows. A role that is not named adds no student, however
   many it sees elsewhere.
3. Pengasuh's own mentees are the members of the groups they hold today,
   as everywhere else in the app; a student whose group they no longer
   hold is not listed.
4. An account never sees its own data here, as with the screenings.
5. "Sesi konseling 30 hari" counts the counselling sessions held from 30
   days before today up to today, of every student who is not removed,
   as in the prototype. A count of 1 to 4 is sent as "<5" only.
6. "Dipublikasikan untuk Anda" is the number of students in the list. Its
   line says "anak asuh" when Pengasuh is the person's only recipient
   role, "mahasiswa" otherwise; the empty list says "untuk anak asuh
   Anda" in the same case.
7. The list shows the newest published first, then by name, 20 at a
   time. "Data yang dibagikan" names the parts as "Status konseling" and
   "Ringkasan konselor", as in the prototype. There is no search or
   filter, as in the prototype.
8. "Status konseling" in "Rincian" is read when it is opened, so it shows
   sessions written after publishing too: what the student agreed to
   share is the state of their counselling. "Sesi berikutnya" shows only
   while it is today or later, as on the student's own page.
9. There is no request for one part of the data: the server sends only
   the parts on the sharing, and nothing of a part not shared.
10. A "Rincian" asked for a student whose sharing is no longer published
    for this person says "Data ini tidak lagi dibagikan untuk Anda. Muat
    ulang halaman untuk melihat daftar terbaru."
11. The log of readings cannot be changed or deleted; the database
    refuses it, as for the other counselling logs.
12. Sample data has a published sharing to each of the four roles:
    Bayu Santoso's to Pengasuh and Ketua Program Studi of another
    program (so it shows to Pengasuh only), and a new one of Nanda
    Gunawan of D3 Pajak to all four, which his Pengasuh of today sees and
    his Pengasuh before does not.

## Steps

- [x] 1. The right to read shared counselling data is added for the four
  roles, limited by recipient, rows and current sharing, with its
  checks.
- [x] 2. "Data yang dipublikasikan untuk Anda" shows the note, the
  numbers and the list, with its empty state.
- [ ] 3. "Rincian" shows only the shared parts, and each opening is
  logged.
