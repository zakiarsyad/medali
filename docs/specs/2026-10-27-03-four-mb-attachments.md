# Attachments of 4 MB at most, and a refused file told as too large

Depends on: nothing
Group: Launch
Kind: fix, found by "App-wide audit: Launch"

## What we want

On the preview, a student who sends an "Advokasi" or a clarification with
a file between about 4.5 MB and 5 MB is refused by the hosting before the
app sees the file. The rule says such a file is allowed up to 5 MB. The
screen then says "Advokasi tidak terkirim. Periksa koneksi internet, lalu
tekan Kirim advokasi lagi.", which is wrong, and every try fails the same
way. A file of 4.2 MB went through; one of 4.7 MB was refused. On a local
computer a file just under 5 MB is kept.

The same holds for every place a file is sent to the app with a limit
above what the hosting accepts.

## Who it is for

Students who send an attachment, and everyone who tries the preview.

## What should happen

- When a file larger than the limit is chosen in any attachment or
  "Unggah berkas" form, then the screen says before sending that it is too
  large, with the limit in MB, on the preview and on the campus server
  alike. Confirmed by a check.
- When the limit of an attachment is above what the preview hosting
  accepts, then that limit is 4 MB everywhere, and the message says
  "maksimal 4 MB".
- When a file of 4 MB or less is sent on the preview, then it is kept,
  as today.
- When a send fails because the file is too large for any reason, then the
  screen says the file is too large, not "Periksa koneksi internet".

## Not included

- Sending files straight to the file storage, around the app.
- Making photos smaller in the browser before sending.
- Any change to which file types are allowed.

## Decisions

1. One limit everywhere, also on the campus server, so what the owner
   tries on the preview is what the campus gets.
2. Every form whose file limit is above 4 MB today gets 4 MB; forms with
   a lower limit keep it.
3. Decided while building: the limit that counts is the one on what is
   sent. The attachment of a clarification and of an "Advokasi" can be a
   PDF, which is sent as it is, so its one limit drops from 5 MB to 4 MB,
   for pictures too. The attendance photo and the Siku photos are always
   made much smaller in the browser before they are sent, so the photo
   picked on the phone never reaches the hosting: their limit on the
   picked photo stays (8 MB and 5 MB), and only the limit on what is sent
   drops to 4 MB where it was higher. Lowering the picked limit would
   refuse phone photos that work on the preview today.
4. Decided while building: the app's own limit on a whole sent form is
   set to what the preview hosting accepts, so the campus server refuses
   the same sends as the preview.

## Steps

- [x] 1. The attachment of a clarification and of an "Advokasi", and a
  sent attendance photo, are 4 MB at most, and the app takes no larger
  sent form than the hosting does, with checks.
- [ ] 2. Every form that sends a file says the file is too large, not to
  check the connection, when the send is refused for its size, and says
  so before sending when the picked file is over its limit, with checks.
