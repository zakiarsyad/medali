// Sample Tahun akademik of this file: 2520 to 2520.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, dormRooms } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { addRoom } from "./add-room";
import { changeRoom } from "./change-room";
import { removeRoom } from "./remove-room";
import type { SentRoom, SentRoomDetails } from "./room-input";
import { readRooms } from "./room-list";
import { residentsOfRoom } from "./test-records";

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
const NO_ROOM = "00000000-0000-4000-8000-000000000000";

const SENT: SentRoom = {
  dorm: "dana_rakca",
  floor: "2",
  number: "M201",
  capacity: "4",
};

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 2520 is in semester 1 in it.
 */
const ODD_2520 = {
  startYear: 2520,
  term: "odd",
  startsOn: "2520-08-01",
  endsOn: "2521-01-31",
} as const;
const DAY = "2520-10-12";

interface LeftBehind {
  roomId: string;
  /** A resident of the room who went on leave, and still has the place. */
  left: string;
}

/** A room whose only place belongs to a student who went on leave. */
async function addRoomLeftBehind(db: Database): Promise<LeftBehind> {
  const program = await addTestProgram(db, "Prodi Uji Asrama M");
  const left = await addTestStudent(db, program, {
    nim: "9925700001",
    name: "Penghuni Uji Cuti",
    cohortYear: 2520,
    status: "on_leave",
  });
  const roomId = await addTestRoom(db, { number: "M101" });
  await placeTestResident(db, roomId, left);
  return { roomId, left };
}

describe("a room with a place left behind", () => {
  const SMALLER = { number: "M101", capacity: "1" };
  const SMALLER_109 = { number: "M109", capacity: "1" };

  it("is removed while a period runs, as the screen shows it empty", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2520);
      const { roomId } = await addRoomLeftBehind(db);

      const removed = await removeRoom(db, MANAGER, roomId, DAY);

      expect(removed).toEqual({ ok: true, value: "M101" });
    });
  });

  it("does not count the place left behind against a smaller kapasitas", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2520);
      const { roomId } = await addRoomLeftBehind(db);
      const program = await addTestProgram(db, "Prodi Uji Asrama M Dua");
      const stays = await addTestStudent(db, program, {
        nim: "9925700002",
        name: "Penghuni Uji",
        cohortYear: 2520,
      });
      await placeTestResident(db, roomId, stays);

      const changed = await changeRoom(db, MANAGER, roomId, SMALLER, DAY);

      expect(changed).toEqual({ ok: true, value: "M101" });
      expect(await residentsOfRoom(db, roomId)).toEqual([stays]);
    });
  });

  it("leaves the stale place of another room alone", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2520);
      const { roomId, left } = await addRoomLeftBehind(db);
      const emptyRoom = await addTestRoom(db, { number: "M109" });

      const changed = await changeRoom(
        db,
        MANAGER,
        emptyRoom,
        SMALLER_109,
        DAY,
      );
      const removed = await removeRoom(db, MANAGER, emptyRoom, DAY);

      expect(changed.ok).toBe(true);
      expect(removed.ok).toBe(true);
      expect(await residentsOfRoom(db, roomId)).toEqual([left]);
    });
  });
});

