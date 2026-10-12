# Google sign-in

Group: Groundwork

## What we want

People sign in to the app with their Google account, and only campus
addresses are let in. A signed-in person gets the account that has the same
address, with that account's roles. Where Ganti peran is off, which
includes the campus server, sign-in is the only way in. The campus address
ending and the Google keys are settings the owner fills in later; this
work is built and checked without them.

## Who it is for

Every role. Kepala Unit, who sets each staff address in Pengaturan >
Pengguna dan peran.

## What should happen

Previews and local computers keep Ganti peran, and their sample accounts
have made-up addresses that Google does not know. So every case is
confirmed by a check, with a stand-in for Google's answer, unless it says
"on the preview". No case needs a real person's Google address.

- When someone who is not signed in opens any page where Ganti peran is
  off, then they see the sign-in page with the app name and the button
  "Masuk dengan Google", and nothing else of the app.
- When Google confirms a campus address that belongs to an account, then
  the person lands on the first page of their menu, and Masuk sebagai
  shows their name and roles.
- When Google confirms an address outside the campus, then the person is
  refused with the message "Gunakan akun Google kampus." and is not
  signed in.
- When Google confirms a campus address that has no account, or whose
  account was removed, then the person is refused with "Akun Anda belum
  terdaftar. Hubungi Unit Pembangunan Karakter."
- When a signed-in person presses "Keluar", then they return to the
  sign-in page, and the back button does not show the app again.
- When a signed-in person's account is removed or their roles change, then
  on their next page they see only what their new roles allow, or the
  sign-in page if removed.
- When a person has been inactive for 8 hours, then they are asked to
  sign in again.
- When Kepala Unit adds or changes a staff account in Pengguna dan peran
  and the campus address ending is set, then the email must end with it,
  or the message says "Gunakan alamat email kampus." While the setting is
  empty, any well-formed address is accepted, as today.
- When someone signs in, signs out or is refused, then a line is written
  to a sign-in log with time and result, without the address of a refused
  outsider.
- When Ganti peran is on (local computer and previews), then it works as
  before. Confirmed on the preview.
- When the sign-in page is opened by its address on a preview, then it
  shows the app name and "Masuk dengan Google". While the Google keys are
  empty, pressing the button shows "Masuk dengan Google belum diatur."
  and nothing else happens. Confirmed on the preview.
- When the campus address ending is empty, then nobody can sign in with
  Google: every address is refused with "Gunakan akun Google kampus."
- When Ganti peran is off and the Google keys or the campus address
  ending are empty, then the app refuses to start and names the missing
  setting, without showing any key.
- When the Google keys are needed, then they come from settings outside
  the repo, and the example settings file lists the names only.
- When a hand-made request reaches any page or action without a valid
  sign-in, where Ganti peran is off, then it is refused.
- When the sign-in button is pressed twice, or the same person signs in
  in two tabs, then they get one working session per tab and no error.
- When Kepala Unit gives an address that another account already uses,
  then it is refused with "Email sudah dipakai akun lain." Each address
  belongs to one account at most, enforced by the database.
- When the sign-in page is opened on a phone, then it fits with no
  sideways scroll. Confirmed on the preview.
- When the owner has filled in the Google keys and the campus address
  ending for the preview of `main`, then "Masuk dengan Google" opens
  Google's own page and comes back to the app. Tried by the owner after
  the keys are set; it is not part of the proof of this work.

## Not included

- Passwords or any other way to sign in, including the prototype's
  "masuk dengan NIM".
- Creating the Google keys and filling in the settings on the hosting.
  The owner does that; the hosting notes say which settings to fill, and
  that Google sign-in is set for the preview of `main` only, because each
  PR preview has a new link.
- A screen to type a student's address, and filling in students'
  addresses. A student signs in with the address held on their account.
  Student accounts hold none today, so sample students are tried with
  Ganti peran only; real addresses come with the campus server data.
- The campus server package itself (Campus server package).

## Better than the prototype

- The prototype has only the role picker; this adds clear messages for an
  outside address and for an unknown account.
- Sign-out and session expiry, which the prototype does not have.
- A sign-in log, so misuse of an account can be traced.
- Pengguna dan peran refuses a non-campus email, which could never sign in.

## Decided

The open questions, each with the answer that stands.

1. The campus address ending is a setting, not in the code, and empty
   until the owner fills it in. The cases say what the app does while it
   is empty. The checks use a made-up ending.
2. Students sign in with Google like everyone else, by the address held
   on their account, the same field staff accounts use. No new field and
   no new screen; a student account with no address cannot sign in with
   Google.
3. On the preview, the sign-in page and its message without keys can be
   tried. The rest is confirmed by checks with a stand-in for Google's
   answer. Only the last case needs real keys, and the owner tries it
   later.
