# Dorm violation reductions

Depends on: Dorm warning letters, Academic period
Group: Asrama

## What we want

When a resident's explanation is accepted, Pengelola Asrama takes a
counted violation off their record (Kurangi), with the reason written
down. The violation then leaves the announcement and no longer counts
towards an SP. Every reduction is listed and can be undone.

## Who it is for

- Reduce and undo: Pengelola Asrama.
- Read the list of reductions: Kepala Unit. BAM roles do not see it.
- Mahasiswa who live in the dorm, for their own record.

## What should happen

- When Pengelola Asrama opens a student under "Rekap pelanggaran per
  mahasiswa", then each violation at Naik ke Pengelola has the button
  "Kurangi".
- When they press it, fill "Dasar pengurangan (hasil klarifikasi yang
  diterima)" with 5 letters or more and confirm, then the violation
  leaves the student's count and "Pengumuman pelanggaran", and a message
  says so.
- When they open "Proses" for a called resident, then each counted
  violation has a tick "Kurangi", and the button reads "Kurangi (n)
  pelanggaran". Pressing it asks to confirm with the number left.
- When the count falls under what an SP needs, then the resident leaves
  the list of calls and the message says "Panggilan klarifikasi tidak
  lagi aktif"; otherwise it says the call is still active.
- When Pengelola Asrama or Kepala Unit opens the tab, then "Riwayat
  pengurangan pelanggaran" lists the student, the violation, the reason,
  who and when for the semester. With none it says "Belum ada
  pengurangan pada semester ini."
- When Pengelola Asrama presses "Batalkan" on a reduction and confirms,
  then the violation counts again and is back in the announcement.
- When the resident opens "Rekam jejak pelanggaran saya", then a reduced
  violation shows as "Dikurangi" with the reason and does not count.
- When any role but Pengelola Asrama sends a hand-made reduction or
  undo, or a BAM role or a resident asks for the list of reductions,
  then the server refuses it. A violation still in Masa advokasi or with
  an accepted appeal cannot be reduced. Confirmed by a check.
- When "Kurangi" is pressed twice, then the violation is reduced once.
  A reduced violation is marked, not deleted, and every reduction and
  undo adds a line to the change log. Confirmed by a check.
- When Pengelola Asrama reduces on a phone, then the ticks and the
  reason fit one column with no sideways scroll.
- When the tab opens on the preview, then it shows within about 1
  second, and the list of reductions is paged.

## Not included

- Withdrawing an SP that was already issued.
- Reducing a violation that never reached Pengelola Asrama.

## Better than the prototype

- The reason is asked in a form with a confirmation, not in a browser
  prompt.
- The record is kept and marked, so the history can always be trusted.
- The resident sees that a violation was reduced and why, instead of
  the row silently vanishing.

## Decided

1. The resident sees a reduced violation as "Dikurangi", with the
   reason, so they know the explanation was accepted.
2. A reduction may be undone after an SP decision was based on it. The
   count is worked out again; an SP already issued stays.
3. Only Pengelola Asrama and Kepala Unit read "Riwayat pengurangan
   pelanggaran"; never BAM roles or other residents.

Decided while building, because the issue did not say:

4. A reduction is a mark on the violation: Dasar pengurangan, who and
   when. Undoing it takes the mark away. The log keeps a line for each
   reduction and each undoing, with the reason it concerned, so a
   reduction undone keeps its reason in the log. The database refuses a
   mark without all three parts, one before the announcement, and one
   on a cancelled violation.
5. "Dasar pengurangan (hasil klarifikasi yang diterima)" holds 5 to 500
   letters, not counting spaces around them.
6. Sample data: the latest violation of the sample resident with SP 1
   was reduced five days ago, and the latest of the one with SP 2
   yesterday, both by the sample Pengelola Asrama, each with a reason.
   Their SPs stay. The sample resident called for SP 1 has no reduction,
   so the call can be tried.
