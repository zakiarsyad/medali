# Dorm warning letters

Depends on: Dorm violation appeals, Dorm attendance clarification, Academic period
Group: Asrama

## What we want

A resident who reaches 7 counted violations in a semester, or whose
attendance clarification is rejected, is called to explain and gets
Surat Peringatan (SP) 1. After SP 1, 5 more violations or another
rejected clarification leads to SP 2 and a proposal for a discipline
punishment to Kepala Unit. Pengelola Asrama schedules the call, records
what was said and issues the SP. The resident sees all of it.

## Who it is for

- Schedule, record and issue: Pengelola Asrama.
- Read only: Kepala Unit and the BAM roles that see Pelanggaran. They
  see who is called, why, the schedule and the mark "SP 1" or "SP 2",
  as in the prototype. "Hasil klarifikasi" shows only to Pengelola
  Asrama, Kepala Unit and the resident.
- Mahasiswa who live in the dorm, for their own.

## What should happen

- When a resident has 7 violations at Naik ke Pengelola in the semester,
  or one rejected dorm attendance clarification, then they show under
  "Panggilan klarifikasi dan surat peringatan" with "Penetapan SP 1" and
  the cause. After SP 1, 12 violations in all or a second rejected
  clarification shows "Penetapan SP 2". A clarification rejected by BAM
  or by Pengelola Asrama counts, as in the prototype, and only the
  latest decision per activity. The semester is the one "Academic
  period" gives.
- When Pengelola Asrama presses "Proses", then they see the rejected
  clarifications, the counted violations and two parts: "1. Jadwalkan
  klarifikasi" (Tanggal, Jam, Tempat, with "Kantor Pengelola Asrama" to
  start with) and "2. Catat klarifikasi dan terbitkan SP".
- When they press "Kirim panggilan", then the row shows the schedule and
  the button becomes "Ubah jadwal". An empty field or a past date is
  refused.
- When they fill "Hasil klarifikasi" with 10 letters or more, press
  "Terbitkan SP 1" and confirm, then the resident shows the mark "SP 1"
  and leaves the list of calls.
- When they press "Terbitkan SP 2 dan ajukan hukuman disiplin" and
  confirm, then the resident shows "SP 2" and a proposal is saved for
  Kepala Unit with "Catatan pengajuan hukuman disiplin ke Kepala UPK".
- When staff open the tab, then the number "Panggilan klarifikasi aktif"
  shows with how many residents already have an SP. With no call it
  says "Tidak ada panggilan klarifikasi aktif."
- When the resident opens Pelanggaran, then they see "Menuju panggilan
  SP 1" or "Menuju SP 2" with the count, the box "Penetapan SP" with the
  cause and the schedule or "Pengelola Asrama akan menjadwalkan
  klarifikasi.", and "Anda menerima Surat Peringatan" with the date and
  the result.
- When Pengelola Asrama, Kepala Unit, BAM - BPHK or BAM - KI opens
  Klarifikasi kehadiran, then the panel "Klarifikasi ditolak dan
  penetapan SP" lists the residents with a rejected clarification and
  their SP status. Direktur and Ketua Program Studi do not get the
  panel, also by a hand-made request. The resident sees the same
  warning for themselves on Kegiatan asrama.
- When a rejected clarification is later accepted, then it no longer
  counts toward an SP, and a resident who no longer meets the rule
  leaves the list of calls. An SP that was already issued stays.
  Confirmed by a check.
- When any role but Pengelola Asrama sends a hand-made schedule or SP,
  or a resident asks for another's SP, then the server refuses it.
  Confirmed by a check.
- When "Terbitkan SP" is pressed twice, then one SP is saved: a resident
  has at most one SP 1 and one SP 2 per semester, kept by the database.
  Every schedule and SP adds a line to the change log. Confirmed by a
  check.
- When Pengelola Asrama uses the form on a phone, then it fits one
  column with no sideways scroll.
- When the tab opens on the preview, then it shows within about 1
  second, and the list of calls is paged.

## Not included

- Reducing violations inside the form (Dorm violation reductions).
- What Kepala Unit does with the proposal (Discipline proposal after
  SP 2), and the punishment itself, which belongs to Pembinaan.
- A printed letter.
- Withdrawing an SP that was issued.
- The 7 and the 5 more violations are the prototype's values, to be
  confirmed by the campus before launch.

## Better than the prototype

- Issuing an SP asks for confirmation, as it cannot be undone.
- The call cannot be scheduled in the past.
- One SP per level and semester is kept by the database, not by luck.
- The clarifications panel is paged instead of cut off at 30.

## Decided

1. The SP is not a letter to print or download: the app records it
   only.
2. An SP may be issued without the resident showing up to the call,
   with that written in "Hasil klarifikasi".
3. An SP stays when violations are reduced, or a rejected clarification
   is later accepted, after it was issued, as in the prototype; the
   cause no longer counts toward the next SP. Withdrawing an SP is not
   included.
4. The counts start again each semester, including the SP level, as in
   the prototype.

Decided while building, because the issue did not say:

5. Tempat holds 3 to 100 letters, Hasil klarifikasi 10 to 1,000 and
   "Catatan pengajuan hukuman disiplin ke Kepala UPK" at most 1,000, not
   counting spaces around them. The note may be left empty, as in the
   prototype.
6. Sample data, in the running period, of the three sample residents by
   name after the 24 the sample violations are spread over: the first
   has 7 counted violations and is called for tomorrow at 16:00 in
   Kantor Pengelola Asrama; the second has 8 and was given SP 1 ten days
   ago; the third has 12 and was given SP 1 fourteen days ago and SP 2
   three days ago, with a proposal note. Each call was sent two days
   before it was held, or an hour ago for the one still to come, and
   each SP was issued at 16:30 on the day of its call, all by the sample
   Pengelola Asrama. The sample clarifications rejected by BAM and by
   Pengelola Asrama call their two residents for SP 1, not scheduled
   yet.
7. An issued SP cannot be changed, and a call or SP cannot be deleted
   once it has a line in the log; the database refuses both. Each line
   keeps who, when, and the schedule after it.
8. Two new rights: scheduling calls and issuing SPs ("Menjadwalkan
   panggilan klarifikasi dan menerbitkan surat peringatan asrama") for
   Pengelola Asrama only, and reading Hasil klarifikasi with the
   proposal note ("Membaca hasil klarifikasi surat peringatan asrama dan
   catatan pengajuan hukuman disiplin") for Pengelola Asrama and Kepala
   Unit only. The list of calls is read with the right to see
   Pelanggaran, and a resident's own call and SP with the right to see
   their own violations, so no other role gains anything.

## Steps

- [x] 1. The table for calls and SPs is added, with a sample resident
  called, one with SP 1 and one with SP 2.
- [x] 2. The right to issue an SP is added to the permission list, with
  its checks.
- [ ] 3. The list of calls shows who must be called and why.
- [ ] 4. Pengelola Asrama schedules and changes the call.
- [ ] 5. Pengelola Asrama records the result and issues SP 1 or SP 2
  with the proposal.
- [ ] 6. Residents see their count, call and SP.
- [ ] 7. The panel on Klarifikasi kehadiran and the warning on Kegiatan
  asrama are added.
