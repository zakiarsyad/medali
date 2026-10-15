# My tasks: warning letters and violations to watch

Depends on: My tasks: leave and return reports, Dorm violation appeals, Dorm warning letters, Academic period
Group: Tugas saya

## What we want

Tugas saya gains its last section for Pengelola Asrama: residents who
now meet the rule for a surat peringatan (SP), from dorm violations or
rejected clarifications. The letter itself is still made on Asrama >
Pelanggaran; this page lists who is due and takes them there. It also
points out advokasi that wait for BAM.

## Who it is for

- Pengelola Asrama only.

## What should happen

- When Pengelola Asrama opens Tugas saya, then a number card "Penetapan
  SP" shows and counts toward the number in the menu.
- When they look at "Penetapan SP", then each row shows the student with
  NIM and room, "Penetapan" (which SP is due and the one they hold now),
  the number of Pelanggaran and of Klarifikasi ditolak this semester.
- When they press "Proses" on a row, then Asrama > Pelanggaran opens
  with the SP form for that student ready and in view.
- When the SP is set there and they come back, then the student is gone
  from the section and the numbers went down.
- When nobody is due, then the section shows "Beres" and "Tidak ada yang
  menunggu."
- When advokasi wait for BAM's decision, then the box "Perlu dipantau"
  adds "(n) advokasi pelanggaran menunggu keputusan BAM" with a link to
  Pelanggaran. It does not count toward the number in the menu.
- When a violation is taken off after an accepted advokasi, then a
  student who no longer meets the rule leaves the section. Confirmed by
  a check.
- When more than 20 students are due, then 20 show, the highest SP
  first, with "Lihat semua di Pelanggaran".
- When any other role asks for this list by a hand-made request, then it
  is refused. Confirmed by a check.
- When the page is opened on a phone, then each row is a card with
  "Proses" at the bottom and no sideways scroll.

## Not included

- The rule that decides when an SP is due, and setting the SP: both
  belong to "Dorm warning letters".
- Deciding an advokasi: that is BAM's.

## Better than the prototype

- "Proses" opens the form through the page address, so it also works
  after a refresh or from a shared link; the prototype relies on a timed
  scroll that can miss.
- The list is worked out by the same rule as on Pelanggaran, in one
  place, so the two never disagree.
- The order is fixed (highest SP first) instead of the order of the
  student list.

## Decided

1. The SP is not set directly on Tugas saya. "Proses" takes the owner to
   Pelanggaran, where the form has the student's violations beside it.
2. The running semester and its start come from "Academic period"; this
   spec has no rule of its own.

## Decisions made while building

1. "Penetapan SP" holds every student the account may see through its
   right to issue SPs who is due for one, as "Panggilan klarifikasi dan
   surat peringatan" on Pelanggaran does, also one who no longer lives
   in the dorm: the two lists never disagree.
2. The account's own student is left out of the list and of the number,
   as their row on Pelanggaran has no "Proses": another Pengelola Asrama
   sets their SP.
3. Students due for the same SP are in the order of their name. The
   section shows 20 at most, as the other sections do.
4. "Perlu dipantau" counts every advokasi that waits for BAM among the
   students the account may see on Pelanggaran, as the number "Dalam
   masa advokasi" there does for BAM.
5. The number beside Tugas saya is worked out again right after an SP is
   issued on Pelanggaran. A student who becomes due as time passes, or
   by a decision of BAM, shows the next time a page is loaded.

## Steps

- [x] 1. The server adds students due for an SP to the count and reads
  the list, with its checks.
- [x] 2. The section "Penetapan SP" with "Proses" opening the form on
  Pelanggaran.
- [x] 3. The number card, and the advokasi line in "Perlu dipantau".
- [x] 4. Phone layout for the section.
