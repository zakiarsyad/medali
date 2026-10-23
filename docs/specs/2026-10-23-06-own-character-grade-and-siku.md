# My character grade and SIKU record

Depends on: My profile, Character grade list, SIKU adjustments, Score
limit under a discipline penalty, My character achievement
Group: Profil saya

## What we want

A student sees on Profil saya how their nilai karakter (KEP-220) is
built, and every point added to or taken from their SIKU with the reason
and the role that recorded it. Nothing about their grade is hidden from
them, and they know who to ask when a line looks wrong. The SIKU panel
is the one a student already sees in Penilaian SIKU, shown here again,
not built a second time.

## Who it is for

- Mahasiswa: their own grade and SIKU lines only.

## What should happen

- When an Aktif student opens Profil saya, then the card "Nilai karakter
  (KEP-220)" shows the letter and Nilai akhir, one bar per part with its
  weight and score (Kehadiran kegiatan with "(n) dari (m) kegiatan dan
  pertemuan", SKPM with its total points), and "Memenuhi" or "Belum
  memenuhi batas lulus nilai karakter minimal (x)."
- When a part is missing, then the card says "Belum lengkap" and "Belum
  ada: (part), (part)."
- When the grade is held by a Ringan or Sedang penalty, then the card
  says "Dibatasi 70 dari (score) karena hukuman disiplin."
- When no semester is running, or the student is Cuti or Non aktif, then
  the card says "Nilai karakter semester ini belum tersedia."
- When an Aktif student looks at "Transparansi nilai SIKU", then they
  see "bobot (w)% pada nilai karakter" and Nilai dasar + Penambahan (n)
  − Pengurangan (n) = SIKU akhir, with "Nilai SIKU dibatasi 0–100." when
  the limit applied.
- When they look at Penambahan and Pengurangan, then each table lists
  Tanggal, Alasan, Keterangan with its Dasar, Dicatat oleh (the role,
  never a name) and Poin, newest first, or "Belum ada penambahan." /
  "Belum ada pengurangan."
- When a table has more than 10 lines, then the first 10 show with
  "Tampilkan semua (n)".
- When they open "Kegiatan yang dapat menambah nilai SIKU", then they see
  the activities, the reasons for a reduction, and "Bila ada catatan yang
  menurut Anda keliru, hubungi pengasuh atau Penilai Mahasiswa."
- When staff cancel a SIKU line, then it leaves the student's page and
  the sum follows. Confirmed by a check.
- When a student tries by a hand-made request to see another student's
  grade or SIKU lines, then they only ever get their own. Confirmed by a
  check.
- When the student is Cuti or Non aktif, then the SIKU panel is not
  shown.
- When the page is opened on a phone, then each table line becomes a
  small card and the sum wraps, with no sideways scroll, and the page
  shows within about 1 second.

## Not included

- Asking for a SIKU addition with a photo: that is Penilaian > Penilaian
  SIKU.
- Changing weights, scores or SIKU lines.
- An objection button on a SIKU line.
- Any change to the staff cards in the student detail.

## Decided

1. "Dicatat oleh" shows the role, such as "Penilai Mahasiswa", never the
   staff member's name, here and in Penilaian SIKU. The name is never
   sent to a student's browser. This is already so in Penilaian SIKU.
2. No objection button for now; the text says who to contact.
3. A new right in the list of what each role may do, "Melihat nilai
   karakter sendiri", given to Mahasiswa. The SIKU lines use the right
   a student already has for Penilaian SIKU.
4. The page reads the signed-in student's own record only; nothing in
   the request says which student.
5. The two cards sit between "Capaian karakter" and "Riwayat per
   semester", as in the prototype.
6. "Transparansi nilai SIKU" in Penilaian SIKU becomes this same panel,
   so it also gains the weight line, folds after 10 lines, and folds the
   list of activities, as in the prototype.

## Steps

- [x] 1. The right to read one's own nilai karakter is added to the
  permission list, with its checks.
- [x] 2. The card "Nilai karakter (KEP-220)" on Profil saya, with the
  parts, the pass line, the missing parts, the limit line and the empty
  state.
- [ ] 3. "Transparansi nilai SIKU" as one panel for Profil saya and
  Penilaian SIKU, with the weight, the sum, both tables and the folded
  list of activities.
- [ ] 4. Phone layout and speed of both cards.
