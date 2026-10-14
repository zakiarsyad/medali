# Dorm activities

Depends on: Dorm residents and rooms
Group: Asrama

## What we want

The tab Kegiatan asrama gets its schedule. Pengelola Asrama sets
activities that repeat (rutin: every day, some days of the week, or one
date a month) and one-off activities (non rutin), and marks days when a
repeating activity does not take place. Staff see the daily schedule;
residents see what is on today and next.

## Who it is for

- Change: Pengelola Asrama.
- Read only: Kepala Unit, Direktur / Wakil Direktur, Ketua Program Studi
  (their study program only) and every BAM role.
- Mahasiswa who live in the dorm, for the activities of their group.

## What should happen

- When staff open Kegiatan asrama, then they see the switch Jadwal
  harian, Kegiatan rutin and Kegiatan non rutin. Jadwal harian shows one
  date, with ‹ and › to move a day, and each activity with Waktu,
  Kegiatan (Rutin or Non rutin, category, location), Penanggung jawab,
  Peserta with the count, and its state: Akan datang, "Hari ini, belum
  dimulai", Berlangsung or Selesai.
- When they press "Rincian", then the activity shows its penanggung
  jawab, peserta and rincian kegiatan (lines of time and activity).
- When they open Kegiatan rutin or Kegiatan non rutin, then they see
  every repeating activity with its Pola, Waktu, Berlaku and "Hari tanpa
  kegiatan", or every one-off activity with its Tanggal and Status.
- When Pengelola Asrama presses "Tambah kegiatan rutin", then the form
  has Nama kegiatan, Kategori, Lokasi, Pola pengulangan (Harian,
  Mingguan with Hari, Bulanan with Tanggal setiap bulan 1 to 28), Berlaku
  mulai, Berlaku sampai (opsional), Hari tanpa kegiatan rutin ini, Mulai,
  Selesai, Penanggung jawab (UPK, Pelatih, BAM), Nama penanggung jawab,
  Peserta (Semua penghuni, Penghuni putra, Penghuni putri, or one dorm),
  Wajib hadir and Rincian kegiatan. "Tambah kegiatan non rutin" has
  Tanggal instead of the pattern fields.
- When they press "Simpan kegiatan", then it appears on every date it
  takes place, and a message confirms it. A name under 3 letters, an end
  time not after the start, Berlaku sampai before Berlaku mulai, or
  Mingguan with no day is refused with a message.
- When they press "Ubah" and then "Simpan perubahan", then the dates of
  that activity from today on show the change. Dates before today keep
  what they showed, also after "Hapus kegiatan". Confirmed by a check.
- When they press "Tiada kegiatan" on one date of a repeating activity
  and confirm, then that date no longer shows it, and the date is listed
  under "Hari tanpa kegiatan" in Kegiatan rutin.
- When they press "Hapus kegiatan" and confirm, then it leaves the
  schedule, and "Urungkan" in the message brings it back. It is marked
  as removed, not erased. Confirmed by a check.
- When a resident opens Kegiatan asrama, then they see "Hari ini" as
  cards with time, location, penanggung jawab and rincian, and "Akan
  datang" with the next six. Only activities for their group show.
- When Pengasuh or a student who does not live in the dorm types the
  address of Kegiatan asrama, then it is refused. When a BAM role sends a
  hand-made change to an activity, then the server refuses it. Confirmed
  by a check.
- When two people save changes to the same activity, then the second
  save is refused with "Kegiatan sudah diubah orang lain. Muat ulang."
  "Simpan kegiatan" pressed twice saves one. Confirmed by a check.
- When a resident opens the tab on a phone, then the cards stack in one
  column, and the staff schedule shows each activity as a card, with no
  sideways scroll.
- When the tab is opened on the preview, then it shows within about 1
  second. The schedule shows one day; Kegiatan non rutin is paged.

## Not included

- Attendance, percentages and history (Dorm attendance).
- Leave covering an activity (Dorm leave requests).

## Better than the prototype

- Any date can be opened; the prototype only knows three weeks around
  today.
- Removing an activity can be undone from the message.
- An activity in progress says Berlangsung, not "Presensi dibuka", and
  one of today that has not started says "Hari ini, belum dimulai", not
  "Hari ini, belum dibuka". Both old labels are left over from attendance
  by photo.
- Berlaku sampai before Berlaku mulai is refused.
- Two people changing the same activity cannot overwrite each other.

## Decided

1. Changing or removing a repeating activity does not change its past
   dates. Past dates stay as they happened; only today and later change.

Decided while building, because the issue did not say:

2. A change takes effect from today. What the activity held until then
   is kept for the dates up to yesterday, and the change is kept from
   today on. A second change on the same day changes today's version
   again. The dates before today show the activity as it was then.
