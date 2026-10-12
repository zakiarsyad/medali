import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { dormRooms } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addRoom } from "./add-room";
import { changeRoom } from "./change-room";
import { removeRoom } from "./remove-room";
import type { SentRoom } from "./room-input";
import { readRooms } from "./room-list";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
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
const NO_ROOM = "00000000-0000-4000-8000-000000000000";

const SENT: SentRoom = {
  dorm: "dana_rakca",
  floor: "2",
  number: "M201",
  capacity: "4",
};

describe("addRoom", () => {
  it.each([MANAGER, HOUSEHOLD])("adds a room for $roles", async (actor) => {
    await inTestDatabase(async (db) => {
      const added = await addRoom(db, actor, SENT);

      expect(added).toEqual({ ok: true, value: "M201" });
      expect(await readRooms(db, "dana_rakca")).toMatchObject([
        { floor: 2, number: "M201", capacity: 4, taken: 0 },
      ]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and adds nothing", async (role) => {
    await inTestDatabase(async (db) => {
      expect(await addRoom(db, { roles: [role] }, SENT)).toEqual(NOT_ALLOWED);
      expect(await readRooms(db, "dana_rakca")).toEqual([]);
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
      expect(await readRooms(db, "dana_rakca")).toHaveLength(1);
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
      expect(await readRooms(db, "dana_rakca")).toEqual([]);
    });
  });
});

describe("changeRoom", () => {
  const CHANGED = { number: "M105", capacity: "6" };

  it("changes the number and the kapasitas", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addTestRoom(db, { number: "M101" });

      const changed = await changeRoom(db, MANAGER, roomId, CHANGED);

      expect(changed).toEqual({ ok: true, value: "M105" });
      expect(await readRooms(db, "dana_rakca")).toMatchObject([
        { id: roomId, number: "M105", capacity: 6 },
      ]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and changes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const roomId = await addTestRoom(db, { number: "M101" });

      const changed = await changeRoom(db, { roles: [role] }, roomId, CHANGED);

      expect(changed).toEqual(NOT_ALLOWED);
      expect(await readRooms(db, "dana_rakca")).toMatchObject([
        { number: "M101", capacity: 4 },
      ]);
    });
  });

  it("refuses a kapasitas below the number of residents", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama M");
      const roomId = await addTestRoom(db, { number: "M101" });
      for (const nim of ["9925260001", "9925260002"]) {
        const id = await addTestStudent(db, program, {
          nim,
          name: `Uji ${nim}`,
        });
        await placeTestResident(db, roomId, id);
      }

      const changed = await changeRoom(db, MANAGER, roomId, {
        number: "M101",
        capacity: "1",
      });
      const same = await changeRoom(db, MANAGER, roomId, {
        number: "M101",
        capacity: "2",
      });

      expect(changed).toEqual({
        ok: false,
        error:
          "Kapasitas tidak boleh kurang dari jumlah penghuni kamar (2). Keluarkan penghuni dulu.",
      });
      expect(same.ok).toBe(true);
    });
  });

  it("refuses a number another room of the dorm has", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addTestRoom(db, { number: "M101" });
      await addTestRoom(db, { number: "M102" });

      const changed = await changeRoom(db, MANAGER, roomId, {
        number: "M102",
        capacity: "4",
      });

      expect(changed.ok).toBe(false);
      expect(await readRooms(db, "dana_rakca")).toMatchObject([
        { number: "M101" },
        { number: "M102" },
      ]);
    });
  });

  it("keeps its own number when only the kapasitas changes", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addTestRoom(db, { number: "M101" });

      const changed = await changeRoom(db, MANAGER, roomId, {
        number: "M101",
        capacity: "12",
      });

      expect(changed).toEqual({ ok: true, value: "M101" });
    });
  });

  it.each([NO_ROOM, "bukan-id", ""])("refuses the room id %j", async (id) => {
    await inTestDatabase(async (db) => {
      expect((await changeRoom(db, MANAGER, id, CHANGED)).ok).toBe(false);
    });
  });
});

describe("removeRoom", () => {
  it("removes an empty room", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addTestRoom(db, { number: "M101" });

      const removed = await removeRoom(db, MANAGER, roomId);

      expect(removed).toEqual({ ok: true, value: "M101" });
      expect(await readRooms(db, "dana_rakca")).toEqual([]);
    });
  });

  it.each(READ_ONLY)("refuses %s, and removes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const roomId = await addTestRoom(db, { number: "M101" });

      expect(await removeRoom(db, { roles: [role] }, roomId)).toEqual(
        NOT_ALLOWED,
      );
      expect(await readRooms(db, "dana_rakca")).toHaveLength(1);
    });
  });

  it("refuses a room with a resident, and keeps it", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama M");
      const roomId = await addTestRoom(db, { number: "M101" });
      const id = await addTestStudent(db, program, {
        nim: "9925260001",
        name: "Penghuni Uji",
      });
      await placeTestResident(db, roomId, id);

      const removed = await removeRoom(db, MANAGER, roomId);

      expect(removed).toEqual({
        ok: false,
        error: "Kamar M101 masih berpenghuni. Keluarkan semua penghuni dulu.",
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
      expect((await removeRoom(db, MANAGER, id)).ok).toBe(false);
    });
  });
});
