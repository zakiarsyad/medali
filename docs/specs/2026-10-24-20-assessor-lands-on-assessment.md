# Penilai Mahasiswa lands on Penilaian after sign-in

Depends on: none
Group: Home pages
Kind: fix, found by "App-wide audit: Home pages"

## What we want

After sign-in, Penilai Mahasiswa lands on Kegiatan karakter >
Klarifikasi kehadiran, because Kegiatan karakter comes first in the
menu. Their main work is on Penilaian: five of their six tabs are
there. The prototype lands this role on Penilaian. Since Penilai
Mahasiswa got the Kegiatan karakter tab, no spec has said which page
they land on.

## Who it is for

Penilai Mahasiswa. Every other role keeps the page it lands on.

## What should happen

1. When Penilai Mahasiswa signs in, or opens the app's start address
   while signed in, then they land on Penilaian, on its first tab
   (Penilaian karakter).
2. The menu keeps its order: Kegiatan karakter, then Penilaian.
3. Every other role lands where it lands today: students on Profil
   saya, Pengelola Asrama on Tugas saya, Kepala Unit on Dashboard,
   Konselor on Penilaian > Kesehatan mental, and so on. Confirmed by a
   check over every role.
4. An account with two roles lands on the first page, in menu order,
   of its roles' own first pages. The sample account with Pegawai UPK
   and Konselor still lands on Kurikulum. A student with a BAM role
   still lands on Profil saya.

## Not included

- The order of the menu.
- What any page shows.

## Decisions

1. The menu does not put Penilaian first for this role. The prototype
   keeps Kegiatan karakter first in the menu and only lands on
   Penilaian.
2. Each role may name its first page; when it names none, the first
   page of its menu is used, as today.

## Steps

- [ ] 1. Penilai Mahasiswa names Penilaian as its first page, and the
  start address sends each account to the earliest of its roles' first
  pages, with checks over every role.
