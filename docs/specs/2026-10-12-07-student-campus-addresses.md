# Student campus addresses for Google sign-in

Depends on: Google sign-in
Group: Pengaturan

## What we want

A student signs in with Google through the campus address held on their
account, but no screen fills that address in: student accounts hold none
today. Pengaturan > Pengguna baru mahasiswa gets the field "Email
kampus", in the form and in "Unggah berkas", so that students can sign
in where Ganti peran is off.

## Who it is for

Kepala Unit, Pegawai UPK and Pengelola Asrama, who already add and
change students on this tab. The student, who can then sign in.

## What should happen

- When one of the three roles opens "Input data mahasiswa", then the
  form has "Email kampus (opsional)" after Nama lengkap, and the list
  "Mahasiswa yang ditambahkan" shows the address under the NIM, or
  "Belum ada email" when it is empty.
- When they add a student with an address, or press "Ubah", fill it in
  and press "Simpan perubahan", then it is saved on the student's
  account and a message confirms it.
- When the address is not well formed, then nothing is saved and the
  message says "Alamat email tidak valid."
- When the campus address ending is set and the address does not end
  with it, then nothing is saved and the message says "Gunakan alamat
  email kampus." While that setting is empty, any well-formed address is
  accepted, as for staff.
- When the address is already held by another account, student or
  staff, then nothing is saved and the message says "Email sudah dipakai
  akun lain." Each address belongs to one account at most, enforced by
  the database. Confirmed by a check.
- When they choose "Unggah berkas", then the list of columns and "Unduh
  templat CSV" include the optional column "email". A row with a wrong
  or already used address is skipped with the same messages; a row with
  no address is saved without one.
- When Google confirms an address that a student's account holds, then
  the student is signed in and lands on Profil saya. Confirmed by a
  check with a stand-in for Google's answer; no case needs a real
  person's address.
- When a student has no address, or it is cleared with "Ubah", then they
  cannot sign in with Google and get the message that an unknown address
  gets. Sample students stay reachable with Ganti peran.
- When an address is added, changed or cleared, then a line goes to the
  change log: who, when, and which student, without the old address in
  the message shown on screen. Confirmed by a check.
- When a role without the right to put in students sends an address by
  hand, or a student tries to change their own, then the server refuses
  it. Confirmed by a check.
- When the address is shown, then it shows on this tab only: not on the
  Mahasiswa list, not in the student detail and not on Profil saya.
  Confirmed by a check.
- When the form and the list are opened on a phone, then the new field
  and line fit with no sideways scroll.

## Not included

- Working an address out from the name or the NIM.
- Filling addresses for students who were not added through this tab;
  on the campus server every student comes in through it.
- Sending a message to the student, or checking that the mailbox exists.
- Letting students type or change their own address.

## Better than the prototype

- The prototype has no sign-in and no address for students. Here an
  address is unique across all accounts and checked against the campus
  ending.

## Decided

The open questions, each with the answer that stands.

1. The address is optional, so students can be added before their campus
   accounts exist. A student without one simply cannot sign in yet.
2. Nobody else sees a student's address: only the three roles on this
   tab.
3. "Unggah berkas" never fills the address of a student who is already
   there; an upload never changes an existing student, as merged. An
   address is added to an existing student with "Ubah".

## Decided while building

What the spec did not say, decided during the build. A new issue can
change any of these.

1. The address is kept in the field staff accounts already use, so the
   rule "one address, one account" that the database already enforces
   covers students too. No new field is added for it.
2. The app had no change log for addresses, so a new one is added. Each
   line holds who made the change, when, which student, whether the
   address was added, changed or cleared, and the address before and
   after, so a wrong change can be traced and put back. No screen shows
   this log. Like the role change log, its lines cannot be changed or
   deleted.
3. Adding a student together with an address writes a line too, as
   "added", also from "Unggah berkas".
4. The messages that confirm a save stay as they are and name no
   address.
5. When a student's address is changed or cleared, that student's open
   Google sign-ins end at once, so whoever signed in with the old
   address is asked to sign in again.
6. The address is kept in small letters, with spaces around it dropped,
   as for staff.
7. In a file, the column "email" may be left out altogether, so files
   made from the earlier template still work. When two rows of one file
   carry the same address, the first is saved and the later one is
   skipped with "Email sudah dipakai akun lain."
8. The right to put in new students covers the address. No new right is
   added.
9. Sample students get no address, so they are still tried with Ganti
   peran only.
10. The field takes any text, and the app itself says what is wrong
    with an address. A browser would word that its own way, and the
    three messages must read the same everywhere.
11. An address longer than 254 characters, the longest a mailbox can
    have, gets "Alamat email tidak valid."
12. The student detail and Profil saya have no screen yet. The check
    covers the Mahasiswa list and what every screen is told about the
    person signed in: neither carries the address, so those two screens
    get none when they are built.
13. The search of the list still looks at the name and the NIM only,
    not at the address.
14. In a file the column "email" comes last. A file with no row of
    titles, made from the earlier template, is then still read in the
    right order.
15. The example row of the template has no address: any made-up one
    would be refused where the campus address ending is set.
16. A row skipped for its address is counted with the rows to correct
    in the file. The reason names no address.
17. A row whose NIM is already registered is set apart first, so its
    address takes none away from a row that can be saved.
18. When an address is taken by another account between the check of a
    file and its save, no row of the file is saved and the message asks
    to upload the file again. Read again, the file skips that row.
19. The preview of a file shows the address of its first rows, to the
    same three roles.

## Steps

- [x] 1. The student account keeps one campus address, unique across
  all accounts.
- [x] 2. "Email kampus" in the form for a new student and for "Ubah",
  with its messages.
- [x] 3. The address line in the list.
- [x] 4. The column "email" in "Unggah berkas" and in the template.
- [ ] 5. A student signs in with that address, checked with a stand-in
  for Google.
- [ ] 6. The log lines, the refusals and the phone layout.
