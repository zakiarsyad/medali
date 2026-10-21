# Sharing the screening level

Depends on: Mental health screening, Sharing a counselling summary,
Shared counselling data for recipients
Group: Penilaian

## What we want

When Konselor shares a student's counselling data, one more thing can be
shared: "Tingkat hasil asesmen dan rekomendasi tindak lanjut". The
student sees exactly this in the request and may refuse. Recipients then
see the level and advice of the latest screening in Penilaian >
Kesehatan mental, and never the scores or the konselor's note.

## Who it is for

- Konselor: chooses to share the level.
- Mahasiswa: agrees or refuses, for themselves only.
- Read when named as recipient: Kepala Unit, Direktur / Wakil Direktur,
  Ketua Program Studi (own program), Pengasuh (own mentees).

## What should happen

- When Konselor opens "Publikasi data kesehatan mental" for a student
  with at least one screening, then "Data yang dibagikan" also offers
  "Tingkat hasil asesmen dan rekomendasi tindak lanjut", not ticked.
- When the student has a session but no screening, then that choice is
  not offered. When they have a screening but no session, then the panel
  can be used with the level alone.
- When the student opens the request, then the list of what will be
  shared names the level and advice in the same words.
- When the student agreed without the level and Konselor later wants to
  add it, then a new request is needed; the old agreement does not cover
  it. Confirmed by a check.
- When a recipient opens "Data yang dipublikasikan untuk Anda", then the
  row shows Tingkat, or "Tidak dibagikan" when the level was left out.
  "Rincian" shows "Tingkat asesmen terakhir" with instrument and date,
  and "Rekomendasi".
- When a newer screening is recorded while the sharing is on, then the
  recipient sees the new level on the next load.
- When recipients look at the numbers, then "Perlu konseling" counts the
  students shared with them at Sedang or above.
- When Konselor looks at "Daftar mahasiswa", then it also shows the
  columns Konseling and Publikasi, and the filter "Disetujui".
- When the student or Konselor withdraws the sharing, then the level is
  gone for every recipient on the next load.
- When a recipient asks by hand for the three scores, the "Risiko" mark,
  the konselor's note, or the level of a student not shared with them or
  shared without the level, then it is refused and none of it is sent.
  Confirmed by a check.
- When the student withdraws while a recipient is reading, then the next
  request is refused. Each showing of a level to a recipient goes into
  the log. Confirmed by a check.
- When opened on a phone, then each row is a card with no sideways
  scroll. The list shows within about 1 second on the preview.

## Not included

- Sharing with Pengelola Asrama and BAM.
- The mental health part of the Beranda dashboards (Dashboard mental
  health).
- The student's own level (My health on my profile).
- Telling Kepala Unit about a "Risiko" mark without the student's
  agreement: nothing is shared without it.

## Better than the prototype

- The level is not ticked by default; Konselor chooses it on purpose.
- The "Risiko" mark never leaves Konselor's own view.
- Adding the level later needs a fresh agreement.

## Decided

1. A recipient sees only the latest screening, never the history. It is
   read each time the list or "Rincian" loads, never kept on the
   sharing, so a newer screening shows on the next load.
2. Nothing is shared without the student's agreement, "Risiko" included,
   also when the level is Sangat berat. In a crisis Konselor follows the
   campus protocol outside the app.
3. The level is offered only when the student has at least one
   screening; "Status konseling" and "Ringkasan konselor" stay offered
   only when the student has a session. The panel opens when the student
   has a screening or a session; with neither it says "Belum ada asesmen
   atau sesi konseling untuk mahasiswa ini.", as in the prototype. The
   server checks the same: the level without a screening is refused
   with "Belum ada asesmen untuk mahasiswa ini.", and the other data
   without a session with "Belum ada sesi konseling untuk mahasiswa
   ini.".
4. The level comes first in the form and in the student's list, as in
   the prototype, and is not ticked at the start.
5. Konselor and the student read "Tingkat hasil asesmen dan rekomendasi
   tindak lanjut"; a recipient reads the part as "Tingkat asesmen", as
   in the prototype.
6. The recipient's list gets the column "Tingkat": the level, "Tidak
   dibagikan" when the level was left out, or "Belum ada asesmen" when
   it was shared and the student has no screening. The order of the
   rows stays the newest published first; it is not sorted by level.
7. "Rincian" shows "Tingkat asesmen terakhir" with the level, the
   instrument and the date, then "Rekomendasi", which is always the
   advice of the level. The crisis advice is never shown to a
   recipient, because it would give away the "Risiko" mark. With the
   level shared and no screening it says "Belum ada asesmen.", as in the
   prototype.
8. The scores, the number of "ya", the "Risiko" mark and the konselor's
   note are never read for a recipient at all. The level of a student
   whose sharing leaves it out is not read either.
9. Each showing of a level to a recipient adds a line to the log of
   readings that already holds each opening of "Rincian": each row
   whose level the list shows, and each "Rincian" opening. It is
   written in the same change as the reading. Nothing in the app counts
   or shows these lines, so they keep their meaning without a new
   column: who saw whose data, from which sharing, and when.
10. "Perlu konseling" for recipients counts the students in their list
    whose sharing holds the level and whose latest screening is Sedang
    or above, with the note "dari data yang dipublikasikan". It shows
    with the other numbers, in the prototype's order.
11. Konselor's "Daftar mahasiswa" on Kesehatan mental gets "Konseling"
    and "Publikasi" in the same words as the list on Konseling, and the
    filter "Disetujui" for the students whose consent to counselling is
    Disetujui. The list still holds the screened students only.
12. A sharing that left out the level cannot be changed to hold it: the
    database already refuses any change of what a sharing gives. Konselor
    withdraws it and sends a new request, which the student answers
    again.
13. Sample data: Bayu Santoso's published sharing also holds the level,
    so his Pengasuh sees Berat; Nanda Gunawan's does not, so its
    recipients see "Tidak dibagikan".

## Steps

- [x] 1. The level is added to what can be shared, with the rule that an
  old agreement does not cover it, with checks.
- [x] 2. Konselor's panel and the student's request show the new choice.
- [ ] 3. Recipients see Tingkat and "Rekomendasi", and "Perlu konseling".
- [ ] 4. Konselor's list gets Konseling, Publikasi and "Disetujui".
- [ ] 5. The refusal checks for scores, note and "Risiko".
