import { eq, like } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { settleCompanionDuty } from "@/db/companion-duty";
import {
  academicPeriods,
  dormCompanions,
  dormRoomPlaces,
  dormRooms,
  students,
  studyPrograms,
} from "@/db/schema";
import {
  type Hold,
  type Save,
  withOwnTestDatabase,
} from "@/db/test-database-at-once";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  DAY,
  ODD_2026,
  placeTestResident,
} from "@/dorms/test-records";
import type { Parsed } from "@/parsed";
import { autoFillRoom } from "./auto-fill-room";
import { changeRoom } from "./change-room";
import { restartCompanion, stopCompanion } from "./companion-duty";
import { nameCompanion } from "./name-companion";
import { placeCompanion } from "./place-companion";
import { placeResident } from "./place-resident";
import { readRooms } from "./room-list";
import { addTestCompanion, companionOf, residentsOfRoom } from "./test-records";

const own = withOwnTestDatabase("rooms");
const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
const DORM = "wismantara_putri";
const PROGRAM = "Prodi Uji Serentak";
const FULL = { ok: false, error: "Kamar sudah penuh. Pilih kamar lain." };

beforeAll(async () => {
  await own.db.insert(academicPeriods).values(ODD_2026);
});

afterEach(async () => {
  await own.db.delete(dormCompanions);
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
        "Kapasitas tidak boleh kurang dari jumlah orang di kamar (2). Keluarkan sebagian dulu.",
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

describe("Nonaktifkan and placing the same kakak pendamping at the same moment", () => {
  const STOPPED = {
    ok: false,
    error: "Kakak pendamping ini sudah tidak aktif. Muat ulang halaman.",
  };
  const ROOM_CHANGED = {
    ok: false,
    error:
      "Kamar kakak pendamping ini baru saja berubah. Muat ulang halaman, lalu coba lagi.",
  };

  /** A kakak pendamping of Dana Rakca without a room, and a room there. */
  async function addCompanionAndRoom() {
    const program = await addTestProgram(own.db, PROGRAM);
    const studentId = await addTestStudent(own.db, program, {
      nim: "9911240001",
      name: "Kakak Uji",
      cohortYear: 2024,
    });
    await addTestCompanion(own.db, studentId);
    const roomId = await addTestRoom(own.db, { number: "T201" });
    return { studentId, roomId };
  }

  /** "Nonaktifkan" pressed on a screen that showed "Belum diplot". */
  function stop(studentId: string): RoomSave {
    return (db) => stopCompanion(db, MANAGER, { studentId, roomId: "" });
  }

  function placeIn(roomId: string, studentId: string): RoomSave {
    return (db) => placeCompanion(db, MANAGER, { roomId, studentId }, DAY);
  }

  it("refuses the placing that comes second, and the duty stays stopped", async () => {
    const { studentId, roomId } = await addCompanionAndRoom();

    const both = await own.atOnce(stop(studentId), placeIn(roomId, studentId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(STOPPED);
    expect(await companionOf(own.db, studentId)).toMatchObject({
      isActive: false,
      roomId: null,
    });
  });

  it("refuses the Nonaktifkan that comes second, and the room is kept", async () => {
    const { studentId, roomId } = await addCompanionAndRoom();

    const both = await own.atOnce(placeIn(roomId, studentId), stop(studentId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(ROOM_CHANGED);
    expect(await companionOf(own.db, studentId)).toMatchObject({
      isActive: true,
      roomId,
    });
  });
});

describe("a resident and a kakak pendamping taking the last place at the same moment", () => {
  it("saves one of them, and tells the other the room is full", async () => {
    const program = await addTestProgram(own.db, PROGRAM);
    const companion = await addTestStudent(own.db, program, {
      nim: "9911240002",
      name: "Kakak Uji",
      cohortYear: 2024,
    });
    await addTestCompanion(own.db, companion);
    const resident = await addTestStudent(own.db, program, {
      nim: "9911260003",
      name: "Penghuni Uji",
    });
    const roomId = await addTestRoom(own.db, { number: "T202", capacity: 1 });

    const both = await own.atOnce(place(roomId, resident), (db) =>
      placeCompanion(db, MANAGER, { roomId, studentId: companion }, DAY),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(FULL);
    expect(await residentsOfRoom(own.db, roomId)).toEqual([resident]);
    expect((await companionOf(own.db, companion))?.roomId).toBe(null);
  });
});

/** What a change of the student data to Cuti does, in its own transaction. */
function goOnLeave(studentId: string): RoomSave {
  return (db) =>
    db.transaction(async (tx) => {
      await tx
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, studentId));
      await settleCompanionDuty(tx, studentId, DAY);
      return { ok: true, value: "Cuti" };
    });
}

describe("naming a kakak pendamping while the student goes on leave at the same moment", () => {
  async function addSenior(): Promise<string> {
    const program = await addTestProgram(own.db, PROGRAM);
    return addTestStudent(own.db, program, {
      nim: "9911240004",
      name: "Calon Uji",
      cohortYear: 2024,
    });
  }

  function name(studentId: string): RoomSave {
    const sent = { studentId, dorm: "dana_rakca", note: "" };
    return (db) => nameCompanion(db, MANAGER, sent, DAY);
  }

  it("refuses the naming that comes second", async () => {
    const studentId = await addSenior();

    const both = await own.atOnce(goOnLeave(studentId), name(studentId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error: "Mahasiswa tidak ditemukan atau tidak aktif. Muat ulang halaman.",
    });
    expect(await companionOf(own.db, studentId)).toBeUndefined();
  });

  it("ends the duty when the leave comes second", async () => {
    const studentId = await addSenior();

    const both = await own.atOnce(name(studentId), goOnLeave(studentId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later.ok).toBe(true);
    expect((await companionOf(own.db, studentId))?.isActive).toBe(false);
  });
});

describe("Aktifkan while the student goes on leave at the same moment", () => {
  async function addStopped(): Promise<string> {
    const program = await addTestProgram(own.db, PROGRAM);
    const studentId = await addTestStudent(own.db, program, {
      nim: "9911240005",
      name: "Kakak Uji",
      cohortYear: 2024,
    });
    await addTestCompanion(own.db, studentId, { isActive: false });
    return studentId;
  }

  function restart(studentId: string): RoomSave {
    return (db) => restartCompanion(db, MANAGER, studentId, DAY);
  }

  it("refuses the Aktifkan that comes second", async () => {
    const studentId = await addStopped();

    const both = await own.atOnce(goOnLeave(studentId), restart(studentId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error:
        "Mahasiswa ini tidak aktif, jadi tidak bisa diaktifkan sebagai kakak pendamping.",
    });
    expect((await companionOf(own.db, studentId))?.isActive).toBe(false);
  });

  it("ends the duty again when the leave comes second", async () => {
    const studentId = await addStopped();

    const both = await own.atOnce(restart(studentId), goOnLeave(studentId));

    expect(both.sooner.ok).toBe(true);
    expect(both.later.ok).toBe(true);
    expect((await companionOf(own.db, studentId))?.isActive).toBe(false);
  });
});

describe("two people placing in two rooms at the same moment, each removing a place the other one needs gone", () => {
  /** A student row held as a save that gives the student a room holds it. */
  function holdStudent(studentId: string): Hold {
    return (tx) =>
      tx
        .select({ id: students.id })
        .from(students)
        .where(eq(students.id, studentId))
        .for("no key update");
  }

  /** A place held as a save that removes it holds it. */
  function holdPlace(studentId: string): Hold {
    return (tx) =>
      tx
        .select({ studentId: dormRoomPlaces.studentId })
        .from(dormRoomPlaces)
        .where(eq(dormRoomPlaces.studentId, studentId))
        .for("update");
  }

  function placeIn(roomId: string, studentId: string): RoomSave {
    return (db) => placeCompanion(db, MANAGER, { roomId, studentId }, DAY);
  }

  function saved(value: string) {
    return { status: "fulfilled", value: { ok: true, value } };
  }

  /**
   * A resident of Dana Rakca and one of Wismantara Putri, each with a
   * place left behind in a room of the other one's dorm.
   */
  async function addCrossedResidents() {
    const program = await addTestProgram(own.db, PROGRAM);
    const one = await addTestStudent(own.db, program, {
      nim: "9911261101",
      name: "Penghuni Uji Rakca",
    });
    const other = await addTestStudent(own.db, program, {
      nim: "9911261102",
      name: "Penghuni Uji Wismantara",
      isSeedling: true,
    });
    const oneRoom = await addTestRoom(own.db, { number: "T301", capacity: 1 });
    const otherRoom = await addRoom("T302", 1);
    await placeTestResident(own.db, oneRoom, other);
    await placeTestResident(own.db, otherRoom, one);
    return { one, other, oneRoom, otherRoom };
  }

  /**
   * A resident of Wismantara Putri and a kakak pendamping of Dana Rakca,
   * each with a place left behind in a room of the other one's dorm.
   */
  async function addCrossedResidentAndCompanion() {
    const program = await addTestProgram(own.db, PROGRAM);
    const resident = await addTestStudent(own.db, program, {
      nim: "9911261201",
      name: "Penghuni Uji Wismantara",
      isSeedling: true,
    });
    const companion = await addTestStudent(own.db, program, {
      nim: "9911241202",
      name: "Kakak Uji Rakca",
      cohortYear: 2024,
    });
    await addTestCompanion(own.db, companion);
    const residentRoom = await addRoom("T303", 1);
    const companionRoom = await addTestRoom(own.db, { number: "T304" });
    await placeTestResident(own.db, residentRoom, companion);
    await placeTestResident(own.db, companionRoom, resident);
    return { resident, companion, residentRoom, companionRoom };
  }

  it("saves two placings of a resident", async () => {
    const { one, other, oneRoom, otherRoom } = await addCrossedResidents();

    const both = await own.heldAtOnce(
      { hold: holdStudent(one), save: place(oneRoom, one) },
      { hold: holdStudent(other), save: place(otherRoom, other) },
    );

    expect(both.first).toEqual(
      saved("Penghuni Uji Rakca diplot ke kamar T301."),
    );
    expect(both.second).toEqual(
      saved("Penghuni Uji Wismantara diplot ke kamar T302."),
    );
    expect(await residentsOfRoom(own.db, oneRoom)).toEqual([one]);
    expect(await residentsOfRoom(own.db, otherRoom)).toEqual([other]);
  });

  it("saves a placing of a resident and Isi otomatis", async () => {
    const { one, other, oneRoom, otherRoom } = await addCrossedResidents();

    const both = await own.heldAtOnce(
      { hold: holdStudent(one), save: place(oneRoom, one) },
      { hold: holdStudent(other), save: fill(otherRoom) },
    );

    expect(both.first).toEqual(
      saved("Penghuni Uji Rakca diplot ke kamar T301."),
    );
    expect(both.second).toEqual(saved("1 penghuni diplot ke kamar T302."));
    expect(await residentsOfRoom(own.db, oneRoom)).toEqual([one]);
    expect(await residentsOfRoom(own.db, otherRoom)).toEqual([other]);
  });

  it("saves two Isi otomatis", async () => {
    const { one, other, oneRoom, otherRoom } = await addCrossedResidents();

    const both = await own.heldAtOnce(
      { hold: holdStudent(one), save: fill(oneRoom) },
      { hold: holdStudent(other), save: fill(otherRoom) },
    );

    expect(both.first).toEqual(saved("1 penghuni diplot ke kamar T301."));
    expect(both.second).toEqual(saved("1 penghuni diplot ke kamar T302."));
    expect(await residentsOfRoom(own.db, oneRoom)).toEqual([one]);
    expect(await residentsOfRoom(own.db, otherRoom)).toEqual([other]);
  });

  it("saves a placing of a resident and one of a kakak pendamping", async () => {
    const { resident, companion, residentRoom, companionRoom } =
      await addCrossedResidentAndCompanion();

    const both = await own.heldAtOnce(
      { hold: holdStudent(resident), save: place(residentRoom, resident) },
      {
        hold: holdStudent(companion),
        save: placeIn(companionRoom, companion),
      },
    );

    expect(both.first).toEqual(
      saved("Penghuni Uji Wismantara diplot ke kamar T303."),
    );
    expect(both.second).toEqual(saved("Kakak Uji Rakca diplot ke kamar T304."));
    expect(await residentsOfRoom(own.db, residentRoom)).toEqual([resident]);
    expect(await residentsOfRoom(own.db, companionRoom)).toEqual([]);
    expect((await companionOf(own.db, companion))?.roomId).toBe(companionRoom);
  });

  it("saves Isi otomatis and a placing of a kakak pendamping", async () => {
    const { resident, companion, residentRoom, companionRoom } =
      await addCrossedResidentAndCompanion();

    const both = await own.heldAtOnce(
      { hold: holdStudent(resident), save: fill(residentRoom) },
      {
        hold: holdStudent(companion),
        save: placeIn(companionRoom, companion),
      },
    );

    expect(both.first).toEqual(saved("1 penghuni diplot ke kamar T303."));
    expect(both.second).toEqual(saved("Kakak Uji Rakca diplot ke kamar T304."));
    expect(await residentsOfRoom(own.db, residentRoom)).toEqual([resident]);
    expect(await residentsOfRoom(own.db, companionRoom)).toEqual([]);
    expect((await companionOf(own.db, companion))?.roomId).toBe(companionRoom);
  });

  it("saves two placings of a kakak pendamping", async () => {
    const program = await addTestProgram(own.db, PROGRAM);
    const senior = { cohortYear: 2024 };
    const one = await addTestStudent(own.db, program, {
      ...senior,
      nim: "9911241301",
      name: "Kakak Uji Satu",
    });
    const other = await addTestStudent(own.db, program, {
      ...senior,
      nim: "9911241302",
      name: "Kakak Uji Dua",
    });
    // One more place left behind in each room. Holding it keeps each save
    // waiting between the place it removes first and the next one.
    const leftOne = await addTestStudent(own.db, program, {
      ...senior,
      nim: "9911241303",
      name: "Alumni Uji Satu",
    });
    const leftOther = await addTestStudent(own.db, program, {
      ...senior,
      nim: "9911241304",
      name: "Alumni Uji Dua",
    });
    await addTestCompanion(own.db, one);
    await addTestCompanion(own.db, other);
    const oneRoom = await addTestRoom(own.db, { number: "T305" });
    const otherRoom = await addTestRoom(own.db, { number: "T306" });
    await placeTestResident(own.db, oneRoom, other);
    await placeTestResident(own.db, oneRoom, leftOne);
    await placeTestResident(own.db, otherRoom, one);
    await placeTestResident(own.db, otherRoom, leftOther);

    const both = await own.heldAtOnce(
      { hold: holdPlace(leftOne), save: placeIn(oneRoom, one) },
      { hold: holdPlace(leftOther), save: placeIn(otherRoom, other) },
    );

    expect(both.first).toEqual(saved("Kakak Uji Satu diplot ke kamar T305."));
    expect(both.second).toEqual(saved("Kakak Uji Dua diplot ke kamar T306."));
    expect(await residentsOfRoom(own.db, oneRoom)).toEqual([]);
    expect(await residentsOfRoom(own.db, otherRoom)).toEqual([]);
    expect((await companionOf(own.db, one))?.roomId).toBe(oneRoom);
    expect((await companionOf(own.db, other))?.roomId).toBe(otherRoom);
  });
});
