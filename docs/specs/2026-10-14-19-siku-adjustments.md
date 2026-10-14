# SIKU adjustments

Depends on: Mentor groups, Academic period
Group: Penilaian

## What we want

Penilaian gets the tab "Penilaian SIKU". Every student starts from the
Nilai dasar SIKU set in Kurikulum, then gains or loses points for set
reasons. Staff who enter scores add a gain or a loss for many students at
once, see the history, and can cancel an entry. Others read the result,
and a student sees their own SIKU and why.

## Who it is for

- Add and cancel: Kepala Unit and Penilai Mahasiswa (right "Penilaian
  SIKU").
- Read: Direktur / Wakil Direktur, Ketua Program Studi (own program) and
  Pengasuh (own mentees). Mahasiswa: only their own.

## What should happen

- When a staff role opens Penilaian SIKU, then they see four numbers (Nilai
  dasar SIKU "diatur di menu Kurikulum", Rerata SIKU akhir, Mendapat
  penambahan, Mendapat pengurangan), "Input nilai SIKU", "Perubahan nilai
  SIKU per mahasiswa", "Riwayat penambahan dan pengurangan SIKU" and
  "Daftar nilai SIKU", all limited to the students they may see.
- When Kepala Unit or Penilai Mahasiswa chooses Penambahan or Pengurangan,
  then they pick an Alasan from the prototype's lists (five for gains, four
  for losses), Poin (whole, 1–30), Tanggal, Keterangan, and active
  students by search or with "Tambah satu kelompok pengasuhan", removable
  with × or "Kosongkan". A table shows each student's "SIKU sekarang" and
  "Setelah disimpan".
- When the reason is "Ketentuan lain sesuai keputusan Direktur/Wakil
  Direktur Kemahasiswaan", then "Dasar atau nomor surat" shows and must be
  filled: "Isi dasar atau nomor surat keputusan."
- When they save with no student or points outside 1–30, then nothing is
  saved: "Pilih minimal satu mahasiswa." or "Poin 1–30." With valid
  fields: "(Penambahan/Pengurangan) (n) poin SIKU disimpan untuk (n)
  mahasiswa." and every number and list updates.
- When they look at the history, then each entry shows date, kind and
  reason, points, number of students, Keterangan and Dasar, who, and
  "Lihat mahasiswa", 20 a page. With none: "Belum ada penambahan atau
  pengurangan SIKU."
- When a loss has the reason "Hukuman disiplin mahasiswa", then on this
  tab it shows with its reason to every staff role above: Kepala Unit
  and Penilai Mahasiswa enter it here, and the reading roles may read
  discipline records. In the student detail the reason is hidden from
  Penilai Mahasiswa (spec "SIKU in the student detail").
- When they press "Batalkan" and confirm, then the entry leaves every
  SIKU with "Penyesuaian dibatalkan." It is marked as cancelled, with who
  and when, not erased. Confirmed by a check.
- When anyone looks at a SIKU, then it is Nilai dasar + gains − losses,
  kept within 0–100. Changing Nilai dasar in Kurikulum changes every SIKU.
  Confirmed by a check.
- When an entry is saved, then it records the academic period it was
  made in. The total runs on from one semester to the next and does not
  start again. Confirmed by a check.
- When they look at "Daftar nilai SIKU", then each student shows Nilai
  dasar, Penambahan, Pengurangan, SIKU akhir and Penyesuaian terakhir, 25
  a page, with "Cari nama atau NIM" and the filters Mendapat penambahan,
  Mendapat pengurangan, Tetap di nilai dasar. "Perubahan nilai SIKU per
  mahasiswa" shows the 10 largest falls and rises, with "Tampilkan semua".
- When a student opens Penilaian, then they see only "Penilaian SIKU" with
  four numbers (Nilai dasar SIKU, Penambahan, Pengurangan, SIKU akhir) and
  "Transparansi nilai SIKU": dasar + gains − losses = akhir, each gain and
  loss with date, reason, note and "Dicatat oleh", which shows a student
  the role (for example "Penilai Mahasiswa") and never the staff
  member's name, the list of what can add to or
  reduce SIKU, and "Nilai SIKU dibatasi 0–100." when the limit applies.
- When a read-only role opens the tab, then "Input nilai SIKU" says "Nilai
  SIKU diinput oleh Penilai Mahasiswa." When Pengasuh, Direktur or a
  student sends an entry or a cancel by hand, or a student asks for
  another student's SIKU, then the server refuses. Confirmed by a check.
- When an entry is saved or cancelled, then a line goes into the log that
  cannot be edited. Pressing "Simpan" twice saves once; an entry already
  cancelled cannot be cancelled again. Confirmed by a check.
- When used on a phone, then the lists become cards with no sideways
  scroll. With sample data on the preview, the tab shows within about 1
  second.

## Not included

- "Unggah berkas" and student requests (specs "SIKU file upload" and
  "SIKU addition requests").
- The same SIKU record on Profil saya (spec "My character grade and SIKU
  record") and in the student detail (spec "SIKU in the student detail").
- The SIKU weight inside Nilai karakter.
- A separate Nilai dasar per student: the prototype holds an unused form
  for it, and Kurikulum already sets one base for everyone.
- Starting SIKU again each semester, and closing a semester.
- The numbers here are the prototype's values, to be confirmed by the
  campus before launch.

## Better than the prototype

- Tanggal cannot be in the future.
- The history and "Lihat mahasiswa" are paged; the prototype showed the
  whole history and stopped at 60 names.
- The server works out SIKU, so every screen shows the same number.
- A student sees the role under "Dicatat oleh", not a staff name; the
  name stays in the history and the log for staff.

## Decided

1. SIKU does not start again each semester: one running total, as in the
   prototype. Each entry records the academic period it was made in.
2. Anyone with the right "Penilaian SIKU" may cancel an entry made by
   someone else, since the log keeps who did it.
3. Every loss is entered by hand for now; none is added by itself from a
   discipline record or an absence without notice.

## Steps

- [x] 1. SIKU entries are stored with their students, a cancel mark and the
  log. The right "Penilaian SIKU" is added for Kepala Unit and Penilai
  Mahasiswa, with its checks. Sample data adds a few entries.
- [x] 2. The SIKU rule (dasar + gains − losses, 0–100), with checks.
- [x] 3. The tab shows the numbers, "Daftar nilai SIKU" and the ranking.
- [ ] 4. The form adds a gain or a loss for chosen students.
- [ ] 5. The history, with "Lihat mahasiswa" and "Batalkan".
- [ ] 6. The student's own numbers and "Transparansi nilai SIKU".

## Decisions made while building

- Reading the tab is a right of its own for the staff who read it
  (Kepala Unit, Penilai Mahasiswa, Direktur / Wakil Direktur, Ketua
  Program Studi, Pengasuh), and Mahasiswa has a separate right to read
  only their own SIKU. Both show on the list of rights per role.
- Each entry keeps the role it was entered as: Penilai Mahasiswa when
  the person holds that role, otherwise Kepala Unit. A student sees that
  role under "Dicatat oleh".
- The academic period of an entry is the one running on the day it is
  saved, not the day under Tanggal. While no period runs, nothing is
  saved.
