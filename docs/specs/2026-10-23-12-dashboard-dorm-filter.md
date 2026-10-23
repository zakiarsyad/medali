# Dashboard Asrama filter

Depends on: Dashboard filter and character achievement; Dashboard
character grade; Dashboard physical health; Dashboard mental health;
Dashboard mentoring summary; Dorm residents and rooms; Academic period
Group: Dashboard

## What we want

The Dashboard filter gets the one choice of the prototype that is still
missing: Asrama. Staff can look at every number on the Dashboard for
dorm residents only, for one dorm, or for students outside the dorm.
Who is a resident, and of which dorm, is read from "Dorm residents and
rooms"; this spec adds no rule of its own.

## Who it is for

Kepala Unit, Direktur / Wakil Direktur and Ketua Program Studi (their own
program only), the three roles that already use the Dashboard filter.

## What should happen

- When one of the three roles opens Dashboard, then the filter shows
  Asrama as its second choice, after Tahapan, with "Asrama dan non
  asrama" chosen at the start.
- When they open the choice, then it offers "Semua asrama", "Asrama
  Wismantara", "Asrama Dana Rakca", "Asrama Cipta Bakti" and "Non
  asrama". Each shows how many students it would give with the other
  filters as they are, "Semua asrama" shows the sum of the three dorms,
  and a choice with none is hidden.
- When they pick "Semua asrama", then every number on the page counts
  only dorm residents. When they pick one dorm, then only its residents
  count. When they pick "Non asrama", then only active students who do
  not live in a dorm count.
- When Asrama is picked together with other filters, then the line says
  "(n) mahasiswa sesuai (k) filter" with Asrama counted as one filter,
  and "Atur ulang filter" clears it too.
- When no active student matches, then they see "Tidak ada mahasiswa
  aktif dengan kombinasi filter ini." and no section.
- When the filtered group holds fewer than 5 students, then every card
  and section follows the rule it already has for a small group: no
  averages and no health or mental health counts, and the server sends
  none. Confirmed by a check.
- When Ketua Program Studi uses the Asrama filter, then every number and
  every count beside a choice covers only their program. A hand-made
  request for another program is refused. Confirmed by a check.
- When Asrama is chosen, then it is kept in the page address with the
  other filters, so reloading or sharing the link shows the same view.
- When a student stops being a resident, then the counts follow on the
  next load. Confirmed by a check.
- When Konselor, Mahasiswa, Pegawai UPK, Pengelola Asrama or a BAM role
  sends a hand-made request for Dashboard numbers with the Asrama
  filter, then it is refused, as without it. Confirmed by a check.
- When the page is opened on a phone, then Asrama sits inside the folded
  "Filter" button with the other choices.
- When Asrama is picked with sample data, then the page shows within
  about 1 second.

## Not included

- The Asrama filter on the Mahasiswa list (Asrama on the student lists).
- Dashboard asrama, which stays under the Asrama menu.
- A filter by room, floor or kakak pendamping.
- A filter on "Dashboard anak asuh" for Pengasuh; the prototype has
  none.
- Names of residents anywhere on the Dashboard.

## Better than the prototype

- The choice is kept in the address with the other filters.
- A small group is hidden also when it comes from the Asrama filter.

## Decided

1. Asrama sits second in the filter, after Tahapan, as in the
   prototype.
2. A dorm picked together with other filters can leave very few
   students. The rule of 5 that each section already has applies
   unchanged; this spec shows no number that the sections would hide.
3. Pengelola Asrama does not get the Dashboard because of this filter.
   The prototype gives Dashboard to the three roles above and Pengasuh
   only.

## Decided while building

1. "Asrama Wismantara" is one choice for both Wismantara Putra and
   Wismantara Putri, as the prototype has three dorms. Its count is the
   residents of both.
2. The Asrama choice is offered also while no academic period runs:
   Internasional and Pembibitan students and those placed by hand still
   live in a dorm then.

## Steps

- [x] 1. The Asrama choice in the filter, with the count beside each
  option and "Semua asrama" as the sum of the dorms.
- [x] 2. Every card and section counts only the chosen students, with
  the check for groups under 5.
- [x] 3. The choice is kept in the address and cleared by "Atur ulang
  filter".
- [x] 4. Ketua Program Studi stays inside their program, and the other
  roles are refused, with checks.
- [ ] 5. The phone layout and the speed check.
