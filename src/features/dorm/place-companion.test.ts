import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
} from "@/dorms/test-records";
import { autoFillRoom } from "./auto-fill-room";
import { changeRoom } from "./change-room";
import { placeCompanion, takeOutCompanion } from "./place-companion";
import { placeResident } from "./place-resident";
import { removeRoom } from "./remove-room";
import { addTestCompanion, companionOf, residentsOfRoom } from "./test-records";

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
const NOT_FOUND = {
  ok: false,
  error: "Kamar atau penghuni tidak ditemukan. Muat ulang halaman.",
};
const NO_ROW = "00000000-0000-4000-8000-000000000000";

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 2062 is in semester 1 in it, angkatan 2061 in
 * semester 3.
 */
const ODD_2062 = {
  startYear: 2062,
  term: "odd",
  startsOn: "2062-08-01",
  endsOn: "2063-01-31",
} as const;
const DAY = "2062-10-12";
const BEFORE_ANY_PERIOD = "2062-01-01";

type Actor = { roles: RoleId[] };

interface TestRows {
  program: number;
  /** A room of Dana Rakca for two. */
  roomId: string;
  /** An active kakak pendamping of Dana Rakca without a room. */
  companion: string;
  /** Two residents of Dana Rakca without a room, in NIM order. */
  residents: string[];
}

async function addTestRows(db: Database): Promise<TestRows> {
  await db.insert(academicPeriods).values(ODD_2062);
  const program = await addTestProgram(db, "Prodi Uji Plot Kakak");
  const roomId = await addTestRoom(db, { number: "KP101", capacity: 2 });
  const companion = await addTestStudent(db, program, {
    nim: "9936610001",
    name: "Sinta Uji",
    cohortYear: 2061,
  });
  await addTestCompanion(db, companion);
  const residents: string[] = [];
  for (const place of [1, 2]) {
    const id = await addTestStudent(db, program, {
      nim: `993662000${place}`,
      name: `Penghuni Uji ${place}`,
      cohortYear: 2062,
    });
    residents.push(id);
  }
  return { program, roomId, companion, residents };
}

/** One more active kakak pendamping of Dana Rakca without a room. */
async function addSecondCompanion(db: Database, program: number) {
  const id = await addTestStudent(db, program, {
    nim: "9936610002",
    name: "Tari Uji",
    cohortYear: 2061,
  });
  await addTestCompanion(db, id);
  return id;
}

function place(
  db: Database,
  roomId: string,
  studentId: string,
  actor: Actor = MANAGER,
  day = DAY,
) {
  return placeCompanion(db, actor, { roomId, studentId }, day);
}

function takeOut(
  db: Database,
  roomId: string,
  studentId: string,
  actor: Actor = MANAGER,
) {
  return takeOutCompanion(db, actor, { roomId, studentId });
}

describe("placeCompanion", () => {
  it.each([MANAGER, HOUSEHOLD])(
    "puts a kakak pendamping into a room for $roles",
    async (actor) => {
      await inTestDatabase(async (db) => {
        const { roomId, companion } = await addTestRows(db);

        const placed = await place(db, roomId, companion, actor);

        expect(placed).toEqual({
          ok: true,
          value: "Sinta Uji diplot ke kamar KP101.",
        });
        expect((await companionOf(db, companion))?.roomId).toBe(roomId);
      });
    },
  );

  it.each(READ_ONLY)("refuses %s, and places nobody", async (role) => {
    await inTestDatabase(async (db) => {
      const { roomId, companion } = await addTestRows(db);

      const placed = await place(db, roomId, companion, { roles: [role] });

      expect(placed).toEqual(NOT_ALLOWED);
      expect((await companionOf(db, companion))?.roomId).toBe(null);
    });
  });

  it("takes one place of the kapasitas, so the room is full sooner", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion, residents } = await addTestRows(db);
      const [one = "", two = ""] = residents;
      await place(db, roomId, companion);
      const sent = { roomId, studentId: one };
      await placeResident(db, MANAGER, sent, DAY);

      const third = await placeResident(
        db,
        MANAGER,
        { roomId, studentId: two },
        DAY,
      );

      expect(third).toEqual(FULL);
      expect(await residentsOfRoom(db, roomId)).toEqual([one]);
    });
  });

  it("refuses a full room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion, residents } = await addTestRows(db);
      for (const studentId of residents) {
        await placeResident(db, MANAGER, { roomId, studentId }, DAY);
      }

      expect(await place(db, roomId, companion)).toEqual(FULL);
      expect((await companionOf(db, companion))?.roomId).toBe(null);
    });
  });

  it("refuses a room that other kakak pendamping fill", async () => {
    await inTestDatabase(async (db) => {
      const { program, companion } = await addTestRows(db);
      const small = await addTestRoom(db, { number: "KP102", capacity: 1 });
      const second = await addSecondCompanion(db, program);
      await place(db, small, second);

      expect(await place(db, small, companion)).toEqual(FULL);
    });
  });

  it("refuses one who has a room already", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion } = await addTestRows(db);
      const other = await addTestRoom(db, { number: "KP102" });
      await place(db, roomId, companion);

      const again = await place(db, other, companion);

      expect(again).toEqual({
        ok: false,
        error:
          "Kakak pendamping ini sudah punya kamar. Keluarkan dari kamarnya dulu.",
      });
      expect((await companionOf(db, companion))?.roomId).toBe(roomId);
    });
  });

  it("refuses a room of a dorm other than the one they serve", async () => {
    await inTestDatabase(async (db) => {
      const { companion } = await addTestRows(db);
      const elsewhere = await addTestRoom(db, {
        number: "KP103",
        dorm: "cipta_bakti",
      });

      expect(await place(db, elsewhere, companion)).toEqual({
        ok: false,
        error: "Kakak pendamping ini bertugas di Asrama Dana Rakca.",
      });
    });
  });

  it("refuses one whose duty was stopped", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId } = await addTestRows(db);
      const stopped = await addTestStudent(db, program, {
        nim: "9936610003",
        name: "Ajeng Uji",
        cohortYear: 2061,
      });
      await addTestCompanion(db, stopped, { isActive: false });

      expect(await place(db, roomId, stopped)).toEqual({
        ok: false,
        error: "Kakak pendamping ini sudah tidak aktif. Muat ulang halaman.",
      });
    });
  });

  it("refuses a student who is no kakak pendamping", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, residents } = await addTestRows(db);

      const placed = await place(db, roomId, residents[0] ?? "");

      expect(placed).toEqual({
        ok: false,
        error: "Kakak pendamping tidak ditemukan. Muat ulang halaman.",
      });
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
    });
  });

  it("refuses one who lives in a dorm now", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId } = await addTestRows(db);
      const resident = await addTestStudent(db, program, {
        nim: "9936620009",
        name: "Pindah Uji",
        cohortYear: 2062,
      });
      await addTestCompanion(db, resident);

      expect(await place(db, roomId, resident)).toEqual({
        ok: false,
        error:
          "Mahasiswa ini sekarang tinggal di asrama, jadi diplot sebagai penghuni.",
      });
    });
  });

  it.each([NO_ROW, "bukan-id", ""])("refuses the room id %j", async (id) => {
    await inTestDatabase(async (db) => {
      const { companion } = await addTestRows(db);

      expect(await place(db, id, companion)).toEqual(NOT_FOUND);
    });
  });

  it("refuses while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion } = await addTestRows(db);

      const placed = await place(
        db,
        roomId,
        companion,
        MANAGER,
        BEFORE_ANY_PERIOD,
      );

      expect(placed.ok).toBe(false);
      expect((await companionOf(db, companion))?.roomId).toBe(null);
    });
  });
});

