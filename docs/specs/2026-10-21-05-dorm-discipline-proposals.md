# Discipline proposal after SP 2

Depends on: Dorm warning letters, Recording a discipline penalty
Group: Asrama

## What we want

When Pengelola Asrama issues SP 2, the proposal for a discipline
punishment reaches Kepala Unit on the tab Pelanggaran. Kepala Unit reads
the case, writes what will be done and marks it as being handled.
Pengelola Asrama and the resident can see that it was picked up.

## Who it is for

- Handle: Kepala Unit.
- Read only: Pengelola Asrama.
- Mahasiswa who live in the dorm, for their own.

## What should happen

- When Kepala Unit opens Pelanggaran, then they see "Pengajuan hukuman
  disiplin dari Pengelola Asrama" with one row per proposal: the student
  and semester, the number of violations, the date and result of the SP
  2 clarification, the note and date of the proposal, and the status
  Diajukan. With none it says "Belum ada pengajuan hukuman disiplin."
- When they fill "Catatan tindak lanjut", press "Proses" and confirm,
  then the row shows Diproses with the note, who and when.
- When they press "Proses" with an empty note, then it is refused with a
  message.
- When they press "Catat hukuman disiplin" on a row, then Pelanggaran
  disiplin on Pembinaan opens with that student already picked.
- When Pengelola Asrama opens the tab, then they see the same rows and
  statuses, without the field and the button.
- When the resident opens Pelanggaran after SP 2, then they see that a
  discipline punishment was proposed to Kepala Unit and whether it is
  Diajukan or Diproses, without the notes.
- When a BAM role, Direktur, Ketua Program Studi or another resident asks
  for the proposals, or anyone but Kepala Unit sends a hand-made
  "Proses", then the server refuses it. Confirmed by a check.
- When "Proses" is pressed twice, then the status changes once and the
  first note is kept. It adds a line to the change log. Confirmed by a
  check.
- When Kepala Unit opens the list on a phone, then each proposal is a
  card with no sideways scroll.
- When the tab opens on the preview, then the list shows within about 1
  second, and it is paged.

## Not included

- Recording the discipline punishment itself: that is done on Pembinaan
  (Recording a discipline penalty). Only the button that leads there is
  added here.
- Sending a proposal back to Pengelola Asrama.

## Better than the prototype

- A note is required; the prototype fills in "Diproses Kepala UPK" when
  it is left empty.
- "Proses" asks for confirmation, as it cannot be undone.
- BAM roles no longer see the proposals; the prototype shows them to
  every role on the tab once there is one.
- The resident sees the status of their own proposal.

## Decided

1. The status does not follow the punishment recorded on Pembinaan, and
   that punishment does not show which SP 2 it came from: there is no
   link between the two records for now, as in the prototype. Kepala
   Unit marks the proposal by hand.
2. Pembina Disiplin Mahasiswa does not see or handle these proposals;
   Kepala Unit passes the case on through Pembinaan.
3. Kepala Unit may not decline a proposal in this work; the note says
   what was decided.

Decided while building, because the issue did not say:

4. "Catatan tindak lanjut" holds 5 to 1,000 letters, not counting spaces
   around it, as Uraian on Pelanggaran disiplin starts at 5.
5. The handling is kept on the SP 2 itself: its note, who and when. The
   status has no field of its own: a proposal is Diproses once it has
   them, and Diajukan until then. The database lets only these three be
   set, once and together, on an issued SP 2; nothing else of an issued
   SP changes.
6. One new right, "Menindaklanjuti pengajuan hukuman disiplin dari
   Pengelola Asrama", for Kepala Unit only. The list is read with the
   right to read Hasil klarifikasi and the proposal note, which only
   Pengelola Asrama and Kepala Unit have; its title now adds "dan
   tindak lanjutnya". No other role gains anything.
7. The list holds every SP 2 of every semester, the latest first, 20 a
   page. "Pelanggaran" counts the violations of that semester that went
   up to Pengelola Asrama and still count, as the prototype does. The
   date of the clarification is the day of the call, or the day of the
   SP when it was issued without one.
8. The panel sits above "Panggilan klarifikasi dan surat peringatan", as
   in the prototype.
9. "Catat hukuman disiplin" shows on every row, Diajukan or Diproses, to
   an account that may record discipline penalties, which among these
   readers is Kepala Unit only; the prototype shows it on Diajukan rows
   only. For a student no longer Aktif, Pembinaan opens with nobody
   picked, as with "Hukuman ringan".
10. Kepala Unit does not handle the proposal about their own student
    account, as Pengelola Asrama does not process their own call: that
    row has no field, and the server refuses it.
11. A second "Proses" of a proposal already Diproses changes nothing and
    adds no line; it says the proposal was already processed.
12. The resident reads the status under "Anda menerima Surat Peringatan
    2", for the running semester, as the rest of their SP boxes.
13. Sample data: the resident given SP 2 three days ago stays Diajukan.
    One more sample resident has 12 counted violations, SP 1 eighteen
    days ago and SP 2 seven days ago, with a proposal note, and the
    proposal Diproses by the sample Kepala Unit five days ago at 10:00.

## Steps

- [x] 1. The handling fields (status, note, who, when) are added to the
  SP 2 proposal, with a sample proposal Diajukan and one Diproses.
- [x] 2. The right to handle a proposal is added to the permission list,
  with its checks.
- [ ] 3. Kepala Unit sees the proposals and marks one Diproses.
- [ ] 4. The button "Catat hukuman disiplin" opens Pembinaan on that
  student.
- [ ] 5. Pengelola Asrama and the resident see the status.
