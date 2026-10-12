// Sample NIMs of this file: 9900400300 to 9900400399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormRoomPlaces,
  dormRooms,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { DormId } from "@/dorms/dorms";
import { readStudentDetail } from "./student-detail";
import type { StudentResidence } from "./student-residence";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

/** The period the checks run in: angkatan 2026 is in semester 1. */
const ODD_2026 = {
  startYear: 2026,
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
} as const;

/** A day in that period. */
const DAY = "2026-10-12";

const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

/** A floor and a room number that no other file of checks uses. */
const FLOOR = 7;
const ROOM_NUMBER = "U9107";

function account(
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id: NO_SUCH_ID, roles, studyProgramId, studentId: null };
}

async function placeInRoom(
  db: Database,
  studentId: string,
  dorm: DormId,
): Promise<void> {
  const [room] = await db
    .insert(dormRooms)
    .values({ dorm, floor: FLOOR, number: ROOM_NUMBER, capacity: 4 })
    .returning({ id: dormRooms.id });
  if (!room) throw new Error("The room was not added.");
  await db.insert(dormRoomPlaces).values({ roomId: room.id, studentId });
}

/** A program with a woman of angkatan 2026, who lives in Dana Rakca. */
async function addResident(db: Database) {
  await db.insert(academicPeriods).values(ODD_2026);
  const program = await addTestProgram(db, "Prodi Uji Asrama Detail");
  const id = await addTestStudent(db, program, {
    nim: "9900400301",
    name: "Detail Uji Penghuni",
  });
  return { program, id };
}

/** The residence in the answer, or undefined when no student is found. */
async function residenceFor(
  db: Database,
  asking: AccountForAccess,
  id: string,
): Promise<StudentResidence | null | undefined> {
  const answer = await readStudentDetail(db, asking, id, DAY);
  return answer.kind === "found" ? answer.student.residence : undefined;
}

describe("the Asrama line of a student's detail", () => {
  it("gives Kepala Unit the dorm, the floor and the room of a resident", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addResident(db);
      await placeInRoom(db, id, "dana_rakca");

      expect(await residenceFor(db, account(["head_of_unit"]), id)).toEqual({
        dorm: "dana_rakca",
        room: { plotted: true, floor: FLOOR, number: ROOM_NUMBER },
      });
    });
  });

  it("tells Kepala Unit that a resident has no room yet", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addResident(db);

      expect(await residenceFor(db, account(["head_of_unit"]), id)).toEqual({
        dorm: "dana_rakca",
        room: { plotted: false },
      });
    });
  });

  it.each(["director", "head_of_program"] as const)(
    "gives %s the dorm only, with no floor and no room in the answer",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { program, id } = await addResident(db);
        await placeInRoom(db, id, "dana_rakca");

        const answer = await readStudentDetail(
          db,
          account([role], program),
          id,
          DAY,
        );

        expect(answer).toMatchObject({
          kind: "found",
          student: { residence: { dorm: "dana_rakca", room: null } },
        });
        const sent = JSON.stringify(answer);
        expect(sent).not.toContain(ROOM_NUMBER);
        expect(sent).not.toContain("floor");
        expect(sent).not.toContain("plotted");
      });
    },
  );

  it("gives the floor and the room to an account that is Kepala Unit among its roles", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addResident(db);
      await placeInRoom(db, id, "dana_rakca");
      const asking = account(["director", "head_of_unit"]);

      expect((await residenceFor(db, asking, id))?.room).toEqual({
        plotted: true,
        floor: FLOOR,
        number: ROOM_NUMBER,
      });
    });
  });

  it("gives the dorm only for a resident of Asrama Wismantara, to Kepala Unit too", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const program = await addTestProgram(db, "Prodi Uji Asrama Detail");
      const woman = await addTestStudent(db, program, {
        nim: "9900400302",
        name: "Detail Uji Pembibitan",
        cohortYear: 2023,
        isSeedling: true,
      });
      const man = await addTestStudent(db, program, {
        nim: "9900400303",
        name: "Detail Uji Internasional",
        sex: "male",
        isInternational: true,
      });
      await placeInRoom(db, woman, "wismantara_putri");
      const asking = account(["head_of_unit"]);

      expect(await residenceFor(db, asking, woman)).toEqual({
        dorm: "wismantara_putri",
        room: null,
      });
      expect(await residenceFor(db, asking, man)).toEqual({
        dorm: "wismantara_putra",
        room: null,
      });
    });
  });

  it("gives no residence for a student who lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const program = await addTestProgram(db, "Prodi Uji Asrama Detail");
      const id = await addTestStudent(db, program, {
        nim: "9900400304",
        name: "Detail Uji Semester Lanjut",
        cohortYear: 2023,
      });

      expect(await residenceFor(db, account(["head_of_unit"]), id)).toBeNull();
    });
  });

  it("gives no residence, and no room left behind, once a resident stops being one", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addResident(db);
      await placeInRoom(db, id, "dana_rakca");
      const asking = account(["head_of_unit"]);
      const asResident = await residenceFor(db, asking, id);

      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, id));

      expect(asResident?.dorm).toBe("dana_rakca");
      expect(await residenceFor(db, asking, id)).toBeNull();
    });
  });

  it("counts only Internasional and Pembibitan as residents while no period runs", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama Detail");
      const regular = await addTestStudent(db, program, {
        nim: "9900400305",
        name: "Detail Uji Reguler",
      });
      const seedling = await addTestStudent(db, program, {
        nim: "9900400306",
        name: "Detail Uji Bibit",
        isSeedling: true,
      });
      const asking = account(["head_of_unit"]);

      expect(await residenceFor(db, asking, regular)).toBeNull();
      expect(await residenceFor(db, asking, seedling)).toEqual({
        dorm: "wismantara_putri",
        room: null,
      });
    });
  });
});
