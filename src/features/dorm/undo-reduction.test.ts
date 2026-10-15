// Sample Tahun akademik of this file: 3311 to 3311.
// Sample NIMs of this file: 9986111000 to 9986111099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormViolations } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { reduceViolations } from "./reduce-violations";
import {
  ALREADY_UNDONE,
  OWN_REDUCTION,
  REDUCE_NOT_ALLOWED,
  REDUCED_NOT_FOUND,
} from "./reduction-messages";
import { readStaffViolations } from "./staff-violations";
import { EVERYONE } from "./test-records";
import {
  addViolationActor,
  addViolationSetting,
  linesOf,
} from "./test-violations";
import {
  addTestLetter,
  addTestViolations,
  issuedBy,
  lettersOf,
  periodIdOf,
} from "./test-warnings";
import { undoReduction } from "./undo-reduction";
import { readStaffViolationParams } from "./violation-address";
import { readAnnouncement } from "./violation-announcement";
import { readStandingOf, readWarningSemester } from "./warning-standing";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3311.
const NOW = new Date("3311-10-20T03:00:00Z");
const LATER = new Date("3311-10-20T05:00:00Z");
const REASON = "Terbukti sedang izin resmi pada jam itu.";

/** Ani has 7 counted violations and SP 1; Pengelola Asrama reduced her first. */
async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3311, "Prodi Uji Batal", [
    "9986111001",
    "9986111002",
    "9986111003",
    "9986111004",
    "9986111005",
  ]);
  const [ani = "", bea = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Batal", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji Batal", [
    "dorm_manager",
  ]);
  const periodId = await periodIdOf(db, 3311);
  await addTestLetter(db, {
    studentId: ani,
    periodId,
    level: 1,
    ...issuedBy(manager.id, new Date("3311-10-10T09:00:00Z")),
  });
  const ids = await addTestViolations(db, ani, bam.id, 7, "3311-10-01");
  const [first = ""] = ids;
  await reduceViolations(
    db,
    manager,
    { studentId: ani, violationIds: [first], reason: REASON },
    NOW,
  );
  return { ani, bea, bam, manager, first };
}

async function countedOf(db: Database, studentId: string) {
  const semester = await readWarningSemester(db, LATER);
  if (semester === null) throw new Error("The period was not added.");
  const standing = await readStandingOf(
    db,
    semester,
    EVERYONE,
    studentId,
    LATER,
  );
  return standing?.counted;
}

function boardOf(db: Database, withReductions: boolean) {
  return readStaffViolations(
    db,
    EVERYONE,
    readStaffViolationParams({}),
    LATER,
    withReductions,
    withReductions,
  );
}

describe("undoReduction", () => {
  it("takes the mark away, logs it with the reason undone, and the violation counts again and is back in the announcement, while SP 1 stays", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, first } = await setUp(db);
      expect(await countedOf(db, ani)).toBe(6);

      expect(await undoReduction(db, manager, first)).toEqual({
        ok: true,
        value: null,
      });

      const [kept] = await db
        .select()
        .from(dormViolations)
        .where(eq(dormViolations.id, first));
      expect(kept).toMatchObject({
        reducedAt: null,
        reducedBy: null,
        reductionReason: "",
      });
      const lines = await linesOf(db, first);
      expect(lines.map((line) => [line.action, line.reductionReason])).toEqual([
        ["reduced", REASON],
        ["reduction_undone", REASON],
      ]);
      expect(await countedOf(db, ani)).toBe(7);
      const day = await readAnnouncement(db, EVERYONE, LATER, "3311-10-01", 1);
      expect(day.rows.map((row) => row.id)).toContain(first);
      expect(await lettersOf(db, ani)).toHaveLength(1);
    });
  });

  it("refuses a second undoing, and nothing more is logged", async () => {
    await inTestDatabase(async (db) => {
      const { manager, first } = await setUp(db);

      await undoReduction(db, manager, first);

      expect(await undoReduction(db, manager, first)).toEqual(ALREADY_UNDONE);
      expect(await linesOf(db, first)).toHaveLength(2);
    });
  });

  it.each<RoleId>(["head_of_unit", "bam_bphk", "bam_compliance", "student"])(
    "refuses a hand-made undoing from %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { first } = await setUp(db);
        const other = await addViolationActor(db, "Akun Uji Batal", [role]);

        expect(await undoReduction(db, other, first)).toEqual(
          REDUCE_NOT_ALLOWED,
        );
        expect(await linesOf(db, first)).toHaveLength(1);
      });
    },
  );

  it("refuses a Pengelola Asrama the undoing on their own violation, and what is not a violation", async () => {
    await inTestDatabase(async (db) => {
      const { ani, first } = await setUp(db);
      const own = await addViolationActor(
        db,
        "Pengelola Uji Batal Sendiri",
        ["dorm_manager", "student"],
        ani,
      );
      const manager = await addViolationActor(db, "Pengelola Uji Batal 2", [
        "dorm_manager",
      ]);

      expect(await undoReduction(db, own, first)).toEqual(OWN_REDUCTION);
      expect(await undoReduction(db, manager, "bukan-kunci")).toEqual(
        REDUCED_NOT_FOUND,
      );
      expect(
        await undoReduction(
          db,
          manager,
          "00000000-0000-4000-8000-000000000000",
        ),
      ).toEqual(REDUCED_NOT_FOUND);
    });
  });
});

describe("Riwayat pengurangan pelanggaran", () => {
  it("lists the reduction of the semester with the student, the violation, the reason, who and when", async () => {
    await inTestDatabase(async (db) => {
      const { ani, first } = await setUp(db);

      const board = await boardOf(db, true);

      expect(board.reductions?.matching).toBe(1);
      expect(board.reductions?.rows).toEqual([
        expect.objectContaining({
          id: first,
          studentId: ani,
          name: "Ani Uji Pelanggaran",
          day: "3311-10-01",
          reason: "Terlambat apel pagi",
          reductionReason: REASON,
          reducedBy: "Pengelola Uji Batal",
          reducedAt: NOW,
        }),
      ]);
    });
  });

  it("is not read for an account that does not read reductions", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      expect((await boardOf(db, false)).reductions).toBeNull();
    });
  });

  it("leaves out a reduction once it is undone", async () => {
    await inTestDatabase(async (db) => {
      const { manager, first } = await setUp(db);

      await undoReduction(db, manager, first);

      const board = await boardOf(db, true);
      expect(board.reductions).toMatchObject({ rows: [], matching: 0 });
    });
  });
});
