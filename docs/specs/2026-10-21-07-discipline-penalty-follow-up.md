# Discipline penalty follow-up

Depends on: Recording a discipline penalty
Group: Pembinaan

## What we want

After a penalty is recorded, staff follow it to the end on "Pelanggaran
disiplin". They move its status from "Dijatuhkan" to "Sedang dijalani"
to "Selesai dijalani". For a suspended student who has an Instansi asal
(on study leave from an agency), they tick the five conditions to
continue study and record the decision.

## Who it is for

- Change: Pembina Disiplin Mahasiswa and Kepala Unit.
- Read only: Direktur / Wakil Direktur, Ketua Program Studi (their
  program only) and Pengasuh (their own mentees only).

## What should happen

- When Pembina Disiplin Mahasiswa looks at "Daftar pelanggaran", then
  each row has a status choice: "Dijatuhkan", "Sedang dijalani" or
  "Selesai dijalani". A penalty that ends the student's status for good
  shows "Ditetapkan" and cannot be changed.
- When they choose another status and confirm, then the row shows it,
  a message says "Status hukuman diperbarui", and "Kerja sosial belum
  selesai" counts only penalties with kerja sosial not yet "Selesai
  dijalani".
- When they open "Rincian" of a Berat jenjang pertama penalty of a
  student with an Instansi asal, then they see "Syarat melanjutkan
  studi (ayat 7)" with five ticks and "Keputusan": "Menunggu pemenuhan
  syarat", "Melanjutkan studi" or "Diberhentikan dengan hormat (ayat
  8)".
- When not all five are ticked, then "Melanjutkan studi" cannot be
  chosen, and a line says it opens once all are ticked. When a tick is
  taken away after "Melanjutkan studi" was chosen, then Keputusan goes
  back to "Menunggu pemenuhan syarat".
- When they choose a Keputusan and confirm, then a message says
  "Keputusan dicatat" and "Rincian" shows it.
- When a reading role opens the same "Rincian", then they see each
  condition as "Terpenuhi" or "Belum terpenuhi" and the Keputusan, with
  nothing to press, and the status as a label.
- When a student has no Instansi asal, or the penalty is not Berat
  jenjang pertama, then the conditions are not shown.
- When a reading role sends a hand-made status change, tick or
  Keputusan, or anyone sends "Melanjutkan studi" with a tick missing,
  or a change to a "Ditetapkan" penalty, then the server refuses it.
  Confirmed by a check.
- When two people change the same penalty at once, then the second is
  refused with a message and sees the current state. Confirmed by a
  check.
- When a status, tick or Keputusan changes, then a line goes to the log
  that cannot be changed: who, when, before and after. Confirmed by a
  check.
- When the list is used on a phone, then the status choice and the
  ticks are easy to press and nothing scrolls sideways.
- When a change is saved on the preview, then the row updates within
  about 1 second without loading the whole list again.

## Not included

- The suspension or dismissal showing as the student's status on the
  Mahasiswa page (Discipline history in the student detail).
- Mandatory counselling (Mandatory counselling from a discipline
  penalty).
- Messages to the student about a status change.
- Cancelling or correcting a recorded penalty: the prototype has no
  such button.
- The five conditions and the three Keputusan are the prototype's
  values, to be confirmed by the campus before launch.

## Better than the prototype

- A status change and a Keputusan ask for confirmation; in the
  prototype one slip of the hand changes the record.
- The rule "all five conditions first" is checked by the server, not
  only by greying the choice.
- Two people changing the same penalty cannot overwrite each other.
- Every change is logged with the value before and after.

## Decisions

1. Nothing is added to correct or cancel a penalty recorded by mistake,
   as in the prototype; a recorded penalty stays.
2. The status may go backwards, for example from "Selesai dijalani" to
   "Sedang dijalani", as in the prototype, since the log keeps the
   trail.
3. A suspended or dismissed student keeps access to the app, unchanged.
4. Both Pembina Disiplin Mahasiswa and Kepala Unit may record the
   Keputusan, as in the prototype.
5. Following up a penalty is its own right in the permission list, held
   by the same two roles that record a penalty.
6. "Kerja sosial belum selesai" now counts penalties with kerja sosial
   whose status is not "Selesai dijalani", whatever their end date, as
   in the prototype. Its note says so instead of naming the end date.
7. The five conditions are the prototype's wording: Telah selesai
   menjalani hukuman disiplin berat jenjang pertama; Memenuhi kurikulum
   akademik PKN STAN; Memenuhi kurikulum pembangunan karakter;
   Memperoleh rekomendasi tertulis dari Pejabat Pimpinan Tinggi Pratama
   bidang SDM dan/atau kepatuhan internal di kantor pusat instansi
   asal; Memenuhi ketentuan tugas belajar PNS sesuai peraturan
   perundang-undangan.
8. A tick saves at once without asking for confirmation, as in the
   prototype; only a status and a Keputusan ask first, as this issue
   says. A tick is still logged and refused when outdated.
9. Every penalty starts at Keputusan "Menunggu pemenuhan syarat" with
   no tick. The conditions follow the student's Instansi asal as it is
   now, not as it was when the penalty was saved.
10. A refused change made on an outdated record says "Hukuman ini baru
    saja diubah orang lain. Yang tampil sekarang adalah datanya yang
    terbaru." and the row shows the current state.

## Steps

- [x] 1. The penalty record gets its conditions and Keputusan, with a
  sample suspended student who has an Instansi asal.
- [x] 2. The right to follow up a penalty is added to the permission
  list, with its checks.
- [x] 3. Changing the status of a penalty, with confirmation.
- [x] 4. The conditions and the Keputusan in "Rincian", with the read
  only view.
- [x] 5. Refusing a change made on an outdated record.
