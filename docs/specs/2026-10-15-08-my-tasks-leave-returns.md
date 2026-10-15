# My tasks: leave and return reports

Depends on: Dorm leave requests, Return from leave
Group: Tugas saya

## What we want

Pengelola Asrama gets one page, Tugas saya, with everything that waits
for their decision, so they need not walk through the Asrama tabs. This
first version brings the page itself, the number beside the menu item
and two sections: leave requests to approve and return reports to
validate. Each decision is the same one as on Perizinan asrama.

## Who it is for

- Pengelola Asrama only.

## What should happen

- When Pengelola Asrama opens Tugas saya, then they see the title, a
  short intro, one number card per section ("Izin menunggu persetujuan",
  "Laporan kembali") and the sections under them. A card with a number
  above 0 stands out, and pressing it jumps to its section.
- When a section has items, then its head shows "(n) menunggu";
  otherwise "Beres" and "Tidak ada yang menunggu."
- When nothing waits at all, then a box says "Semua tugas sudah beres."
- When they look at the menu, then Tugas saya shows the total waiting,
  and it goes down right after each decision.
- When they look at "Izin menunggu persetujuan", then each card shows
  the student, NIM, room, kind, start, end, Keperluan and Tujuan,
  earliest start first, with "Waktu mulai sudah lewat." when it applies.
- When they press "Setujui", or "Tolak" with a note, then the request
  leaves the list and a message says the result. "Tolak" without a note
  saves nothing and asks for the reason.
- When they look at "Laporan kembali menunggu validasi", then each card
  shows Batas kembali, the report time with "terlambat (n) menit" when
  late, Catatan BAM and the photo, which opens larger. "Validasi
  kembali" closes the leave; "Tolak" needs a note.
- When students are out past their return time, then a box "Perlu
  dipantau" says how many, with a link to Perizinan asrama.
- When a section holds more than 20 items, then the 20 oldest show with
  "Lihat semua di Perizinan asrama".
- When BAM - BPHK, Kepala Unit or any other role types the page's
  address, or sends a hand-made decision, then it is refused. Confirmed
  by a check.
- When an item was already decided or cancelled elsewhere, then the late
  press is refused with "Sudah diproses. Daftar diperbarui." and the
  list reloads. A double press saves one decision. Confirmed by a check.
- When the page is opened on a phone, then the number cards wrap and
  each card is one column with no sideways scroll.
- When the preview opens the page, then it shows within about 1 second.

## Not included

- The sections for clarifications, cleaning and SP (My tasks:
  clarifications and cleaning assessments; My tasks: warning letters
  and violations to watch).
- Tugas saya for any other role.
- Opening the student detail from a name: Pengelola Asrama has no
  Mahasiswa menu.

## Better than the prototype

- A decision here and on Perizinan asrama is one action with one set of
  checks, not two copies that can drift apart.
- A stale item is refused with a message instead of being overwritten.
- Rejecting asks for confirmation; long sections are capped at 20.
- The number in the menu counts only what this person may decide.

## Decided

1. Only Pengelola Asrama gets Tugas saya now. Other roles may get one
   later, one spec per role, on this same page.
2. "Perlu dipantau" does not count toward the number in the menu, as in
   the prototype; it is not a decision.

## Decisions made while building

1. The intro is the prototype's, naming only the two kinds of work this
   version brings: "Semua hal yang menunggu tindakan Pengelola Asrama
   dalam satu halaman: persetujuan izin dan validasi laporan kembali.
   Selesaikan langsung di sini tanpa berpindah menu." The all-clear box
   says "Semua tugas sudah beres. Tidak ada yang menunggu tindakan Anda
   saat ini.", as in the prototype.

## Steps

- [x] 1. The right to open Tugas saya is checked for Pengelola Asrama
  only, and the page shows the title, intro and the all-clear box.
- [ ] 2. The server counts and reads what waits, 20 per section, with
  its checks.
- [ ] 3. The section "Izin menunggu persetujuan" with Setujui and Tolak.
- [ ] 4. The section "Laporan kembali menunggu validasi" with its photo.
- [ ] 5. The number cards, the number in the menu and "Perlu dipantau".
- [ ] 6. Stale and double decisions are refused; phone layout.
