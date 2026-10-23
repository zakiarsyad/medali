# Sample Pemanggilan calls the app could make

Depends on: nothing beyond what is merged
Group: Konseling
Kind: fix, found by "App-wide audit: Counselling and discipline"

## What we want

The sample data holds two counselling calls of the kind "Pemanggilan"
that the app itself could never make. On Konseling, Jadwal konseling,
Bayu Santoso's call shows Dasar "Asesmen karakter: pembinaan intensif"
and Pesan pengirim "Mohon dibantu menggali kendala belajarnya.", and Ayu
Lestiani's shows Dasar "Asesmen karakter: pembinaan ringan". But
"Students needing coaching" says a call is made only for a student
listed in "Teridentifikasi perlu pembinaan", its reason reads "Asesmen
karakter: rerata (n), pembinaan (level), aspek terlemah (value)", and a
call has no "Pesan pengirim". On Penilaian, Asesmen karakter, Bayu is at
Rerata 69,2 and Ayu at 80,3, and neither is listed. So whoever tries the
preview of `main` sees calls that disagree with the rest of the app.
After this work the sample calls look exactly like calls the app makes.

## Who it is for

Konselor, who sees the calls in Jadwal konseling, and Penilai Mahasiswa,
who sees the call's status on Asesmen karakter. Also the owner, who
tries the app on the preview with sample data.

## What should happen

- When Konselor opens Jadwal konseling with sample data, then every
  "Pemanggilan" is for a student whom "Teridentifikasi perlu pembinaan"
  lists, has the reason in the words "Asesmen karakter: rerata (n),
  pembinaan (level), aspek terlemah (value)" with that student's own
  numbers from their latest assessment, and has no "Pesan pengirim".
  Confirmed by a check over the sample data.
- When Penilai Mahasiswa opens Asesmen karakter with sample data, then
  each student with a sample call shows its status in the column
  Konseling instead of the button "Panggil konseling", and at least one
  listed student still has the button.
- The sample data keeps at least one call waiting for a schedule and one
  with a set date, so both states can be tried.
- No other sample record changes.

## Not included

- Any change to how a call is made or shown.
- The sample "Penugasan" calls from discipline penalties.

## Decided

1. The two calls are moved to students the sample data already lists, so
   no assessment numbers change and other screens stay as they are.
2. The call waiting for a schedule goes to Fikri Wibowo (Ringan, aspek
   terlemah Disiplin), who also has a voluntary session, so one student
   still has a call beside a voluntary request, as Bayu Santoso had. The
   call with a set date goes to Lutfi Tarigan (Intensif). Neither has a
   discipline penalty, so their scores are not held at 70. Gita Purba,
   Nanda Gunawan and Citra Nasution keep the button.
3. A call is made after the assessment that lists the student, so Lutfi
   Tarigan's call is sent 4 days ago and given its date 3 days ago, after
   his assessment 5 days ago; its date, Jam and way stay as Ayu Lestiani's
   were. Fikri Wibowo's call keeps the day it was sent, 2 days ago.
4. Bayu Santoso and Ayu Lestiani keep their voluntary request and consent
   as they were; only their calls go.

## Steps

- [ ] 1. The sample "Pemanggilan" calls belong to listed students, with
  the spec's reason and no "Pesan pengirim", with a check over the
  sample data.
