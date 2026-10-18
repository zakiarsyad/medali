// Sample NIMs of this file: 9900002200 to 9900002299.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accounts,
  dormCompanions,
  dormRoomPlaces,
  mentorGroupMembers,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestRoom, ODD_2026, placeTestResident } from "@/dorms/test-records";
import { readOwnProfile } from "./own-profile";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const REFUSED = { kind: "refused" };
const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

/** Room numbers that no other file of checks uses. */
const ROOM_NUMBER = "U9221";
const NEXT_ROOM_NUMBER = "U9222";
const COMPANION_ROOM_NUMBER = "U9223";

function account(roles: RoleId[], studentId: string | null): AccountForAccess {
  return { id: NO_SUCH_ID, roles, studyProgramId: null, studentId };
}

/** The profile in the period where angkatan 2026 is in semester 1. */
function readProfile(db: Database, asking: AccountForAccess) {
  return readOwnProfile(db, asking, ODD_2026);
}

/** What a student is given of their own profile, or null when refused. */
async function ownProfileOf(db: Database, studentId: string) {
  const answer = await readProfile(db, account(["student"], studentId));
  return answer.kind === "found" ? answer.student : null;
}

/** Two students of one program. */
async function addRows(db: Database) {
  const program = await addTestProgram(db, "Prodi Uji Profil");
  const own = await addTestStudent(db, program, {
    nim: "9900002201",
    name: "Profil Uji Ani",
    entryPath: "transfer",
    originAgency: "Direktorat Jenderal Pajak",
    cohortYear: 2025,
    className: "2-01",
    province: "Bali",
    isSeedling: true,
    status: "on_leave",
  });
  const other = await addTestStudent(db, program, {
    nim: "9900002202",
    name: "Profil Uji Budi",
  });
  return { program, own, other };
}

/** A woman of angkatan 2026, who lives in Dana Rakca. */
async function addResident(db: Database): Promise<string> {
  const program = await addTestProgram(db, "Prodi Uji Profil Asrama");
  return addTestStudent(db, program, {
    nim: "9900002204",
    name: "Profil Uji Penghuni",
  });
}

async function addMentor(db: Database, name: string, title: string) {
  const mentor = await addTestActor(db, name, ["mentor"]);
  await db.update(accounts).set({ title }).where(eq(accounts.id, mentor.id));
  return mentor;
}

