# The cheapest Render setup that never sleeps

Group: Groundwork
Kind: chore

## What we want

The Render setup costs as little as it can while the app stays awake and
keeps its data and files: about $20.55 a month instead of $25.75. The
database gets 1 GB of storage instead of Render's default 15 GB, and the
file storage gets a 1 GB disk instead of 5 GB. The sizes of the three
machines stay as they are.

## Who it is for

The owner, who pays for it.

## What should happen

1. When the owner makes the setup from the repo in the Render dashboard,
   then Render shows the database (`0.1c-256mb`) with 1 GB of storage and
   the file storage with a 1 GB disk, and the app on `0.5c-512mb`, which
   does not sleep.
2. The hosting doc says the sizes, and that the database storage and the
   file disk can be made larger later but never smaller.

## Not included

- The free size for the app: it sleeps when nobody visits.
- Storage that grows by itself when it is full.
- Any other change to the setup.

## Open questions

None.

## Steps

- [x] 1. The Render setup gives the database 1 GB of storage and the file
  storage a 1 GB disk.
- [x] 2. The hosting doc says the sizes and that they only grow.
