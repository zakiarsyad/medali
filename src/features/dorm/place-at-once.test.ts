import { like } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import {
  academicPeriods,
  dormRoomPlaces,
  dormRooms,
  students,
  studyPrograms,
} from "@/db/schema";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { autoFillRoom } from "./auto-fill-room";
import { changeRoom } from "./change-room";
import { placeResident } from "./place-resident";
import { readRooms } from "./room-list";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  DAY,
  ODD_2026,
  placeTestResident,
  residentsOfRoom,
} from "./test-records";

const own = withOwnTestDatabase("rooms");
const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
const DORM = "wismantara_putri";
const PROGRAM = "Prodi Uji Serentak";
const FULL = { ok: false, error: "Kamar sudah penuh. Pilih kamar lain." };

beforeAll(async () => {
  await own.db.insert(academicPeriods).values(ODD_2026);
});

afterEach(async () => {
  await own.db.delete(dormRoomPlaces);
  await own.db.delete(dormRooms);
  await own.db.delete(students);
  await own.db.delete(studyPrograms).where(like(studyPrograms.name, PROGRAM));
});

/** Saved residents of the dorm, Pembibitan women, in NIM order. */
async function addResidents(howMany: number): Promise<string[]> {
  const program = await addTestProgram(own.db, PROGRAM);
  const ids: string[] = [];
  for (let place = 1; place <= howMany; place += 1) {
    const id = await addTestStudent(own.db, program, {
      nim: `991126000${place}`,
      name: `Penghuni Uji ${place}`,
      isSeedling: true,
    });
    ids.push(id);
  }
  return ids;
}

function addRoom(number: string, capacity: number): Promise<string> {
  return addTestRoom(own.db, { number, dorm: DORM, capacity });
}

type RoomSave = Save<Parsed<string>>;

function place(roomId: string, studentId: string): RoomSave {
  return (db) => placeResident(db, MANAGER, { roomId, studentId }, DAY);
}

function fill(roomId: string): RoomSave {
  return (db) => autoFillRoom(db, MANAGER, roomId, DAY);
}

function change(roomId: string, number: string, capacity: number): RoomSave {
  const sent = { number, capacity: String(capacity) };
  return (db) => changeRoom(db, MANAGER, roomId, sent, DAY);
}

async function capacityOf(roomId: string): Promise<number> {
  const rooms = await readRooms(own.db, DORM, []);
  return rooms.find((room) => room.id === roomId)?.capacity ?? -1;
}

describe("two people changing one room at the same moment", () => {
  it("saves one of two placements into the last free place", async () => {
    const [one = "", two = ""] = await addResidents(2);
    const roomId = await addRoom("T101", 1);

    const both = await own.atOnce(place(roomId, one), place(roomId, two));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(own.db, roomId)).toEqual([one]);
  });

  it("refuses a placement that comes while Isi otomatis fills the room", async () => {
    const [, , three = ""] = await addResidents(3);
    const roomId = await addRoom("T101", 2);

    const both = await own.atOnce(fill(roomId), place(roomId, three));

    expect(both.sooner).toEqual({
      ok: true,
      value: "2 penghuni diplot ke kamar T101.",
    });
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(own.db, roomId)).toHaveLength(2);
  });

  it("lets Isi otomatis fill only what a placement before it left free", async () => {
    const [one = "", , three = ""] = await addResidents(3);
    const roomId = await addRoom("T101", 2);

    const both = await own.atOnce(place(roomId, three), fill(roomId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: true,
      value: "1 penghuni diplot ke kamar T101.",
    });
    expect((await residentsOfRoom(own.db, roomId)).sort()).toEqual(
      [one, three].sort(),
    );
  });

  it("refuses a placement that comes while the kapasitas is made smaller", async () => {
    const [one = "", two = ""] = await addResidents(2);
    const roomId = await addRoom("T101", 2);
    await placeTestResident(own.db, roomId, one);

    const both = await own.atOnce(
      change(roomId, "T101", 1),
      place(roomId, two),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(own.db, roomId)).toEqual([one]);
    expect(await capacityOf(roomId)).toBe(1);
  });

  it("refuses a smaller kapasitas that comes while the last place is filled", async () => {
    const [one = "", two = ""] = await addResidents(2);
    const roomId = await addRoom("T101", 2);
    await placeTestResident(own.db, roomId, one);

    const both = await own.atOnce(
      place(roomId, two),
      change(roomId, "T101", 1),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error:
        "Kapasitas tidak boleh kurang dari jumlah penghuni kamar (2). Keluarkan penghuni dulu.",
    });
    expect(await residentsOfRoom(own.db, roomId)).toHaveLength(2);
    expect(await capacityOf(roomId)).toBe(2);
  });
});

describe("two people giving two rooms the same number at the same moment", () => {
  it("saves one, and tells the other the number is used", async () => {
    const oneRoom = await addRoom("T101", 2);
    const otherRoom = await addRoom("T102", 2);

    const both = await own.atOnce(
      change(oneRoom, "T105", 2),
      change(otherRoom, "T105", 2),
    );

    expect(both.sooner).toEqual({ ok: true, value: "T105" });
    expect(both.later).toEqual({
      ok: false,
      error:
        "Nomor kamar T105 sudah dipakai di Asrama Wismantara Putri. Pakai nomor lain.",
    });
    const rooms = await readRooms(own.db, DORM, []);
    expect(rooms.map((room) => room.number)).toEqual(["T102", "T105"]);
  });
});

describe("Isi otomatis while its only waiting resident gets another room", () => {
  it("places nobody, and says so instead of reporting 0 placed", async () => {
    const [one = ""] = await addResidents(1);
    const taken = await addRoom("T101", 1);
    const filled = await addRoom("T102", 1);

    const both = await own.atOnce(place(taken, one), fill(filled));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error:
        "Tidak ada penghuni yang ditempatkan. Muat ulang halaman untuk melihat daftar terbaru.",
    });
    expect(await residentsOfRoom(own.db, filled)).toEqual([]);
  });
});
