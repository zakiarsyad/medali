# Numbers on Verifikasi presensi that count only photos that still count

Depends on: nothing beyond what is merged
Group: Kegiatan
Kind: fix, found by "Audit: Kegiatan"

## What we want

The four numbers at the top of "Verifikasi presensi" count every photo card
in a status. So they count photos that count nowhere else: a photo of a
student taken out of a "Kegiatan tambahan", and a rejected photo the
student has already sent again. "Ditolak … perlu kirim ulang" then names
work that is not there. After this work the numbers count only the photos
that still count for the student.

Seen in "Audit: Kegiatan", on a local computer with sample data, as Pegawai
UPK:

- On a "Kegiatan tambahan", one student's photo was validated, one
  rejected and one left waiting; then all three were taken out of the
  participants. The waiting one still counted in "Menunggu verifikasi"
  (43, every waiting card), and the rejected one in "Ditolak … perlu kirim
  ulang" (33, every rejected card), though that student no longer sees the
  activity. Nothing on the cards says the student was taken out.
- The same "Ditolak" number counted an older rejection of a student who had
  already sent a new photo for that schedule.
- The extra-activity spec says the photo of a student taken out "counts in
  no number and no score, 'Menunggu verifikasi' included"; the
  verification spec says the numbers count the cards in that status. This
  work makes the two agree.

## Who it is for

Pegawai UPK, who reads the numbers to know what is left to do.

## What should happen

- "Menunggu verifikasi" counts the waiting cards of students the schedule
  is still meant for.
- "Ditolak" with "perlu kirim ulang" counts the rejected cards that are the
  student's newest attendance for that schedule, of students the schedule
  is still meant for. A rejection followed by a new photo, or by a record
  made by hand, is not counted.
- "Divalidasi hari ini" and "Kegiatan hari ini" stay as today.
- A card of a student the schedule is no longer meant for stays in the list
  under its status and can still be decided, and shows "Tidak lagi menjadi
  peserta" under the activity.
- The status filters and the line that counts "foto" below the heading stay
  as today.
- Confirmed by a check: a waiting card of a student taken out, and a
  rejected card followed by a new photo, are not counted.

## Not included

- The numbers on "Kegiatan PPKS" and the student's score after a PPKS
  schedule's dates change: they have their own issue, "Kegiatan: Changing
  a PPKS schedule after photos came in".
- Which cards the list shows.

## Decisions

1. Hide the card of a student taken out? No. The extra-activity spec says
   it stays in "Verifikasi presensi" and can still be decided; it only
   stops being counted.
2. The words on such a card: "Tidak lagi menjadi peserta", in the same
   small badge as "Di luar tanggal kegiatan", but grey, as it warns of
   nothing to do. It sits right under the name of the activity.
3. Which "meant for" rule? The one the student page already uses to choose
   a student's schedules, for PPKS and for "Kegiatan tambahan", in the form
   "Kegiatan PPKS" already counts its waiting photos with: an Aktif
   student of the schedule's semester, or an Aktif student a "Kegiatan
   tambahan" still names. A photo of a student on Cuti or Non aktif is
   then counted nowhere either, and its card says "Tidak lagi menjadi
   peserta" as well.
4. "Newest" follows the rule the student page already uses: by when the
   photo was sent, or for a record made by hand, when it was made.
5. "Menunggu verifikasi" here still counts a waiting photo of a schedule
   whose first day is after today, as the issue asks only for the "meant
   for" rule. Such a photo can only be there when a schedule was moved to
   later dates after photos came in.
6. "Divalidasi hari ini" still counts every card validated today, also of
   a student taken out, as the issue keeps it as today.

## Steps

- [ ] 1. The numbers count only photos that still count, and a card of a
  student taken out says so.
