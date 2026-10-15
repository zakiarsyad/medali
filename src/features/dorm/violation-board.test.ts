// Sample Tahun akademik of this file: 3156 to 3156.
// Sample NIMs of this file: 9982070000 to 9982070099.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelViolation } from "./cancel-violation";
import { saveViolations } from "./save-violations";
import { EVERYONE } from "./test-records";
import {
  addViolationActor,
  addViolationSetting,
  sentList,
  sentRow,
  violationsUnder,
} from "./test-violations";
import { readAnnouncement } from "./violation-announcement";
import {
  readStudentViolations,
  readViolationNumbers,
  readViolationRekap,
} from "./violation-board";
import type { SentViolationRow } from "./violation-input";

const inTestDatabase = withTestDatabase();

const ODD = { from: "3156-08-01", before: "3157-02-01" };
const EVEN = { from: "3157-02-01", before: null };
// 22:00 on campus on 3 February 3157.
const NOW = new Date("3157-02-03T15:00:00Z");

/** 10:00 on campus on a day, when the list of the day is saved. */
function morningOf(day: string): Date {
  return new Date(`${day}T10:00:00+07:00`);
}

interface Setting {
  ani: string;
  bea: string;
  cici: string;
}

/**
 * Two violations of Ani and one of Bea on 30 January, gone up; one of Ani
 * on 2 February, gone up; Ani and Cici on 3 February announced at 20:00,
 * in Masa advokasi; Dodi on 3 February waiting for 23:00; and Bea on
 * 1 February, cancelled before its hour.
 */
async function setUp(db: Database): Promise<Setting> {
  const setting = await addViolationSetting(
    db,
    3156,
    "Prodi Uji Rekap Pelanggaran",
    ["9982070001", "9982070002", "9982070003", "9982070004", "9982070005"],
  );
  await db.insert(academicPeriods).values({
    startYear: 3156,
    term: "even",
    startsOn: "3157-02-01",
    endsOn: "3157-07-31",
  });
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const actor = await addViolationActor(db, "BAM Uji Rekap", ["bam_bphk"]);
  async function save(day: string, rows: SentViolationRow[], time = "21:00") {
    const key = crypto.randomUUID();
    const list = sentList(day, rows, { announceTime: time });
    const saved = await saveViolations(db, actor, key, list, morningOf(day));
    if (!saved.ok) throw new Error(saved.error);
    return key;
  }
  await save("3157-01-30", [sentRow(ani), sentRow(ani), sentRow(bea)]);
  await save("3157-02-02", [sentRow(ani)]);
  await save("3157-02-03", [sentRow(ani), sentRow(cici)], "20:00");
  await save("3157-02-03", [sentRow(setting.otherDorm)], "23:00");
  const cancelled = await save("3157-02-01", [sentRow(bea)]);
  const [row] = await violationsUnder(db, cancelled);
  const undone = await cancelViolation(
    db,
    actor,
    row?.id ?? "",
    new Date("3157-02-01T11:00:00+07:00"),
  );
  if (!undone.ok) throw new Error(undone.error);
  return { ani, bea, cici };
}

describe("readViolationNumbers", () => {
  it("counts today's announcements, those in Masa advokasi, and those of the semester gone up, never a cancelled or waiting one", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      expect(await readViolationNumbers(db, EVERYONE, NOW, EVEN)).toEqual({
        announcedToday: 2,
        inAppeal: 2,
        escalated: 1,
      });
      expect(
        (await readViolationNumbers(db, EVERYONE, NOW, ODD)).escalated,
      ).toBe(3);
    });
  });

  it("moves a violation up exactly 3 hours after its announcement, and announces one at its hour", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);
      // 23:00 on campus on 3 February 3157.
      const later = new Date("3157-02-03T16:00:00Z");

      expect(await readViolationNumbers(db, EVERYONE, later, EVEN)).toEqual({
        announcedToday: 3,
        inAppeal: 1,
        escalated: 3,
      });
    });
  });
});

describe("readViolationRekap", () => {
  it("lists each student with an announced violation of the semester, the most Tercatat first", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      const even = await readViolationRekap(db, EVERYONE, NOW, EVEN, "", 1);
      const odd = await readViolationRekap(db, EVERYONE, NOW, ODD, "", 1);

      expect(
        even.rows.map((row) => [row.name, row.escalated, row.inAppeal]),
      ).toEqual([
        ["Ani Uji Pelanggaran", 1, 1],
        ["Cici Uji Pelanggaran", 0, 1],
      ]);
      expect(even.matching).toBe(2);
      expect(
        odd.rows.map((row) => [row.name, row.escalated, row.dorm]),
      ).toEqual([
        ["Ani Uji Pelanggaran", 2, "dana_rakca"],
        ["Bea Uji Pelanggaran", 1, "dana_rakca"],
      ]);
    });
  });

  it("finds a student by name or NIM", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      const byName = await readViolationRekap(
        db,
        EVERYONE,
        NOW,
        EVEN,
        "cici",
        1,
      );
      const byNim = await readViolationRekap(
        db,
        EVERYONE,
        NOW,
        EVEN,
        "9982070001",
        1,
      );

      expect(byName.rows.map((row) => row.name)).toEqual([
        "Cici Uji Pelanggaran",
      ]);
      expect(byNim.rows.map((row) => row.name)).toEqual([
        "Ani Uji Pelanggaran",
      ]);
    });
  });
});

describe("readStudentViolations", () => {
  it("gives one student's announced violations of the semester, the latest first", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea } = await setUp(db);

      const even = await readStudentViolations(db, EVERYONE, ani, NOW, EVEN, 1);
      const cancelledOnly = await readStudentViolations(
        db,
        EVERYONE,
        bea,
        NOW,
        EVEN,
        1,
      );

      expect(even?.rows.map((row) => row.day)).toEqual([
        "3157-02-03",
        "3157-02-02",
      ]);
      expect(even?.name).toBe("Ani Uji Pelanggaran");
      expect(cancelledOnly).toBeNull();
    });
  });
});

describe("readAnnouncement", () => {
  it("offers every day with an announced violation, shows the latest at first, and another day when asked", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      const first = await readAnnouncement(db, EVERYONE, NOW, null, 1);
      const asked = await readAnnouncement(db, EVERYONE, NOW, "3157-01-30", 1);
      const unknown = await readAnnouncement(db, EVERYONE, NOW, "x", 1);

      expect(first.days).toEqual([
        { day: "3157-02-03", count: 2 },
        { day: "3157-02-02", count: 1 },
        { day: "3157-01-30", count: 3 },
      ]);
      expect(first.day).toBe("3157-02-03");
      expect(first.rows.map((row) => row.name)).toEqual([
        "Ani Uji Pelanggaran",
        "Cici Uji Pelanggaran",
      ]);
      expect(asked.rows).toHaveLength(3);
      expect(unknown.day).toBe("3157-02-03");
    });
  });

  it("shows nothing before its hour", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);
      // 19:59 on campus on 3 February 3157.
      const before = new Date("3157-02-03T12:59:00Z");

      const shown = await readAnnouncement(db, EVERYONE, before, null, 1);

      expect(shown.day).toBe("3157-02-02");
    });
  });
});