describe("takeOutCompanion", () => {
  it.each([MANAGER, HOUSEHOLD])(
    "takes a kakak pendamping out of the room for $roles, and keeps the duty",
    async (actor) => {
      await inTestDatabase(async (db) => {
        const { roomId, companion } = await addTestRows(db);
        await place(db, roomId, companion);

        const out = await takeOut(db, roomId, companion, actor);

        expect(out).toEqual({
          ok: true,
          value: "Kakak pendamping dikeluarkan dari kamar.",
        });
        expect(await companionOf(db, companion)).toMatchObject({
          isActive: true,
          roomId: null,
        });
      });
    },
  );

  it.each(READ_ONLY)("refuses %s, and takes nobody out", async (role) => {
    await inTestDatabase(async (db) => {
      const { roomId, companion } = await addTestRows(db);
      await place(db, roomId, companion);

      const out = await takeOut(db, roomId, companion, { roles: [role] });

      expect(out).toEqual(NOT_ALLOWED);
      expect((await companionOf(db, companion))?.roomId).toBe(roomId);
    });
  });

  it("refuses one who is not in that room", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion } = await addTestRows(db);
      const other = await addTestRoom(db, { number: "KP102" });
      await place(db, roomId, companion);

      expect(await takeOut(db, other, companion)).toEqual(NOT_FOUND);
      expect((await companionOf(db, companion))?.roomId).toBe(roomId);
    });
  });
});

describe("a room with a kakak pendamping in it", () => {
  it("is filled by Isi otomatis with residents only, into the places left", async () => {
    await inTestDatabase(async (db) => {
      const { program, roomId, companion, residents } = await addTestRows(db);
      const waiting = await addSecondCompanion(db, program);
      await place(db, roomId, companion);

      const filled = await autoFillRoom(db, MANAGER, roomId, DAY);

      expect(filled).toEqual({
        ok: true,
        value: "1 penghuni diplot ke kamar KP101.",
      });
      expect(await residentsOfRoom(db, roomId)).toEqual([residents[0]]);
      expect((await companionOf(db, waiting))?.roomId).toBe(null);
    });
  });

  it("is not filled by Isi otomatis with a waiting kakak pendamping when no resident waits", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion, residents } = await addTestRows(db);
      const elsewhere = await addTestRoom(db, { number: "KP104" });
      for (const studentId of residents) {
        const sent = { roomId: elsewhere, studentId };
        await placeResident(db, MANAGER, sent, DAY);
      }

      const filled = await autoFillRoom(db, MANAGER, roomId, DAY);

      expect(filled).toEqual({
        ok: false,
        error: "Tidak ada penghuni yang belum diplot di asrama ini.",
      });
      expect((await companionOf(db, companion))?.roomId).toBe(null);
    });
  });

  it("cannot be removed", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion } = await addTestRows(db);
      await place(db, roomId, companion);

      const removed = await removeRoom(db, MANAGER, roomId, DAY);

      expect(removed).toEqual({
        ok: false,
        error: "Kamar KP101 masih terisi. Kosongkan kamar dulu.",
      });
    });
  });

  it("cannot get a kapasitas below its residents and kakak pendamping together", async () => {
    await inTestDatabase(async (db) => {
      const { roomId, companion, residents } = await addTestRows(db);
      await place(db, roomId, companion);
      const sent = { roomId, studentId: residents[0] ?? "" };
      await placeResident(db, MANAGER, sent, DAY);

      const changed = await changeRoom(
        db,
        MANAGER,
        roomId,
        { number: "KP101", capacity: "1" },
        DAY,
      );

      expect(changed).toEqual({
        ok: false,
        error:
          "Kapasitas tidak boleh kurang dari jumlah orang di kamar (2). Keluarkan sebagian dulu.",
      });
    });
  });
});
