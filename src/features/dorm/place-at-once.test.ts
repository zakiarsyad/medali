import { like, sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { type Connection, connect, type Database } from "@/db/connect";
import { applyTableChanges } from "@/db/migrate";
import {
  academicPeriods,
  dormRoomPlaces,
  dormRooms,
  students,
  studyPrograms,
} from "@/db/schema";
import type { Parsed } from "@/parsed";
import { readSetting } from "@/settings";
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

/*
 * Two people at the same moment need two connections that both see the
 * same saved rows, so these checks cannot run inside a transaction that is
 * undone. They get a database of their own, made here and dropped at the
 * end, so no other check ever sees their rows.
 */
const OWN_DATABASE = `medali_test_rooms_${process.pid}`;
const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
/** Long enough for the second save to reach the database and wait there. */
const WAIT_MS = 400;
const DORM = "wismantara_putri";
const PROGRAM = "Prodi Uji Serentak";
const FULL = { ok: false, error: "Kamar sudah penuh. Pilih kamar lain." };

let admin: Connection;
let first: Connection;
let second: Connection;

function ownDatabaseUrl(): string {
  const url = new URL(readSetting("DATABASE_URL"));
  url.pathname = `/${OWN_DATABASE}`;
  return url.href;
}

beforeAll(async () => {
  admin = connect(readSetting("DATABASE_URL"));
  await admin.db.execute(sql.raw(`create database ${OWN_DATABASE}`));
  first = connect(ownDatabaseUrl());
  second = connect(ownDatabaseUrl());
  await applyTableChanges(first.db);
  await first.db.insert(academicPeriods).values(ODD_2026);
});

afterEach(async () => {
  await first.db.delete(dormRoomPlaces);
  await first.db.delete(dormRooms);
  await first.db.delete(students);
  await first.db.delete(studyPrograms).where(like(studyPrograms.name, PROGRAM));
});

afterAll(async () => {
  await first?.close();
  await second?.close();
  await admin.db.execute(
    sql.raw(`drop database if exists ${OWN_DATABASE} with (force)`),
  );
  await admin.close();
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Saved residents of the dorm, Pembibitan women, in NIM order. */
async function addResidents(howMany: number): Promise<string[]> {
  const program = await addTestProgram(first.db, PROGRAM);
  const ids: string[] = [];
  for (let place = 1; place <= howMany; place += 1) {
    const id = await addTestStudent(first.db, program, {
      nim: `991126000${place}`,
      name: `Penghuni Uji ${place}`,
      isSeedling: true,
    });
    ids.push(id);
  }
  return ids;
}

function addRoom(number: string, capacity: number): Promise<string> {
  return addTestRoom(first.db, { number, dorm: DORM, capacity });
}

type Save = (db: Database) => Promise<Parsed<string>>;

interface Both {
  sooner: Parsed<string>;
  later: Parsed<string>;
}

/**
 * Runs one save, and starts a second one on another connection before the
 * first is finished. Confirms the second one waits, then gives both
 * answers.
 */
async function atOnce(soonerSave: Save, laterSave: Save): Promise<Both> {
  let later: Promise<Parsed<string>> | undefined;
  let laterIsDone = false;
  const sooner = await first.db.transaction(async (tx) => {
    const saved = await soonerSave(tx);
    later = laterSave(second.db);
    // Kept from failing the check before it is awaited below.
    later.then(
      () => {
        laterIsDone = true;
      },
      () => {
        laterIsDone = true;
      },
    );
    await wait(WAIT_MS);
    expect(laterIsDone).toBe(false);
    return saved;
  });
  if (!later) throw new Error("The second save was not started.");
  return { sooner, later: await later };
}

function place(roomId: string, studentId: string): Save {
  return (db) => placeResident(db, MANAGER, { roomId, studentId }, DAY);
}

function fill(roomId: string): Save {
  return (db) => autoFillRoom(db, MANAGER, roomId, DAY);
}

function change(roomId: string, number: string, capacity: number): Save {
  const sent = { number, capacity: String(capacity) };
  return (db) => changeRoom(db, MANAGER, roomId, sent, DAY);
}

async function capacityOf(roomId: string): Promise<number> {
  const rooms = await readRooms(first.db, DORM, []);
  return rooms.find((room) => room.id === roomId)?.capacity ?? -1;
}

describe("two people changing one room at the same moment", () => {
  it("saves one of two placements into the last free place", async () => {
    const [one = "", two = ""] = await addResidents(2);
    const roomId = await addRoom("T101", 1);

    const both = await atOnce(place(roomId, one), place(roomId, two));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(first.db, roomId)).toEqual([one]);
  });

  it("refuses a placement that comes while Isi otomatis fills the room", async () => {
    const [, , three = ""] = await addResidents(3);
    const roomId = await addRoom("T101", 2);

    const both = await atOnce(fill(roomId), place(roomId, three));

    expect(both.sooner).toEqual({
      ok: true,
      value: "2 penghuni diplot ke kamar T101.",
    });
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(first.db, roomId)).toHaveLength(2);
  });

  it("lets Isi otomatis fill only what a placement before it left free", async () => {
    const [one = "", , three = ""] = await addResidents(3);
    const roomId = await addRoom("T101", 2);

    const both = await atOnce(place(roomId, three), fill(roomId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: true,
      value: "1 penghuni diplot ke kamar T101.",
    });
    expect((await residentsOfRoom(first.db, roomId)).sort()).toEqual(
      [one, three].sort(),
    );
  });

  it("refuses a placement that comes while the kapasitas is made smaller", async () => {
    const [one = "", two = ""] = await addResidents(2);
    const roomId = await addRoom("T101", 2);
    await placeTestResident(first.db, roomId, one);

    const both = await atOnce(change(roomId, "T101", 1), place(roomId, two));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(first.db, roomId)).toEqual([one]);
    expect(await capacityOf(roomId)).toBe(1);
  });

  it("refuses a smaller kapasitas that comes while the last place is filled", async () => {
    const [one = "", two = ""] = await addResidents(2);
    const roomId = await addRoom("T101", 2);
    await placeTestResident(first.db, roomId, one);

    const both = await atOnce(place(roomId, two), change(roomId, "T101", 1));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error:
        "Kapasitas tidak boleh kurang dari jumlah penghuni kamar (2). Keluarkan penghuni dulu.",
    });
    expect(await residentsOfRoom(first.db, roomId)).toHaveLength(2);
    expect(await capacityOf(roomId)).toBe(2);
  });
});

