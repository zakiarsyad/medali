# Dashboard: mental health

Depends on: Dashboard filter and character achievement; Shared counselling
data for recipients; Mental health screening; Sharing the screening level
Group: Dashboard

## What we want

The Dashboard gets its fourth card and section 4, "Kesehatan mental",
built like the prototype: an anonymous count of screening levels, and the
students whose data a counsellor published to the viewer with the
student's consent. No name shows unless the student agreed and the
counsellor published it to that role.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their own
program only).

## What should happen

- When one of the three roles opens Dashboard, then the card "Kesehatan
  mental" shows how many students are assessed ("<5" when 1 to 4, "0"
  when none), and "(n) data dipublikasikan konselor untuk Anda", with
  ", (m) perlu konseling" when m is above 0.
- When they look at "Kesehatan mental mahasiswa" with at least 5 assessed
  students, then they see the count for Normal, Ringan, Sedang, Berat and
  Sangat berat, and "(n) mahasiswa sudah diasesmen. Identitas tidak
  ditampilkan kecuali dipublikasikan konselor." A level with 1 to 4
  students shows "<5"; the server sends no smaller number. Confirmed by a
  check.
- When 1 to 4 students are assessed, then the panel shows only "Rekap
  ditampilkan setelah minimal 5 mahasiswa diasesmen, agar identitas tidak
  dapat ditebak." With none it shows "Belum ada asesmen kesehatan
  mental."
- When they look at "Data kesehatan mental yang dipublikasikan", then
  they see only students published to their role, within their own rows,
  while the sharing is on: the date, the name, the student's Pengasuh,
  and only the parts the student agreed to (level, counselling status
  with follow-up, counsellor's summary). Session notes never show.
- When nothing is published to them, then they see "Belum ada data yang
  dipublikasikan konselor. Data hanya tampil dengan persetujuan
  mahasiswa."
- When the student or the counsellor withdraws the sharing, then that
  student leaves the list on the next load. Confirmed on the preview and
  by a check.
- When the list holds more than 8, then it shows 8, and "Lihat rincian"
  opens Penilaian > Kesehatan mental.
- When the filter or Ketua Program Studi's program applies, then the
  counts and the list follow it, and the 5-student rule applies to the
  filtered group.
- When a role not named as recipient, Penilai Mahasiswa or Konselor sends
  a hand-made request for these numbers or rows, then it is refused.
  Confirmed by a check.
- When a published row is shown, then the showing is added to the
  unchangeable log of readings: who, whose data, which sharing, when.
  Confirmed by a check.
- When the page is opened on a phone, then the two panels stack with no
  sideways scroll.
- When the page opens on the preview with sample data, then it still
  shows within about 1 second.

## Not included

- Asking for consent, publishing and withdrawing (Konseling, Penilaian,
  Profil saya).
- Dashboard anak asuh for Pengasuh, and section Pendampingan.

## Better than the prototype

- No count under 5, for each level and for the card.
- Each showing of a published row is logged.

## Decided

1. Ketua Program Studi sees the anonymous counts for their own program,
   with the 5-student rule. The published list shows them a student only
   when a counsellor named their role as recipient.
2. Each row the list shows is written to the log of readings that
   already holds each opening of "Rincian" in Penilaian, in the same
   change as the reading.
3. A "<5" level can be worked out from the total and the other levels.
   This is left as it is: it gives a count, never a name, and the group
   is always at least 5.
4. A name in the list is not a link. Details open through "Lihat
   rincian" on Penilaian > Kesehatan mental, where the usual limits on
   who sees whom apply.
5. The counts cover the Aktif students of the filtered group, each with
   the level of their latest screening, as the other Dashboard sections
   do. "Perlu konseling" counts the listed students whose sharing holds
   the level and whose latest screening is Sedang or above, as on
   Penilaian.

## Steps

- [x] 1. The "Kesehatan mental" card, with the 5-student rule.
- [ ] 2. The anonymous rekap per level, with its checks.
- [ ] 3. The published list, limited to recipients with the sharing still
  on, with each showing logged and the refusal checks.
