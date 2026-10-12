import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import type { DormId } from "@/dorms/dorms";
import { autoFillRoom } from "./auto-fill-room";
import { placeResident, type SentPlace } from "./place-resident";
import { listUnplaced, type ResidentScope } from "./room-list";
import { takeOutResident } from "./take-out-resident";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  EVERYONE,
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
const NO_PERIOD = {
  ok: false,
  error:
    "Belum ada periode akademik yang berjalan, jadi penghuni belum bisa diplot. Minta Kepala Unit mengatur periode akademik.",
};
const NO_ROW = "00000000-0000-4000-8000-000000000000";
const DORM: DormId = "wismantara_putri";

interface TestRows {
  program: number;
  roomId: string;
  /** Three women of Wismantara Putri without a room, in NIM order. */
  women: string[];
}

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them.
 */
const ODD_2090 = {
  startYear: 2090,
  term: "odd",
  startsOn: "2090-08-01",
  endsOn: "2091-01-31",
} as const;
const DAY = "2090-10-12";

type Actor = { roles: RoleId[] };

function place(db: Database, actor: Actor, sent: SentPlace) {
  return placeResident(db, actor, sent, DAY);
}

function fill(db: Database, actor: Actor, roomId: string) {
  return autoFillRoom(db, actor, roomId, DAY);
}

/**
 * The running period, a room of Wismantara Putri for 2, and three
 * residents. They are Pembibitan, who live in the dorm in any semester.
 */
async function addTestRows(db: Database): Promise<TestRows> {
  await db.insert(academicPeriods).values(ODD_2090);
  const program = await addTestProgram(db, "Prodi Uji Asrama P");
  const women: string[] = [];
  for (const place of [1, 2, 3]) {
    const id = await addTestStudent(db, program, {
      nim: `992626000${place}`,
      name: `Penghuni Uji ${place}`,
      isSeedling: true,
    });
    women.push(id);
  }
  const roomId = await addTestRoom(db, {
    number: "P101",
    dorm: DORM,
    capacity: 2,
  });
  return { program, roomId, women };
}

async function waitingIn(db: Database): Promise<string[]> {
  const scope: ResidentScope = {
    dorm: DORM,
    dormCohorts: [],
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

        const placed = await place(db, actor, { roomId, studentId });

        expect(placed).toEqual({
          ok: true,
          value: "Penghuni Uji 1 diplot ke kamar P101.",
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

      const placed = await place(db, { roles: [role] }, sent);

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
      const placed = await place(db, MANAGER, sent);

      expect(placed).toEqual(FULL);
      expect(await residentsOfRoom(db, roomId)).toHaveLength(2);
      expect(await waitingIn(db)).toEqual([third]);
    });
  });

  it("refuses a resident who already has a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      const other = await addTestRoom(db, { dorm: DORM, number: "P102" });
      await placeTestResident(db, other, studentId);

      const placed = await place(db, MANAGER, { roomId, studentId });

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
        nim: "9926260009",
        name: "Penghuni Uji Putra",
        sex: "male",
        isSeedling: true,
      });

      const sent = { roomId, studentId: man };
      const placed = await place(db, MANAGER, sent);

      expect(placed).toEqual({
        ok: false,
        error: "Mahasiswa ini bukan penghuni Asrama Wismantara Putri.",
      });
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it.each([
    { isSeedling: false },
    { status: "on_leave" as const },
    { deletedAt: new Date() },
  ])("refuses a student who is no resident: %j", async (change) => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [studentId = ""] = women;
      await db.update(students).set(change).where(eq(students.id, studentId));

      const placed = await place(db, MANAGER, { roomId, studentId });

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
        .set({ sex: "male" })
        .where(eq(students.id, studentId));
      const newRoom = await addTestRoom(db, {
        number: "P101",
        dorm: "wismantara_putra",
      });

      const sent = { roomId: newRoom, studentId };
      const placed = await place(db, MANAGER, sent);

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

      expect((await place(db, MANAGER, sent)).ok).toBe(false);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });
});

