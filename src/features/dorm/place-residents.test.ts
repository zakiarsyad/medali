import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { autoFillRoom } from "./auto-fill-room";
import { placeResident } from "./place-resident";
import { listUnplaced } from "./room-list";
import { takeOutResident } from "./take-out-resident";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  DAY,
  EVERYONE,
  ODD_2026,
  placeTestResident,
  residentsOfRoom,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
const HOUSEHOLD = { roles: ["bam_household"] as RoleId[] };
const READ_ONLY: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "bam_bphk",
  "student",
  "mentor",
  "bam_compliance",
];
const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola ploting kamar.",
};
const FULL = { ok: false, error: "Kamar sudah penuh. Pilih kamar lain." };
const NO_ROW = "00000000-0000-4000-8000-000000000000";

interface TestRows {
  program: number;
  roomId: string;
  /** Three women of Dana Rakca without a room, in NIM order. */
  women: string[];
}

/** The running period, a room of Dana Rakca for 2, and three residents. */
async function addTestRows(db: Database): Promise<TestRows> {
  await db.insert(academicPeriods).values(ODD_2026);
  const program = await addTestProgram(db, "Prodi Uji Asrama");
  const women: string[] = [];
  for (const place of [1, 2, 3]) {
    const id = await addTestStudent(db, program, {
      nim: `991126000${place}`,
      name: `Penghuni Uji ${place}`,
    });
    women.push(id);
  }
  const roomId = await addTestRoom(db, { capacity: 2 });
  return { program, roomId, women };
}

async function waitingIn(db: Database): Promise<string[]> {
  const scope = {
    dorm: "dana_rakca" as const,
    dormCohorts: [2026],
    visible: EVERYONE,
  };
  const unplaced = await listUnplaced(db, scope, "");
  return unplaced.shown.map((resident) => resident.id);
}

describe("placeResident", () => {
  it.each([MANAGER, HOUSEHOLD])(
    "puts a resident into a room for $roles",
    async (actor) => {
      await inTestDatabase(async (db) => {
        const { roomId, women } = await addTestRows(db);
        const [studentId = ""] = women;

        const placed = await placeResident(
          db,
          actor,
          { roomId, studentId },
          DAY,
        );

        expect(placed).toEqual({
          ok: true,
          value: "Penghuni Uji 1 diplot ke kamar 101.",
        });
        expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
        expect(await waitingIn(db)).toEqual(women.slice(1));
      });
    },
  );

  it.each(READ_ONLY)("refuses %s, and places nobody", async (role) => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const sent = { roomId, studentId: women[0] ?? "" };

      const placed = await placeResident(db, { roles: [role] }, sent, DAY);

      expect(placed).toEqual(NOT_ALLOWED);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it("refuses a full room, and keeps the resident without a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [first = "", second = "", third = ""] = women;
      await placeTestResident(db, roomId, first);
      await placeTestResident(db, roomId, second);

      const sent = { roomId, studentId: third };
      const placed = await placeResident(db, MANAGER, sent, DAY);

      expect(placed).toEqual(FULL);
      expect(await residentsOfRoom(db, roomId)).toHaveLength(2);
      expect(await waitingIn(db)).toEqual([third]);
    });
  });

  it("refuses a resident who already has a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      const other = await addTestRoom(db, { number: "102" });
      await placeTestResident(db, other, studentId);

      const placed = await placeResident(
        db,
        MANAGER,
        { roomId, studentId },
        DAY,
      );

      expect(placed).toEqual({
        ok: false,
        error: "Penghuni ini sudah punya kamar. Keluarkan dari kamarnya dulu.",
      });
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
      expect(await residentsOfRoom(db, other)).toEqual([studentId]);
    });
  });

  it("refuses a resident of another dorm", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId } = await addTestRows(db);
      const man = await addTestStudent(db, program, {
        nim: "9911260009",
        name: "Penghuni Uji Putra",
        sex: "male",
      });

      const sent = { roomId, studentId: man };
      const placed = await placeResident(db, MANAGER, sent, DAY);

      expect(placed).toEqual({
        ok: false,
        error: "Mahasiswa ini bukan penghuni Asrama Dana Rakca.",
      });
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it.each([
    { cohortYear: 2025 },
    { status: "on_leave" as const },
    { deletedAt: new Date() },
  ])("refuses a student who is no resident: %j", async (change) => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      await db.update(students).set(change).where(eq(students.id, studentId));

      const placed = await placeResident(
        db,
        MANAGER,
        { roomId, studentId },
        DAY,
      );

      expect(placed.ok).toBe(false);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it("moves a resident whose dorm changed out of the old room first", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      await placeTestResident(db, roomId, studentId);
      await db
        .update(students)
        .set({ isSeedling: true })
        .where(eq(students.id, studentId));
      const newRoom = await addTestRoom(db, { dorm: "wismantara_putri" });

      const sent = { roomId: newRoom, studentId };
      const placed = await placeResident(db, MANAGER, sent, DAY);

      expect(placed.ok).toBe(true);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
      expect(await residentsOfRoom(db, newRoom)).toEqual([studentId]);
    });
  });

  it.each([
    { roomId: NO_ROW },
    { roomId: "bukan-id" },
    { studentId: NO_ROW },
    { studentId: "" },
  ])("refuses what does not exist: %j", async (wrong) => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const sent = { roomId, studentId: women[0] ?? "", ...wrong };

      expect((await placeResident(db, MANAGER, sent, DAY)).ok).toBe(false);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });
});