describe("readOwnProfile", () => {
  it("gives a student their own record with their pengasuh and kelompok pengasuhan, and nothing more of either", async () => {
    await inTestDatabase(async (db) => {
      const { program, own } = await addRows(db);
      const mentor = await addMentor(db, "Profil Uji Pengasuh", "M.Si.");
      const earlier = await addMentor(db, "Profil Uji Pengasuh Awal", "M.M.");
      await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [own],
        mentorId: mentor.id,
        earlierMentorId: earlier.id,
      });

      const answer = await readProfile(db, account(["student"], own));

      expect(answer).toStrictEqual({
        kind: "found",
        student: {
          id: own,
          nim: "9900002201",
          name: "Profil Uji Ani",
          status: "on_leave",
          isAffirmation: false,
          isSeedling: true,
          isInternational: false,
          isBlended: false,
          studyProgram: "Prodi Uji Profil",
          entryPath: "transfer",
          originAgency: "Direktorat Jenderal Pajak",
          cohortYear: 2025,
          className: "2-01",
          province: "Bali",
          sex: "female",
          mentorGroup: {
            cohortYear: 2026,
            entryPath: "regular",
            number: 1,
            programCode: "Prodi Uji Profil",
            mentor: {
              name: "Profil Uji Pengasuh",
              title: "M.Si.",
              since: "2026-10-01",
            },
            earlierMentors: ["Profil Uji Pengasuh Awal"],
          },
          residence: null,
        },
      });
    });
  });

  it("carries no address of a student whose account holds one", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Alamat");
      const email = "profil.alamat@kampus.example";
      const studentId = await addTestStudent(db, program, {
        nim: "9900002208",
        name: "Profil Uji Alamat",
      });
      await db
        .insert(accounts)
        .values({ name: "Profil Uji Alamat", studentId, email });

      const profile = await ownProfileOf(db, studentId);

      expect(profile).toMatchObject({ id: studentId });
      expect(profile).not.toHaveProperty("email");
      expect(JSON.stringify(profile)).not.toContain(email);
    });
  });

  it("gives no kelompok pengasuhan to a student who is in none", async () => {
    await inTestDatabase(async (db) => {
      const { program, own, other } = await addRows(db);
      const mentor = await addMentor(db, "Profil Uji Pengasuh", "M.Si.");
      await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [own],
        mentorId: mentor.id,
      });

      const profile = await ownProfileOf(db, other);

      expect(profile).toMatchObject({ id: other, mentorGroup: null });
    });
  });

  it("gives the new kelompok pengasuhan once the student is moved to another", async () => {
    await inTestDatabase(async (db) => {
      const { program, own } = await addRows(db);
      const first = await addMentor(db, "Profil Uji Pengasuh", "M.Si.");
      const second = await addMentor(db, "Profil Uji Pengasuh Baru", "M.Ak.");
      await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [own],
        mentorId: first.id,
      });
      const next = await addTestMentorGroup(db, program, {
        number: 2,
        memberIds: [],
        mentorId: second.id,
      });
      const before = await ownProfileOf(db, own);

      await db
        .update(mentorGroupMembers)
        .set({ groupId: next })
        .where(eq(mentorGroupMembers.studentId, own));

      expect(before?.mentorGroup).toMatchObject({
        number: 1,
        mentor: { name: "Profil Uji Pengasuh" },
      });
      expect((await ownProfileOf(db, own))?.mentorGroup).toStrictEqual({
        cohortYear: 2026,
        entryPath: "regular",
        number: 2,
        programCode: "Prodi Uji Profil",
        mentor: {
          name: "Profil Uji Pengasuh Baru",
          title: "M.Ak.",
          since: "2026-09-01",
        },
        earlierMentors: [],
      });
    });
  });

  it("gives a resident the dorm, the floor and the room of their own", async () => {
    await inTestDatabase(async (db) => {
      const resident = await addResident(db);
      const room = await addTestRoom(db, { number: ROOM_NUMBER, floor: 2 });
      await placeTestResident(db, room, resident);

      const profile = await ownProfileOf(db, resident);

      expect(profile?.residence).toStrictEqual({
        dorm: "dana_rakca",
        room: {
          plotted: true,
          dorm: "dana_rakca",
          floor: 2,
          number: ROOM_NUMBER,
          asCompanion: false,
        },
      });
    });
  });

  it("tells a resident that they have no room yet", async () => {
    await inTestDatabase(async (db) => {
      const resident = await addResident(db);

      const profile = await ownProfileOf(db, resident);

      expect(profile?.residence).toStrictEqual({
        dorm: "dana_rakca",
        room: { plotted: false },
      });
    });
  });

  it("gives the new room once the resident is moved to another", async () => {
    await inTestDatabase(async (db) => {
      const resident = await addResident(db);
      const room = await addTestRoom(db, { number: ROOM_NUMBER, floor: 2 });
      const next = await addTestRoom(db, {
        number: NEXT_ROOM_NUMBER,
        floor: 3,
      });
      await placeTestResident(db, room, resident);
      const before = await ownProfileOf(db, resident);

      await db
        .update(dormRoomPlaces)
        .set({ roomId: next })
        .where(eq(dormRoomPlaces.studentId, resident));

      expect(before?.residence?.room).toMatchObject({ number: ROOM_NUMBER });
      expect((await ownProfileOf(db, resident))?.residence).toStrictEqual({
        dorm: "dana_rakca",
        room: {
          plotted: true,
          dorm: "dana_rakca",
          floor: 3,
          number: NEXT_ROOM_NUMBER,
          asCompanion: false,
        },
      });
    });
  });

  it("gives a resident of Asrama Wismantara the dorm only, even with a place in a room", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Wismantara");
      const woman = await addTestStudent(db, program, {
        nim: "9900002205",
        name: "Profil Uji Pembibitan",
        cohortYear: 2023,
        isSeedling: true,
      });
      const man = await addTestStudent(db, program, {
        nim: "9900002206",
        name: "Profil Uji Internasional",
        sex: "male",
        isInternational: true,
      });
      const room = await addTestRoom(db, {
        dorm: "wismantara_putri",
        number: ROOM_NUMBER,
      });
      await placeTestResident(db, room, woman);

      expect((await ownProfileOf(db, woman))?.residence).toStrictEqual({
        dorm: "wismantara_putri",
        room: null,
      });
      expect((await ownProfileOf(db, man))?.residence).toStrictEqual({
        dorm: "wismantara_putra",
        room: null,
      });
    });
  });

  it("gives a resident of Asrama Wismantara who is kakak pendamping the dorm they serve, with their room", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Wismantara");
      const woman = await addTestStudent(db, program, {
        nim: "9900002208",
        name: "Profil Uji Pendamping",
        cohortYear: 2023,
        isSeedling: true,
      });
      const room = await addTestRoom(db, { number: COMPANION_ROOM_NUMBER });
      await db
        .insert(dormCompanions)
        .values({ studentId: woman, dorm: "dana_rakca", roomId: room });

      expect((await ownProfileOf(db, woman))?.residence).toStrictEqual({
        dorm: "dana_rakca",
        room: {
          plotted: true,
          dorm: "dana_rakca",
          floor: 1,
          number: COMPANION_ROOM_NUMBER,
          asCompanion: true,
        },
      });
    });
  });

  it("gives a kakak pendamping in semester 3 the dorm they serve, Belum diplot without a room", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Kakak");
      const senior = await addTestStudent(db, program, {
        nim: "9900002209",
        name: "Profil Uji Kakak",
        cohortYear: 2023,
      });
      await db
        .insert(dormCompanions)
        .values({ studentId: senior, dorm: "dana_rakca" });

      expect((await ownProfileOf(db, senior))?.residence).toStrictEqual({
        dorm: "dana_rakca",
        room: { plotted: false },
      });
    });
  });

  it("gives no residence to a student who lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Lanjut");
      const senior = await addTestStudent(db, program, {
        nim: "9900002207",
        name: "Profil Uji Semester Lanjut",
        cohortYear: 2023,
      });

      const profile = await ownProfileOf(db, senior);

      expect(profile).toMatchObject({ id: senior, residence: null });
    });
  });

  it("gives each of two students their own record and never the other's", async () => {
    await inTestDatabase(async (db) => {
      const { own, other } = await addRows(db);

      const first = await readProfile(db, account(["student"], own));
      const second = await readProfile(db, account(["student"], other));

      expect(first).toMatchObject({ student: { id: own } });
      expect(second).toMatchObject({ student: { id: other } });
    });
  });

  it("gives a student who also holds a BAM role their own record", async () => {
    await inTestDatabase(async (db) => {
      const { own } = await addRows(db);
      const asking = account(["student", "bam_bphk"], own);

      const answer = await readProfile(db, asking);

      expect(answer).toMatchObject({ kind: "found", student: { id: own } });
    });
  });

  it.each(["head_of_unit", "head_of_program", "dorm_manager"] as const)(
    "refuses %s, even with a student record on the account",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { own } = await addRows(db);

        const answer = await readProfile(db, account([role], own));

        expect(answer).toEqual(REFUSED);
      });
    },
  );

  it("refuses a Mahasiswa account that has no student record", async () => {
    await inTestDatabase(async (db) => {
      await addRows(db);

      const answer = await readProfile(db, account(["student"], null));

      expect(answer).toEqual(REFUSED);
    });
  });

  it("refuses a student whose record was removed", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Profil Hapus");
      const removed = await addTestStudent(db, program, {
        nim: "9900002203",
        name: "Profil Uji Dihapus",
        deletedAt: new Date("2026-10-11T03:00:00Z"),
      });

      const answer = await readProfile(db, account(["student"], removed));

      expect(answer).toEqual(REFUSED);
    });
  });
});
