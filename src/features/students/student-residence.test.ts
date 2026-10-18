// Sample NIMs of this file: 9900400300 to 9900400399.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  dormCompanions,
  dormRoomPlaces,
  dormRooms,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { DormId } from "@/dorms/dorms";
import type { RunningPeriod } from "./semester-now";
import { readStudentDetail } from "./student-detail";
import type { StudentResidence } from "./student-residence";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

/** The period the checks run in: angkatan 2026 is in semester 1. */
const ODD_2026 = {
  startYear: 2026,
  term: "odd",
} as const;

const NO_SUCH_ID = "00000000-0000-4000-8000-000000000000";

/** A floor and a room number that no other file of checks uses. */
const FLOOR = 7;
const ROOM_NUMBER = "U9107";
const COMPANION_ROOM_NUMBER = "U9108";

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
  period: RunningPeriod = ODD_2026,
): Promise<StudentResidence | null | undefined> {
  const answer = await readStudentDetail(db, asking, id, period);
  return answer.kind === "found" ? answer.student.residence : undefined;
}

describe("the Asrama line of a student's detail", () => {
  it("gives Kepala Unit the dorm, the floor and the room of a resident", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addResident(db);
      await placeInRoom(db, id, "dana_rakca");

      expect(await residenceFor(db, account(["head_of_unit"]), id)).toEqual({
        dorm: "dana_rakca",
        room: {
          plotted: true,
          dorm: "dana_rakca",
          floor: FLOOR,
          number: ROOM_NUMBER,
          asCompanion: false,
        },
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
          ODD_2026,
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
        dorm: "dana_rakca",
        floor: FLOOR,
        number: ROOM_NUMBER,
        asCompanion: false,
      });
    });
  });

  it("gives the dorm only for a resident of Asrama Wismantara, to Kepala Unit too", async () => {
    await inTestDatabase(async (db) => {
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

      expect(await residenceFor(db, asking, regular, null)).toBeNull();
      expect(await residenceFor(db, asking, seedling, null)).toEqual({
        dorm: "wismantara_putri",
        room: null,
      });
    });
  });
});

/** A Pembibitan woman of Wismantara Putri, kakak pendamping in a room. */
async function addWismantaraCompanion(db: Database) {
  const program = await addTestProgram(db, "Prodi Uji Asrama Pendamping");
  const id = await addTestStudent(db, program, {
    nim: "9900400307",
    name: "Detail Uji Pendamping",
    cohortYear: 2023,
    isSeedling: true,
  });
  const [room] = await db
    .insert(dormRooms)
    .values({
      dorm: "dana_rakca",
      floor: 1,
      number: COMPANION_ROOM_NUMBER,
      capacity: 4,
    })
    .returning({ id: dormRooms.id });
  if (!room) throw new Error("The room was not added.");
  await db
    .insert(dormCompanions)
    .values({ studentId: id, dorm: "dana_rakca", roomId: room.id });
  return { program, id };
}

describe("the Asrama line of a kakak pendamping who lives in Wismantara", () => {
  it("gives Kepala Unit the dorm they serve, with the kakak pendamping room", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addWismantaraCompanion(db);

      expect(await residenceFor(db, account(["head_of_unit"]), id)).toEqual({
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

  it("gives the dorm only again once the duty is stopped", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addWismantaraCompanion(db);

      await db
        .update(dormCompanions)
        .set({ isActive: false, roomId: null })
        .where(eq(dormCompanions.studentId, id));

      expect(await residenceFor(db, account(["head_of_unit"]), id)).toEqual({
        dorm: "wismantara_putri",
        room: null,
      });
    });
  });

  it("gives Direktur the dorm they serve only, with no room in the answer", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addWismantaraCompanion(db);

      const answer = await readStudentDetail(
        db,
        account(["director"]),
        id,
        ODD_2026,
      );

      expect(answer).toMatchObject({
        kind: "found",
        student: { residence: { dorm: "dana_rakca", room: null } },
      });
      expect(JSON.stringify(answer)).not.toContain(COMPANION_ROOM_NUMBER);
    });
  });

  it("gives no room to a role that may not see the student", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addWismantaraCompanion(db);
      const otherProgram = await addTestProgram(db, "Prodi Uji Asrama Lain");

      const refused = await readStudentDetail(
        db,
        account(["dorm_manager"]),
        id,
        ODD_2026,
      );
      const outside = await readStudentDetail(
        db,
        account(["head_of_program"], otherProgram),
        id,
        ODD_2026,
      );

      expect(refused).toEqual({ kind: "refused" });
      expect(outside).toEqual({ kind: "not_found" });
    });
  });
});