3. "Hapus kegiatan" marks the activity as removed, with who removed it,
   when, and today as the first date it no longer takes place. Nothing
   is erased, and the dates before today still show it. "Urungkan" in
   the message brings it back as it was. Only the person who removed it
   can bring it back this way, as on Kurikulum.
4. A one-off activity whose date has gone by stays as it was held: it
   offers no "Ubah", and a change or a removal sent by hand is refused.
   A change may not move a one-off activity to a date before today. A
   new activity may be added on any date, also a past one, as in the
   prototype.
5. A repeating activity stays repeating, and a one-off one stays
   one-off, when it is changed.
6. A date without the activity may be marked on any date, also a past
   one, with "Tiada kegiatan" or in the form, as in the prototype: it
   records that the activity did not take place then. It is the one way
   a past date changes. A marked date before today stays marked: the
   form shows it without a way to take it off, and a save keeps it
   whatever is sent. Only dates from today on can be taken off again. At
   most 100 marked dates may be today or later, in the form and with
   "Tiada kegiatan" alike; dates gone by do not count, so a long past
   never stops a save. One save of the form sends at most 100 dates:
   the marked dates from today on and those just marked in it. "Tiada
   kegiatan" is offered in Jadwal harian, on each repeating activity
   that is not removed. Marking a date counts as
   a change, so a form opened before it is told "Kegiatan sudah diubah
   orang lain. Muat ulang." and does not undo the mark.
7. On a past date, "Ubah" is offered only on an activity as it is now;
   one shown as it was before a later change has none.
8. A resident sees an activity when its Peserta is Semua penghuni, the
   residents of their sex (Penghuni putra or Penghuni putri), or the
   dorm they live in today, by the rule the app already uses for who
   lives in which dorm. A student who lives in no dorm is refused, and,
   as the Asrama page already does, a kakak pendamping who lives in no
   dorm has no Asrama menu.
9. The Peserta count is how many students live in those dorms today,
   whatever date is shown. Ketua Program Studi counts only the students
   of their own study program. It is a number and names nobody.
10. "Today" and "now" are campus time (WIB) by the server's clock, as on
    Kegiatan PPKS. An activity of a later date is Akan datang; on its
    date it is "Hari ini, belum dimulai" before its start, Berlangsung
    from its start up to and with its end minute, and Selesai after it.
    The Status in Kegiatan non rutin uses the same four states.
11. "Akan datang" shows the next six after today, at most a year ahead.
    Today's activities show only under "Hari ini".
12. Seeing the activities as a resident is a right of its own, held by
    Mahasiswa. Seeing the schedule is held by Kepala Unit, Direktur /
    Wakil Direktur, Ketua Program Studi, Pengelola Asrama and every BAM
    role; changing it by Pengelola Asrama only. A student who also holds
    a BAM role sees the staff schedule, which holds their own activities
    too.
13. "Simpan kegiatan" pressed twice saves one activity and answers both
    presses the same. The same form sent again with other content, or by
    another person, is refused and nothing is saved, as on Kegiatan
    PPKS.
14. Nama kegiatan is 3 to 100 characters; Lokasi and Nama penanggung
    jawab may be empty and are at most 100. An empty Lokasi shows "-".
    Rincian kegiatan holds at most 20 lines, and a line without an
    activity is left out.
15. A new activity starts on the date open in Jadwal harian, from 16:00
    to 17:30, Harian, for Semua penghuni, Wajib hadir, with UPK as
    penanggung jawab, as in the prototype.
16. Kegiatan rutin is one list, as there are few; Kegiatan non rutin
    shows 25 a page, the latest date first, as the prototype orders it.
17. Jadwal harian opens any date from the year 2000 to 2199; an address
    with another date opens today.
18. The messages follow the prototype: 'Kegiatan "(nama)" disimpan
    (setiap hari) untuk semua penghuni.', "Ditandai tidak ada kegiatan
    pada (tanggal).", and "Kegiatan dihapus." with "Urungkan", which
    answers "Kegiatan dikembalikan ke jadwal."

## Steps

- [x] 1. The tables for dorm activities and their days off are added,
  with sample repeating and one-off activities.
- [x] 2. The rights to see and to manage dorm activities are added to
  the permission list, with their checks.
- [x] 3. Jadwal harian, Kegiatan rutin and Kegiatan non rutin show the
  schedule with "Rincian", read only.
- [x] 4. The form adds and changes repeating and one-off activities;
  a change leaves past dates as they were.
- [x] 5. "Tiada kegiatan" and "Hapus kegiatan" with undo work.
- [x] 6. Residents see Hari ini and Akan datang.
