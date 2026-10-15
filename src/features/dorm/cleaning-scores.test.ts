// Sample Tahun akademik of this file: 3120 to 3120.
// Room numbers of this file: NR101 to NR199, in Cipta Bakti.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, dormCleaningDuties } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestRoom } from "@/dorms/test-records";
import type { CleaningResult, CleaningStatus } from "./cleaning-ids";
import { countWaiting, readRanking } from "./cleaning-scores";
import { removeRoom } from "./remove-room";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/*
 * Every duty here is in Cipta Bakti, read for Cipta Bakti only. The
 * period is far from those of any other file of checks, so a room can be
 * removed in it without waiting for them.
 */
const DORM = "cipta_bakti";
const ODD_3120 = {
  startYear: 3120,
  term: "odd",
  startsOn: "3120-08-01",
  endsOn: "3121-01-31",
} as const;
const TODAY = "3120-10-12";

interface Kept {
  status: CleaningStatus;
  result: CleaningResult | null;
  /** Days before today. */
  daysAgo: number;
  repeatOf?: string;
}

async function addRoom(db: Database, number: string): Promise<string> {
  return addTestRoom(db, { dorm: DORM, number });
}

/** Own-room duties of a room, on days before today, each as given. */
async function addDuties(
  db: Database,
  roomId: string,
  number: string,
  duties: Kept[],
): Promise<string[]> {
  const by = await addTestActor(db, `Pengelola Uji Skor ${number}`, [
    "dorm_manager",
  ]);
  const ids: string[] = [];
  for (const duty of duties) {
    const judged = duty.result !== null;
    const [added] = await db
      .insert(dormCleaningDuties)
      .values({
        day: `3120-10-${String(12 - duty.daysAgo).padStart(2, "0")}`,
        dorm: DORM,
        roomId,
        roomNumber: number,
        createdBy: by.id,
        status: duty.status,
        result: duty.result,
        judgeNote: duty.result === "not_met" ? "Kotor." : "",
        judgedBy: judged ? by.id : null,
        judgedAt: judged ? new Date() : null,
        validatedBy: duty.status === "validated" ? by.id : null,
        validatedAt: duty.status === "validated" ? new Date() : null,
        repeatOf: duty.repeatOf ?? null,
      })
      .returning({ id: dormCleaningDuties.id });
    if (!added) throw new Error("The duty was not added.");
    ids.push(added.id);
  }
  return ids;
}

const MET: Kept = { status: "validated", result: "met", daysAgo: 1 };
const NOT_MET: Kept = { status: "validated", result: "not_met", daysAgo: 2 };

describe("readRanking", () => {
  it("lists the rooms with a validated result, by Skor, then by more +, then by number, counting only validated results", async () => {
    await inTestDatabase(async (db) => {
      const rooms = {
        low: await addRoom(db, "NR101"),
        evenMore: await addRoom(db, "NR103"),
        evenFewer: await addRoom(db, "NR102"),
        best: await addRoom(db, "NR104"),
        unvalidated: await addRoom(db, "NR105"),
      };
      await addDuties(db, rooms.low, "NR101", [
        NOT_MET,
        { ...NOT_MET, daysAgo: 3 },
        MET,
      ]);
      await addDuties(db, rooms.evenMore, "NR103", [
        MET,
        { ...MET, daysAgo: 3 },
        NOT_MET,
        { ...NOT_MET, daysAgo: 4 },
      ]);
      await addDuties(db, rooms.evenFewer, "NR102", [MET, NOT_MET]);
      await addDuties(db, rooms.best, "NR104", [
        MET,
        { ...MET, daysAgo: 2 },
        { status: "judged", result: "not_met", daysAgo: 3 },
      ]);
      await addDuties(db, rooms.unvalidated, "NR105", [
        { status: "judged", result: "met", daysAgo: 1 },
        { status: "scheduled", result: null, daysAgo: 2 },
      ]);

      const ranking = await readRanking(db, [DORM], 1);

      expect(ranking.matching).toBe(4);
      expect(
        ranking.rooms.map(({ number, plus, minus }) => [number, plus, minus]),
      ).toEqual([
        ["NR104", 2, 0],
        ["NR103", 2, 2],
        ["NR102", 1, 1],
        ["NR101", 1, 2],
      ]);
      expect(await readRanking(db, ["dana_rakca"], 1)).toMatchObject({
        matching: 0,
        rooms: [],
      });
    });
  });

  it("shows 20 rooms a page", async () => {
    await inTestDatabase(async (db) => {
      for (let place = 1; place <= 21; place += 1) {
        const number = `NR1${String(place).padStart(2, "0")}`;
        const roomId = await addRoom(db, number);
        await addDuties(db, roomId, number, [MET]);
      }

      const first = await readRanking(db, [DORM], 1);
      const second = await readRanking(db, [DORM], 2);

      expect(first.matching).toBe(21);
      expect(first.rooms).toHaveLength(20);
      expect(second.page).toBe(2);
      expect(second.rooms.map((room) => room.number)).toEqual(["NR121"]);
    });
  });

  it("leaves out a room removed on Ploting kamar, whose validated results stay with its number", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_3120);
      const kept = await addRoom(db, "NR131");
      const removed = await addRoom(db, "NR132");
      await addDuties(db, kept, "NR131", [MET]);
      const [dutyId = ""] = await addDuties(db, removed, "NR132", [
        MET,
        { ...MET, daysAgo: 2 },
      ]);

      const removal = await removeRoom(
        db,
        { roles: ["dorm_manager"] },
        removed,
        TODAY,
      );

      expect(removal.ok).toBe(true);
      const ranking = await readRanking(db, [DORM], 1);
      expect(ranking.rooms.map((room) => room.number)).toEqual(["NR131"]);
      const [history] = await db
        .select()
        .from(dormCleaningDuties)
        .where(eq(dormCleaningDuties.id, dutyId));
      expect(history).toMatchObject({
        roomId: null,
        roomNumber: "NR132",
        status: "validated",
        result: "met",
      });
    });
  });
});

describe("countWaiting", () => {
  it("counts the duties Dinilai BAM and the repeats still Terjadwal, of every date", async () => {
    await inTestDatabase(async (db) => {
      const roomId = await addRoom(db, "NR141");
      const [failed = "", judgedRepeatOf = ""] = await addDuties(
        db,
        roomId,
        "NR141",
        [NOT_MET, { ...NOT_MET, daysAgo: 5 }],
      );
      await addDuties(db, roomId, "NR141", [
        { status: "judged", result: "met", daysAgo: 3 },
        { status: "judged", result: "not_met", daysAgo: 4 },
        { status: "scheduled", result: null, daysAgo: 0, repeatOf: failed },
        {
          status: "judged",
          result: "met",
          daysAgo: 6,
          repeatOf: judgedRepeatOf,
        },
        { status: "scheduled", result: null, daysAgo: 7 },
      ]);

      expect(await countWaiting(db, [DORM])).toEqual({
        waiting: 3,
        repeats: 1,
      });
      expect(await countWaiting(db, ["dana_rakca"])).toEqual({
        waiting: 0,
        repeats: 0,
      });
    });
  });
});
