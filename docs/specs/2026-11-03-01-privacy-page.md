# Kebijakan privasi publik

## What we want

A public page "Kebijakan privasi" that anyone can open without signing in.
It says what MEDALI takes from Google at sign-in, what it is used for,
where it is kept, and who to contact. Its link is entered on Google's
Branding page so the app can leave "Testing".

## Who it is for

- Anyone, signed in or not, including Google's reviewers.

## What should happen

- When someone who is not signed in opens `/privasi`, then they see the
  "Kebijakan privasi" page, and are not sent to the sign-in page.
- When a signed-in user of any role opens `/privasi`, then they see the
  same page.
- When someone reads the page, then it says in Bahasa Indonesia that:
  - Google gives MEDALI only the email address, whether Google has
    confirmed it, and whether the account is run by the campus.
  - The email is used only to check that the person is a campus member
    and to match them to their MEDALI account.
  - Each sign-in, sign-out and refusal is written to a sign-in log. A
    refused attempt keeps no address.
  - MEDALI does not ask Google for a name, photo, contacts or anything
    else, and does not sell or share the data.
  - "Data disimpan di server penyedia hosting yang dipakai MEDALI untuk
    sementara, sampai MEDALI pindah ke server kampus."
  - Questions go to asramaupk@gmail.com.
  - The date it was last updated.
- When someone opens the sign-in page, then a "Kebijakan privasi" link
  shows there and opens the page.
- When the page is opened on a phone, then it reads well with no
  sideways scrolling.

## Not included

- A terms of use page.
- Describing what staff enter into MEDALI later (counselling notes,
  surveys and so on). This page covers sign-in only.
- Changing what MEDALI asks from Google.

## Open questions

None.

## Steps

1. [x] Add the public "Kebijakan privasi" page at `/privasi`, open
   without sign-in.
2. [x] Add the "Kebijakan privasi" link to the sign-in page.
3. [x] Add the page's address to the Google sign-in part of the hosting
   notes, for the Branding page at Google.