describe("the rooms while no academic period runs", () => {
  const NO_PERIOD = {
    ok: false,
    error:
      "Belum ada periode akademik yang berjalan, jadi penghuni belum bisa diplot. Minta Kepala Unit mengatur periode akademik.",
  };

  it("refuses to remove a room, and deletes no place", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, left } = await addRoomLeftBehind(db);
      const emptyRoom = await addTestRoom(db, { number: "M109" });

      expect(await removeRoom(db, MANAGER, roomId, DAY)).toEqual(NO_PERIOD);
      expect(await removeRoom(db, MANAGER, emptyRoom, DAY)).toEqual(NO_PERIOD);
      expect(await residentsOfRoom(db, roomId)).toEqual([left]);
      expect(await readRooms(db, "dana_rakca", [])).toHaveLength(2);
    });
  });

  it.each(["1", "6"])(
    "refuses to change the kapasitas to %s, and deletes no place",
    async (capacity) => {
      await inTestDatabase(async (db) => {
        const { roomId, left } = await addRoomLeftBehind(db);

        const sent = { number: "M101", capacity };
        const changed = await changeRoom(db, MANAGER, roomId, sent, DAY);

        expect(changed).toEqual(NO_PERIOD);
        expect(await residentsOfRoom(db, roomId)).toEqual([left]);
        expect(await readRooms(db, "dana_rakca", [])).toMatchObject([
          { number: "M101", capacity: 4 },
        ]);
      });
    },
  );

  it("still changes only the number of a room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, left } = await addRoomLeftBehind(db);

      const sent = { number: "M108", capacity: "4" };
      const changed = await changeRoom(db, MANAGER, roomId, sent, DAY);

      expect(changed).toEqual({ ok: true, value: "M108" });
      expect(await residentsOfRoom(db, roomId)).toEqual([left]);
    });
  });

  it("still adds a room", async () => {
    await inTestDatabase(async (db) => {
      expect((await addRoom(db, MANAGER, SENT)).ok).toBe(true);
    });
  });
});

/** The running period and the first room of a check. */
async function addFirstRoom(db: Database): Promise<string> {
  await db.insert(academicPeriods).values(ODD_2520);
  return addTestRoom(db, { number: "M101" });
}

type Actor = { roles: RoleId[] };

function change(
  db: Database,
  actor: Actor,
  roomId: string,
  sent: SentRoomDetails,
) {
  return changeRoom(db, actor, roomId, sent, DAY);
}

function remove(db: Database, actor: Actor, roomId: string) {
  return removeRoom(db, actor, roomId, DAY);
}

