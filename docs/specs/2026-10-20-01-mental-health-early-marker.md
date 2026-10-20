# Mental health early marker

Depends on: Dorm health notes, Mentor groups
Group: Asrama

## What we want

On Kesehatan, the health form gets the part "Potensi kesehatan mental":
an early mark based on what was seen in the dorm, not a diagnosis. It
says whether a resident needs watching or should be referred to a
counsellor, with a confidential observation. It is the most sensitive
record on the Asrama page, so only five roles ever see it.

## Who it is for

- Write: BAM - Kesehatan and Kepala Unit, for residents of every dorm,
  as in the prototype.
- Read: Pengelola Asrama and Pengasuh (their own mentees only).
- Konselor reads it on their own referral list, outside Asrama (Dorm
  referrals for Konselor).

## What should happen

- When a writer picks a student in the health form, then they see
  "Potensi kesehatan mental" with a note that it is not a diagnosis and
  who can see it, "Kategori potensi" (Tidak ada indikasi, Potensi: perlu
  pemantauan, Potensi: perlu dirujuk ke konselor) and "Pengamatan
  (rahasia)". The student's current mark is filled in.
- When they pick a category and press "Simpan catatan", then the mark
  is saved even with no illness or note, and a message says so.
- When they pick "Potensi: perlu dirujuk ke konselor" and leave
  "Pengamatan (rahasia)" empty, then nothing is saved and the message
  says "Isi pengamatan untuk rujukan ke konselor."
- When they set it back to "Tidak ada indikasi" and save, then the mark
  and the observation no longer show.
- When one of the four roles opens Kesehatan, then they see the number
  "Potensi kesehatan mental" with how many should be referred, the
  filter choice "Potensi kesehatan mental", and in the list the mark
  and "Pengamatan" for each marked resident. A resident with a mark and
  no illness is in the list.
- When BAM - BPHK, Direktur or Ketua Program Studi opens Kesehatan,
  then nothing about the mark shows: no number, no filter choice, no
  badge, and a resident who has only a mark is not in their list or
  their numbers.
- When Pengasuh opens it, then they see marks of their own mentees
  only.
- When the resident themselves, any other BAM role, or one of the three
  roles above asks for a mark by hand, or filters or sorts by it, then
  the server gives nothing back. When a read-only role sends a
  hand-made mark, then the server refuses it. Confirmed by a check.
- When two writers save a mark for the same student, then the later
  one counts; a student has one current mark. Every change adds a line
  to the change log with who, when and the value before and after,
  readable by Kepala Unit only. Confirmed by a check.
- When the mark is filled on a phone, then it fits one column.
- When the tab opens on the preview, then it still shows within about 1
  second.

## Not included

- The counsellor's referral list and what the counsellor does with a
  mark (Dorm referrals for Konselor, Mental health screening).
- The mark on any dashboard, export or student profile.
- Marks for students outside the dorm.

## Better than the prototype

- The server leaves the mark out for roles that may not see it; the
  prototype sends it to every browser and hides it on screen.
- Counts and filters cannot be used to guess who has a mark.
- Changes are logged, so it is known who marked a student.
- An observation is required for "perlu dirujuk ke konselor", so the
  counsellor has something to start from.

## Decided

1. BAM - Kesehatan is a student, and may still write a mental health
   mark and observation about another student, as in the prototype,
   for residents of every dorm.
2. The resident is not told or asked for consent before the mark is
   shared with Pengasuh and Konselor, as in the prototype: it is an
   observation and not counselling data. The counsellor then follows the
   consent rules of Counselling consent.
3. The resident never sees their own mark.
4. A mark is cleared only by a writer, by hand; it does not expire.
5. "The four roles" are Kepala Unit, BAM - Kesehatan, Pengelola Asrama
   and Pengasuh. Konselor gets no right yet; Dorm referrals for
   Konselor adds it.
6. A student has one mark row. "Tidak ada indikasi" keeps the row with
   no category and no observation, so who cleared it and when stays
   known. The marks and their log cannot be deleted; the log cannot be
   changed.
7. The log has a line per real change, with who, when, and the category
   and observation before and after. A save that changes nothing, or a
   second press, adds no line. Kepala Unit reads it through the server
   only: the app has no change-log screen.
8. "Pengamatan (rahasia)" holds at most 500 characters. It is closed
   while "Tidak ada indikasi" is chosen, and any text sent with it is
   dropped.
9. A save with a changed mark and an empty note part saves only the
   mark, with the message "Penanda potensi kesehatan mental (nama)
   disimpan." A note is kept when the note part holds something and
   differs from the latest note, or when the mark did not change. With
   both, the note message is followed by "Penanda potensi kesehatan
   mental juga disimpan."
10. The mark changes only when the writer changed it in the form. A
    form opened before another writer's change does not put the old
    mark back when only a note is saved.
11. A writer, or a reader, who is a student never sees their own mark:
    not in the list, the numbers, the filter or the form, and may not
    save a mark for themselves.
12. The line under "Potensi kesehatan mental" names only who sees the
    mark today, not Konselor, as the referral list is not built yet.
13. For the four roles, a resident who has only a mark is listed and
    counted in "Sakit atau punya riwayat penyakit" and in the category
    numbers, as in the prototype. The filter choice "Potensi kesehatan
    mental" sits in the "Riwayat penyakit" filter; the server ignores
    it for every other role.

## Steps

- [x] 1. The table for the mark is added, with sample marks of both
  kinds.
- [x] 2. The rights to write and to read the mark are added to the
  permission list, with checks for every refused role.
- [x] 3. Writers set, change and clear the mark in the health form;
  a referral without an observation is refused.
- [x] 4. The number, the filter choice, the badge and the observation
  show to the four roles only.
- [x] 5. Pengasuh sees marks of their own mentees only.
