# Separate keys for the filter form and the cards of Verifikasi presensi

Depends on: nothing beyond what is merged
Group: Kegiatan
Kind: fix, found by "Audit: Kegiatan"

## What we want

Every load of "Verifikasi presensi" logs the React error "Encountered two
children with the same key, `/kegiatan/verifikasi`". The filter form and
the photo cards sit side by side in one part of the page, and each takes the
page's address as its key: the filter form without the page number, the
cards with it. On the first page the two addresses are the same. React says
it does not support this: one of the two may be kept or dropped wrongly
when the page changes. After this work each part has its own key and the
error is gone.

Seen in "Audit: Kegiatan", on a local computer with sample data, as Pegawai
UPK on a phone and on a computer: the error shows on every load of the tab.
While the app runs on a local computer, a red "1 Issue" badge also covers
the "Tolak" button of the lowest card on a phone.

## Who it is for

Pegawai UPK.

## What should happen

- When "Verifikasi presensi" opens on any page, with any filter, then no
  "same key" error is logged.
- When the filter or the page changes, then the filter form and the cards
  show the new choice, as today.
- Confirmed by a check: the keys of the filter form and of the cards differ
  on the first page.

## Not included

- Any change to what the tab shows.

## Decisions

1. How do the keys differ? Each key names its part, "filter" or "cards",
   before the address.

## Steps

- [x] 1. The filter form and the cards get keys of their own.