describe("a stale place in another room", () => {
  interface Stale {
    roomId: string;
    otherRoom: string;
    /** On leave, with a place in the other room. */
    left: string;
    women: string[];
  }

  async function addStaleElsewhere(db: Database): Promise<Stale> {
    const { program, roomId, women } = await addTestRows(db);
    const left = await addTestStudent(db, program, {
      nim: "9926260008",
      name: "Penghuni Uji Cuti",
      isSeedling: true,
      status: "on_leave",
    });
    const otherRoom = await addTestRoom(db, { dorm: DORM, number: "P104" });
    await placeTestResident(db, otherRoom, left);
    return { roomId, otherRoom, left, women };
  }

  it("is left alone by a placement in this room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, otherRoom, left, women } = await addStaleElsewhere(db);

      const sent = { roomId, studentId: women[0] ?? "" };
      const placed = await place(db, MANAGER, sent);

      expect(placed.ok).toBe(true);
      expect(await residentsOfRoom(db, otherRoom)).toEqual([left]);
    });
  });

  it("is left alone by Isi otomatis in this room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, otherRoom, left } = await addStaleElsewhere(db);

      const filled = await fill(db, MANAGER, roomId);

      expect(filled.ok).toBe(true);
      expect(await residentsOfRoom(db, otherRoom)).toEqual([left]);
    });
  });

  it("does not keep Isi otomatis from placing a resident who now lives in this dorm", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId, women } = await addTestRows(db);
      const menRoom = await addTestRoom(db, {
        dorm: "wismantara_putra",
        number: "P105",
      });
      const moved = await addTestStudent(db, program, {
        nim: "9926260000",
        name: "Penghuni Uji Pindah",
        isSeedling: true,
      });
      await placeTestResident(db, menRoom, moved);

      const filled = await fill(db, MANAGER, roomId);

      expect(filled.ok).toBe(true);
      expect((await residentsOfRoom(db, roomId)).sort()).toEqual(
        [moved, women[0] ?? ""].sort(),
      );
      expect(await residentsOfRoom(db, menRoom)).toEqual([]);
    });
  });
});

describe("placing while no academic period runs", () => {
  /** A resident who went on leave, still with their place in the room. */
  async function addRowsWithoutPeriod(db: Database) {
    const rows = await addTestRows(db);
    const [left = "", waiting = ""] = rows.women;
    await placeTestResident(db, rows.roomId, left);
    await db
      .update(students)
      .set({ status: "on_leave" })
      .where(eq(students.id, left));
    await db.delete(academicPeriods);
    return { roomId: rows.roomId, left, waiting };
  }

  it("refuses to place a resident, and deletes no place", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, left, waiting } = await addRowsWithoutPeriod(db);

      const sent = { roomId, studentId: waiting };
      const placed = await place(db, MANAGER, sent);

      expect(placed).toEqual(NO_PERIOD);
      expect(await residentsOfRoom(db, roomId)).toEqual([left]);
    });
  });

  it("refuses Isi otomatis, and deletes no place", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, left } = await addRowsWithoutPeriod(db);

      expect(await fill(db, MANAGER, roomId)).toEqual(NO_PERIOD);
      expect(await residentsOfRoom(db, roomId)).toEqual([left]);
    });
  });
});

describe("autoFillRoom", () => {
  it("fills the place a resident who went on leave left behind", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [left = "", second = "", third = ""] = women;
      await placeTestResident(db, roomId, left);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, left));

      const filled = await fill(db, MANAGER, roomId);

      expect(filled).toEqual({
        ok: true,
        value: "2 penghuni diplot ke kamar P101.",
      });
      expect((await residentsOfRoom(db, roomId)).sort()).toEqual(
        [second, third].sort(),
      );
    });
  });

  it("says nobody was placed when every resident has a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const other = await addTestRoom(db, {
        dorm: DORM,
        number: "P103",
        capacity: 3,
      });
      for (const studentId of women) {
        await placeTestResident(db, other, studentId);
      }

      expect(await fill(db, MANAGER, roomId)).toEqual({
        ok: false,
        error: "Tidak ada penghuni yang belum diplot di asrama ini.",
      });
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it("fills the free places with residents without a room, in NIM order", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, women } = await addTestRows(db);
      const [first = "", second = "", third = ""] = women;

      const filled = await fill(db, MANAGER, roomId);

      expect(filled).toEqual({
        ok: true,
        value: "2 penghuni diplot ke kamar P101.",
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

      const filled = await fill(db, MANAGER, roomId);

      expect(filled).toEqual({
        ok: true,
        value: "1 penghuni diplot ke kamar P101.",
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
      const menRoom = await addTestRoom(db, {
        number: "P101",
        dorm: "wismantara_putra",
      });

      const filled = await fill(db, MANAGER, menRoom);

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

      expect(await fill(db, MANAGER, roomId)).toEqual(FULL);
      expect(await residentsOfRoom(db, roomId)).toHaveLength(2);
    });
  });

  it.each(READ_ONLY)("refuses %s, and places nobody", async (role) => {
    await inTestDatabase(async (db) => {
      const { roomId } = await addTestRows(db);

      const filled = await fill(db, { roles: [role] }, roomId);

      expect(filled).toEqual(NOT_ALLOWED);
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it.each([NO_ROW, "bukan-id"])("refuses the room id %j", async (id) => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect((await fill(db, MANAGER, id)).ok).toBe(false);
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
      const other = await addTestRoom(db, { dorm: DORM, number: "P102" });
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