describe("autoFillRoom", () => {
  it("fills the free places with residents without a room, in NIM order", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [first = "", second = "", third = ""] = women;

      const filled = await autoFillRoom(db, MANAGER, roomId, DAY);

      expect(filled).toEqual({
        ok: true,
        value: "2 penghuni diplot ke kamar 101.",
      });
      expect((await residentsOfRoom(db, roomId)).sort()).toEqual(
        [first, second].sort(),
      );
      expect(await waitingIn(db)).toEqual([third]);
    });
  });

  it("fills only the places that are still free", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [first = "", second = "", third = ""] = women;
      await placeTestResident(db, roomId, third);

      const filled = await autoFillRoom(db, MANAGER, roomId, DAY);

      expect(filled).toEqual({
        ok: true,
        value: "1 penghuni diplot ke kamar 101.",
      });
      expect((await residentsOfRoom(db, roomId)).sort()).toEqual(
        [first, third].sort(),
      );
      expect(await waitingIn(db)).toEqual([second]);
    });
  });

  it("takes only residents of the dorm of the room", async () => {
    await inTestDatabase(async (db) => {
      const { women } = await addTestRows(db);
      const menRoom = await addTestRoom(db, { dorm: "cipta_bakti" });

      const filled = await autoFillRoom(db, MANAGER, menRoom, DAY);

      expect(filled).toEqual({
        ok: false,
        error: "Tidak ada penghuni yang belum diplot di asrama ini.",
      });
      expect(await residentsOfRoom(db, menRoom)).toEqual([]);
      expect(await waitingIn(db)).toEqual(women);
    });
  });

  it("refuses a full room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [first = "", second = ""] = women;
      await placeTestResident(db, roomId, first);
      await placeTestResident(db, roomId, second);

      expect(await autoFillRoom(db, MANAGER, roomId, DAY)).toEqual(FULL);
      expect(await residentsOfRoom(db, roomId)).toHaveLength(2);
    });
  });

  it.each(READ_ONLY)("refuses %s, and places nobody", async (role) => {
    await inTestDatabase(async (db) => {
      const { roomId } = await addTestRows(db);

      const filled = await autoFillRoom(db, { roles: [role] }, roomId, DAY);

      expect(filled).toEqual(NOT_ALLOWED);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it.each([NO_ROW, "bukan-id"])("refuses the room id %j", async (id) => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect((await autoFillRoom(db, MANAGER, id, DAY)).ok).toBe(false);
    });
  });
});

describe("takeOutResident", () => {
  it("takes a resident out, back to those without a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      await placeTestResident(db, roomId, studentId);

      const out = await takeOutResident(db, MANAGER, { roomId, studentId });

      expect(out.ok).toBe(true);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
      expect(await waitingIn(db)).toEqual(women);
    });
  });

  it.each(READ_ONLY)("refuses %s, and keeps the resident", async (role) => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      await placeTestResident(db, roomId, studentId);

      const out = await takeOutResident(
        db,
        { roles: [role] },
        { roomId, studentId },
      );

      expect(out).toEqual(NOT_ALLOWED);
      expect(await residentsOfRoom(db, roomId)).toEqual([studentId]);
    });
  });

  it("refuses a resident who is in another room, and keeps them there", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      const other = await addTestRoom(db, { number: "102" });
      await placeTestResident(db, other, studentId);

      const out = await takeOutResident(db, MANAGER, { roomId, studentId });

      expect(out.ok).toBe(false);
      expect(await residentsOfRoom(db, other)).toEqual([studentId]);
    });
  });

  it.each([{ roomId: "bukan-id" }, { studentId: "" }])(
    "refuses what is not an id: %j",
    async (wrong) => {
      await inTestDatabase(async (db) => {
        const { roomId, women } = await addTestRows(db);
        const sent = { roomId, studentId: women[0] ?? "", ...wrong };

        expect((await takeOutResident(db, MANAGER, sent)).ok).toBe(false);
      });
    },
  );
});