7. Two new rights: reducing a violation and undoing a reduction
   ("Mengurangi pelanggaran asrama dan membatalkan pengurangannya") for
   Pengelola Asrama only, and reading "Riwayat pengurangan pelanggaran"
   ("Melihat riwayat pengurangan pelanggaran asrama") for Pengelola
   Asrama and Kepala Unit only. Every other role gets neither.
8. Only a violation at Naik ke Pengelola can be reduced: not one waiting
   for its announcement, in Masa advokasi, with its appeal waiting or
   accepted, or cancelled. One whose appeal was rejected can. The server
   checks this by its own clock.
9. In the box of one student, Pengelola Asrama sees a column
   "Pengurangan" with "Kurangi" on each violation at Naik ke Pengelola.
   It opens the reason under the row with "Kurangi" and "Batal"; the
   confirmation names the day and the student. The answer says
   "Pelanggaran (day) dikurangi dan dihapus dari pengumuman.".
10. A reduced violation stays in the box of the student as "Dikurangi"
    with its reason, for Pengelola Asrama and Kepala Unit. The BAM roles,
    which do not read reductions, no longer see it there, as in the
    prototype, and it no longer counts for anyone.
11. Pengelola Asrama does not reduce their own violations, as with
    appeals and SPs: their own box has no "Kurangi", and a hand-made
    reduction of their own is refused.
12. A reduction that names a violation of another student, one not
    there, or one reduced already is refused, and nothing is reduced.
    The second of two presses is told the violation is reduced already.
13. In "Proses" each counted violation has the tick "Kurangi", with
    Dasar pengurangan under the list. The button reads "Kurangi
    pelanggaran terpilih", switched off, until one is ticked, then
    "Kurangi (n) pelanggaran". The confirmation says "Sisa (n)
    pelanggaran tercatat.". One press reduces at most 50, all or none.
14. The answer says "(n) pelanggaran dikurangi." and then "Panggilan
    klarifikasi tidak lagi aktif (n pelanggaran tercatat)." or
    "Panggilan SP (1 or 2) masih aktif (n pelanggaran tercatat).". A
    resident also called for a rejected clarification stays called.
15. The box of "Proses" stays open once the resident is no longer
    called, so the answer can be read. In place of its two parts it then
    says "SP (1 or 2) sudah terbit semester ini." for a resident with an
    SP of the semester, the highest one, or else "Mahasiswa ini tidak
    sedang dalam panggilan klarifikasi.". This also holds after an SP is
    issued there, where the box used to close, so the issued SP is seen.
16. "Riwayat pengurangan pelanggaran" stands under the rekap and follows
    its semester choice: the violations of a day of that semester that
    are reduced now, the latest reduced first, 20 a page. Each row shows
    the student with the NIM, the day, reason and punishment of the
    violation, Dasar pengurangan, and who reduced it with the hour.
17. An undone reduction leaves the list; its two lines stay in the log.
    "Batalkan" asks "Batalkan pengurangan ini? Pelanggaran kembali
    tercatat dan tampil di pengumuman." and says "Pengurangan
    dibatalkan. Pelanggaran kembali tercatat dan tampil di pengumuman.".
    Any Pengelola Asrama may undo a reduction another made, but not one
    of their own violations. A second undo is refused with "Pengurangan
    ini sudah dibatalkan. Muat ulang halaman.".
18. In "Rekam jejak pelanggaran saya" a reduced violation shows
    "Dikurangi" with Dasar pengurangan under it, but not who reduced it
    or when. It no longer counts in "Pelanggaran tercatat", "Menuju
    panggilan SP 1" or "Menuju SP 2", and leaves the announcement of the
    dorm, for every resident.

## Steps

- [x] 1. The reduction mark with its reason, who and when is added to
  dorm violations, with sample reductions.
- [x] 2. The right to reduce is added to the permission list, with its
  checks.
- [x] 3. Pengelola Asrama reduces one violation from the list per
  student.
- [x] 4. Pengelola Asrama reduces several at once while processing a
  call.
- [x] 5. The list of reductions shows, with undo.
- [x] 6. Residents see a reduced violation in their record.