4. A session lasts until 8 hours of inactivity.
5. `jose` is used: one small library that checks Google's signed answer.
   The round trip to Google and the session, which is kept in the
   database, are written in the app. No other library is added.

## Decided while building

What the spec did not say, decided during the build. A new issue can
change any of these.

1. The sign-in page has its own address, and shows without the menu, on
   a preview too.
2. The sign-in log holds the time, the result, and the account for a
   sign-in or a sign-out. It holds no address at all for anyone refused,
   whether an outsider or a campus address with no account: the choice
   that keeps less about a person. Like the role change log, its lines
   cannot be changed or deleted.
3. Google must also say that the address is verified. An address Google
   has not verified is refused like an outside address.
4. When Google's answer cannot be trusted, or the person cancels at
   Google, they return to the sign-in page with "Masuk dengan Google
   gagal. Coba lagi." and a line is written to the log, when it was this
   browser that pressed the button (see 23).
5. The campus address ending is the part after the name, such as
   `@kampus.example`. It is compared without regard to capital letters,
   and an address at a longer ending, such as `@mail.kampus.example`,
   does not count.
6. Addresses are kept in small letters, and Google's answer is compared
   the same way.
7. The session is remembered by the browser until it is closed. The 8
   hours are counted by the app, from the person's last page or action.
8. Where Ganti peran is on, someone signed in with Google uses their own
   account. Picking an account in Ganti peran signs them out of Google
   sign-in first. "Keluar" shows only for someone signed in with Google,
   and the link "Ganti peran" only where Ganti peran is on.
9. Someone already signed in who opens the sign-in page goes to their
   first page.
10. A person whose session ended while a page was open, and who then
    saves something, is told the session ended and given a link to sign
    in again. Nothing is saved.
11. The address Google sends the person back to is built from the address
    the app was opened at. The hosting notes give the one to register at
    Google.
12. Pengguna dan peran has no way to change an account's email today, so
    the campus address rule applies when an account is added.
13. The Google keys and the campus address ending are filled all together
    or all left empty. With only some filled, Google sign-in stays off
    on a preview and the button says it is not set up.
14. An address inside the app that does not exist is answered inside the
    menu, as before, now with "Halaman tidak ditemukan" in Bahasa
    Indonesia. Someone who is not signed in is sent to the sign-in page
    before the app says whether an address exists.
15. Before Google's page, the person is always asked which Google account
    to use, so someone refused with a private address can pick the campus
    one.
16. A press of "Masuk dengan Google" must be finished within 10 minutes.
    After that the person returns to the sign-in page with "Masuk dengan
    Google gagal. Coba lagi."
17. "Last used" of a session is written at most once every 5 minutes, so
    the 8 hours may count from up to 5 minutes before the last page.
    Sessions that have expired are cleared away when someone signs in.
18. "Keluar" signs out the browser it is pressed in. The same person's
    sessions in other browsers stay open until they expire.
19. Pressing "Keluar" or picking an account in Ganti peran writes a
    sign-out line only when a Google session really ended.
20. Whether an address is already used by an account is decided by the
    database alone, so two saves at the same moment cannot both pass.
21. The sentence "Login belum aktif" is taken off the Ganti peran page,
    because it is no longer true once the settings are filled.
22. Where Ganti peran is off, its page sends someone who is not signed in
    to the sign-in page, and stays "not found" for someone signed in.
23. A return from Google that this browser never started, such as the
    return address opened by hand, is sent back to the sign-in page with
    "Masuk dengan Google gagal. Coba lagi." and is not written to the
    log. Otherwise anyone could fill a log that can never be emptied.
24. A sign-in and its log line are saved together or not at all, and so
    are a sign-out and its line.
25. Google must also say that the account is run by the campus itself:
    the campus named in its answer must be the campus address ending
    without the "@". A personal Google account made with a campus address
    names no campus, and is refused like an outside address, with
    "Gunakan akun Google kampus." Otherwise such an account would keep
    getting in after the campus closes that mailbox or gives it to
    someone else.

## Steps

- [x] 1. The sign-in page and "Masuk dengan Google", with the campus
  address ending and the Google keys as settings, and what happens while
  they are empty.
- [x] 2. A confirmed address is matched to its account and roles, and
  every page and action uses that account.
- [x] 3. "Keluar", session expiry, and removed accounts lose access.
- [x] 4. Refusal messages and the sign-in log.
- [x] 5. Pengguna dan peran accepts campus addresses only, once the
  ending is set.
- [x] 6. Where Ganti peran is off, pages need sign-in and the app refuses
  to start without its settings; where it is on, both ways work. The
  hosting notes say what the owner fills in.
