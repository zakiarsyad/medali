# Two room changes in two rooms at the same moment

Depends on: Asrama: Dorm residents and rooms, Asrama: Dorm companions
Group: Asrama

## What we want

On Ploting kamar, placing someone in a room first removes places that
were left behind: those in the room, and those the student still has in
other rooms. Two people who place in two different rooms at the same
moment can each remove a left-behind place the other one needs next.
Then both wait for each other, and after about a second the database
gives one of them up: that person sees a raw error instead of a result.
No data is saved wrong, and trying again works. It needs two students
who each left a place behind in the room the other save works on, so it
is rare. It can happen between placing a resident, "Isi otomatis" and
placing a kakak pendamping, in any mix.

## Who it is for

- Pengelola Asrama and BAM - Kerumahtanggaan, who place residents and
  kakak pendamping.

## What should happen

- When two people place in two rooms at the same moment, and each save
  has a left-behind place to remove that the other also removes, then
  both saves finish, one after the other, and each person sees the usual
  message. Confirmed by a check that runs the two saves at the same
  moment.
- When this happens between any two of: placing a resident, "Isi
  otomatis", placing a kakak pendamping, then the same holds. Confirmed
  by a check.
- When there is no left-behind place, then placing works as today, and
  the checks on two people filling the last place of a room still pass.

## Not included

- Any change to what the screens show.
- Any change to who may place.

## Better than the prototype

- Two changes at the same moment never end in an error.

## Decided

1. The saves remove left-behind places in one fixed order, the same in
   all three, so no two of them can wait for each other. The note in the
   code that says two changes in two rooms never wait for each other is
   made true or reworded.

Decided while building, because the issue did not say:

2. Each of the three saves removes all its left-behind places in one go,
   after it holds its room and its students: those in the room and those
   of the students it places together, in the order of the student.
   Changing a room and removing a room, which also remove left-behind
   places in their room, use the same order, so they cannot wait for one
   of the three either.
3. "Isi otomatis" counts the free places of a room without the
   left-behind ones before it picks the residents, and counts again once
   they are removed, so it never fills more than the kapasitas.

## Steps

- [x] 1. A check that runs two such saves at the same moment and fails
  today.
- [x] 2. The three saves remove left-behind places in one fixed order.
