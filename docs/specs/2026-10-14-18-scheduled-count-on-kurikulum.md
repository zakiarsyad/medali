# Scheduled count on Kurikulum

Depends on: PPKS activity schedule, Extra activity schedule, Special and additional activities
Group: Kurikulum

## What we want

The two activity tables on Kurikulum get the column "Dijadwalkan", as in
the prototype: how many times each activity has been put on the calendar
in Kegiatan karakter. Removing an activity that is already scheduled
warns first. This closes the part the earlier Kurikulum specs left out
because no schedule existed yet.

## Who it is for

- Read: Kepala Unit, Pegawai UPK, Direktur / Wakil Direktur, Ketua
  Program Studi and Pengasuh.
- Remove an activity: Kepala Unit and Pegawai UPK, as today.

## What should happen

- When any of the five roles opens Kurikulum, then Program kegiatan PPKS
  and Kegiatan khusus dan tambahan each show the column "Dijadwalkan"
  with "(n)×" per activity, and "0×" when it was never scheduled.
- When a schedule for an activity is added or removed in Kegiatan
  karakter, then the number on Kurikulum follows on the next load.
  Removed schedules are not counted.
- When Kepala Unit or Pegawai UPK presses "Hapus" on an activity that is
  scheduled, then the confirm says "Kegiatan ini sudah dijadwalkan (n)
  kali. Tetap hapus dari daftar? Jadwal yang ada tidak ikut terhapus." On
  yes the activity leaves the list and its schedules stay, still showing
  its name.
- When a schedule is added by someone else between opening the form and
  pressing "Hapus", then the confirm shows the number as it is at that
  moment. Confirmed by a check.
- When a read-only role looks at the tables, then the column shows and
  nothing else changes for them.
- When a role without the Kurikulum menu sends a hand-made request for
  the counts, then the server refuses it. Confirmed by a check.
- When the page is opened on a phone, then the count shows inside each
  activity's block with no sideways scroll.
- When the page opens on the preview with sample data, then it still
  shows within about 1 second; the counts are worked out by the database
  in one go, not one activity at a time.

## Not included

- Making, changing or removing schedules (Kegiatan karakter).
- Counting attendance or participants per schedule.
- A link from the number to Kegiatan karakter; the prototype has none.

## Better than the prototype

- The removal warning uses the count at the moment of removal, not the
  one from when the page was loaded.

## Decided

1. The count covers every semester ever, as in the prototype.
2. Ketua Program Studi and Pengasuh see the campus-wide count, since it
   is a plain count with no names.
3. Nothing here needs the running semester; the count covers every
   period, so this spec reads no semester.

## Decisions made while building

The issue did not say, so these were decided:

4. Already met before this work: removing an activity only marks it as
   removed, so its schedules stay and Kegiatan karakter still shows them
   with its name. "Urungkan" brings it back with its count.
5. Every schedule that is not removed counts, whether it is over, running
   or still to come, and also when its activity is "tidak wajib". A
   schedule removed with "Hapus jadwal" does not count.
6. The count on the page is read together with the activities, in the
   same one question to the database. Only someone who may open
   Kurikulum gets the page at all.
7. The number in the removal warning is asked from the server at the
   moment "Hapus" is pressed. Only a role that may manage activities,
   Kepala Unit and Pegawai UPK, may ask it, as only they see "Hapus";
   any other role, with or without the Kurikulum menu, is refused.
8. When the number cannot be asked, the activity is not removed and the
   form says why, so nobody removes a scheduled activity without the
   warning.
9. When the activity has no schedule, the question is the one asked
   today: 'Hapus kegiatan "(name)" dari daftar?'.
10. On a phone the count is one more line in each activity's block,
    titled "Dijadwalkan", like "Target peserta".

## Steps

- [ ] 1. Both tables show "Dijadwalkan" with the count per activity.
- [ ] 2. "Hapus" warns with the live count when the activity is
  scheduled.