describe("addRoom", () => {
  it.each([MANAGER, HOUSEHOLD])("adds a room for $roles", async (actor) => {
    await inTestDatabase(async (db) => {
      const added = await addRoom(db, actor, SENT);

      expect(added).toEqual({ ok: true, value: "M201" });
      expect(await readRooms(db, "dana_rakca", [2026])).toMatchObject([
        { floor: 2, number: "M201", capacity: 4, taken: 0 },
      ]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and adds nothing", async (role) => {
    await inTestDatabase(async (db) => {
      expect(await addRoom(db, { roles: [role] }, SENT)).toEqual(NOT_ALLOWED);
      expect(await readRooms(db, "dana_rakca", [2026])).toEqual([]);
    });
  });

  it("refuses a number already used in the dorm, whatever the letters", async () => {
    await inTestDatabase(async (db) => {
      await addRoom(db, MANAGER, { ...SENT, number: "M2A" });

      const again = await addRoom(db, MANAGER, {
        ...SENT,
        floor: "3",
        number: " m2a ",
      });

      expect(again).toEqual({
        ok: false,
        error:
          "Nomor kamar M2A sudah dipakai di Asrama Dana Rakca. Pakai nomor lain.",
      });
      expect(await readRooms(db, "dana_rakca", [2026])).toHaveLength(1);
    });
  });

  it("takes a number that another dorm uses", async () => {
    await inTestDatabase(async (db) => {
      await addRoom(db, MANAGER, SENT);

      const other = await addRoom(db, MANAGER, {
        ...SENT,
        dorm: "cipta_bakti",
      });

      expect(other.ok).toBe(true);
    });
  });

  it("refuses a wrong input, and adds nothing", async () => {
    await inTestDatabase(async (db) => {
      const added = await addRoom(db, MANAGER, { ...SENT, capacity: "13" });

      expect(added.ok).toBe(false);
      expect(await readRooms(db, "dana_rakca", [2026])).toEqual([]);
    });
  });
});

describe("changeRoom", () => {
  const CHANGED = { number: "M105", capacity: "6" };

  it("changes the number and the kapasitas", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addFirstRoom(db);

      const changed = await change(db, MANAGER, roomId, CHANGED);

      expect(changed).toEqual({ ok: true, value: "M105" });
      expect(await readRooms(db, "dana_rakca", [2026])).toMatchObject([
        { id: roomId, number: "M105", capacity: 6 },
      ]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and changes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const roomId = await addFirstRoom(db);

      const changed = await change(db, { roles: [role] }, roomId, CHANGED);

      expect(changed).toEqual(NOT_ALLOWED);
      expect(await readRooms(db, "dana_rakca", [2026])).toMatchObject([
        { number: "M101", capacity: 4 },
      ]);
    });
  });

  it("refuses a kapasitas below the number of residents", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama M");
      const roomId = await addFirstRoom(db);
      for (const nim of ["9925260001", "9925260002"]) {
        const id = await addTestStudent(db, program, {
          nim,
          name: `Uji ${nim}`,
          cohortYear: 2520,
        });
        await placeTestResident(db, roomId, id);
      }

      const changed = await change(db, MANAGER, roomId, {
        number: "M101",
        capacity: "1",
      });
      const same = await change(db, MANAGER, roomId, {
        number: "M101",
        capacity: "2",
      });

      expect(changed).toEqual({
        ok: false,
        error:
          "Kapasitas tidak boleh kurang dari jumlah orang di kamar (2). Keluarkan sebagian dulu.",
      });
      expect(same.ok).toBe(true);
    });
  });

  it("refuses a number another room of the dorm has", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addFirstRoom(db);
      await addTestRoom(db, { number: "M102" });

      const changed = await change(db, MANAGER, roomId, {
        number: "M102",
        capacity: "4",
      });

      expect(changed.ok).toBe(false);
      expect(await readRooms(db, "dana_rakca", [2026])).toMatchObject([
        { number: "M101" },
        { number: "M102" },
      ]);
    });
  });

  it("keeps its own number when only the kapasitas changes", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addFirstRoom(db);

      const changed = await change(db, MANAGER, roomId, {
        number: "M101",
        capacity: "12",
      });

      expect(changed).toEqual({ ok: true, value: "M101" });
    });
  });

  it.each([NO_ROOM, "bukan-id", ""])("refuses the room id %j", async (id) => {
    await inTestDatabase(async (db) => {
      expect((await change(db, MANAGER, id, CHANGED)).ok).toBe(false);
    });
  });
});

describe("removeRoom", () => {
  it("removes an empty room", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addFirstRoom(db);

      const removed = await remove(db, MANAGER, roomId);

      expect(removed).toEqual({ ok: true, value: "M101" });
      expect(await readRooms(db, "dana_rakca", [2026])).toEqual([]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and removes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const roomId = await addFirstRoom(db);

      expect(await remove(db, { roles: [role] }, roomId)).toEqual(NOT_ALLOWED);
      expect(await readRooms(db, "dana_rakca", [2026])).toHaveLength(1);
    });
  });

  it("refuses a room with a resident, and keeps it", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama M");
      const roomId = await addFirstRoom(db);
      const id = await addTestStudent(db, program, {
        nim: "9925260001",
        name: "Penghuni Uji",
        cohortYear: 2520,
      });
      await placeTestResident(db, roomId, id);

      const removed = await remove(db, MANAGER, roomId);

      expect(removed).toEqual({
        ok: false,
        error: "Kamar M101 masih terisi. Kosongkan kamar dulu.",
      });
      const kept = await db
        .select()
        .from(dormRooms)
        .where(eq(dormRooms.id, roomId));
      expect(kept).toHaveLength(1);
    });
  });

  it.each([NO_ROOM, "bukan-id"])("refuses the room id %j", async (id) => {
    await inTestDatabase(async (db) => {
      expect((await remove(db, MANAGER, id)).ok).toBe(false);
    });
  });
});