describe("two people giving two rooms the same number at the same moment", () => {
  it("saves one, and tells the other the number is used", async () => {
    const oneRoom = await addRoom("T101", 2);
    const otherRoom = await addRoom("T102", 2);

    const both = await atOnce(
      change(oneRoom, "T105", 2),
      change(otherRoom, "T105", 2),
    );

    expect(both.sooner).toEqual({ ok: true, value: "T105" });
    expect(both.later).toEqual({
      ok: false,
      error:
        "Nomor kamar T105 sudah dipakai di Asrama Wismantara Putri. Pakai nomor lain.",
    });
    const rooms = await readRooms(first.db, DORM, []);
    expect(rooms.map((room) => room.number)).toEqual(["T102", "T105"]);
  });
});

describe("Isi otomatis while its only waiting resident gets another room", () => {
  it("places nobody, and says so instead of reporting 0 placed", async () => {
    const [one = ""] = await addResidents(1);
    const taken = await addRoom("T101", 1);
    const filled = await addRoom("T102", 1);

    const both = await atOnce(place(taken, one), fill(filled));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error:
        "Tidak ada penghuni yang ditempatkan. Muat ulang halaman untuk melihat daftar terbaru.",
    });
    expect(await residentsOfRoom(first.db, filled)).toEqual([]);
  });
});
