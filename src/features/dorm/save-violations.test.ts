// Sample Tahun akademik of this file: 3151 to 3151.
// Sample NIMs of this file: 9982020000 to 9982020099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { saveViolations } from "./save-violations";
import {
  addViolationActor,
  addViolationSetting,
  linesOf,
  sentList,
  sentRow,
  violationsUnder,
} from "./test-violations";
import {
  ANNOUNCED_BEFORE_DAY,
  DAY_IN_FUTURE,
  NEEDS_REASON,
  NOT_FOR_YOURSELF,
} from "./violation-input";
import {
  LIST_ALREADY_SENT,
  NOT_ALLOWED_TO_RECORD,
  NOT_RESIDENTS,
} from "./violation-messages";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 12 October 3151.
const MOMENT = new Date("3151-10-12T03:00:00Z");
const TODAY = "3151-10-12";

function setUp(db: Database) {
  return addViolationSetting(db, 3151, "Prodi Uji Simpan Pelanggaran", [
    "9982020001",
    "9982020002",
    "9982020003",
    "9982020004",
    "9982020005",
  ]);
}

function bam(db: Database, studentId: string | null = null) {
  return addViolationActor(db, "BAM Uji Simpan", ["bam_compliance"], studentId);
}

describe("saveViolations", () => {
  it("keeps each row in the dorm its resident lives in, as the work of the actor, with a line in the log for each", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const actor = await bam(db);
      const key = crypto.randomUUID();
      const [ani = "", bea = ""] = setting.residents;

      const saved = await saveViolations(
        db,
        actor,
        key,
        sentList(TODAY, [
          sentRow(ani),
          sentRow(setting.otherDorm, {
            punishment: "other",
            otherPunishment: "Menyapu aula",
          }),
          sentRow(bea, { reason: "Keluar asrama tanpa izin" }),
        ]),
        MOMENT,
      );

      expect(saved).toEqual({
        ok: true,
        value: { count: 3, announcedAt: new Date("3151-10-12T14:00:00Z") },
      });
      const kept = await violationsUnder(db, key);
      expect(kept.map((row) => [row.studentId, row.dorm])).toEqual(
        expect.arrayContaining([
          [ani, "dana_rakca"],
          [setting.otherDorm, "cipta_bakti"],
          [bea, "dana_rakca"],
        ]),
      );
      for (const row of kept) {
        expect(row.enteredBy).toBe(actor.id);
        expect(row.enteredAt).toEqual(MOMENT);
        expect(row.cancelledAt).toBeNull();
        const lines = await linesOf(db, row.id);
        expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
          ["entered", actor.id],
        ]);
      }
    });
  });

  it.each([
    "bam_bphk",
    "bam_compliance",
    "bam_spiritual",
    "bam_catering",
    "bam_arts_sports",
    "bam_health",
  ] as RoleId[])("lets %s record", async (role) => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const actor = await addViolationActor(db, "BAM Uji", [role]);

      const saved = await saveViolations(
        db,
        actor,
        crypto.randomUUID(),
        sentList(TODAY, [sentRow(setting.residents[0] ?? "")]),
        MOMENT,
      );

      expect(saved.ok).toBe(true);
    });
  });

  it.each([
    "dorm_manager",
    "head_of_unit",
    "bam_household",
    "director",
    "student",
  ] as RoleId[])(
    "refuses a hand-made list of %s, keeping nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const setting = await setUp(db);
        const actor = await addViolationActor(db, "Bukan BAM Uji", [role]);
        const key = crypto.randomUUID();

        const saved = await saveViolations(
          db,
          actor,
          key,
          sentList(TODAY, [sentRow(setting.residents[0] ?? "")]),
          MOMENT,
        );

        expect(saved).toEqual(NOT_ALLOWED_TO_RECORD);
        expect(await violationsUnder(db, key)).toEqual([]);
      });
    },
  );

  it("refuses a hand-made row for the BAM member's own student, keeping nothing of the list", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const [ani = "", bea = ""] = setting.residents;
      const actor = await bam(db, ani);
      const key = crypto.randomUUID();

      const saved = await saveViolations(
        db,
        actor,
        key,
        sentList(TODAY, [sentRow(bea), sentRow(ani)]),
        MOMENT,
      );

      expect(saved).toEqual({ ok: false, error: NOT_FOR_YOURSELF });
      expect(await violationsUnder(db, key)).toEqual([]);
    });
  });

  it("refuses a student who lives in no dorm, keeping nothing of the list", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const actor = await bam(db);
      const key = crypto.randomUUID();

      const saved = await saveViolations(
        db,
        actor,
        key,
        sentList(TODAY, [
          sentRow(setting.residents[0] ?? ""),
          sentRow(setting.outsider),
        ]),
        MOMENT,
      );

      expect(saved).toEqual(NOT_RESIDENTS);
      expect(await violationsUnder(db, key)).toEqual([]);
    });
  });

  it("refuses a violation day in the future, an announcement before the violation day, and a reason under 3 letters", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const actor = await bam(db);
      const row = sentRow(setting.residents[0] ?? "");

      const lists = [
        [sentList("3151-10-13", [row]), DAY_IN_FUTURE],
        [
          sentList(TODAY, [row], { announceDay: "3151-10-11" }),
          ANNOUNCED_BEFORE_DAY,
        ],
        [sentList(TODAY, [{ ...row, reason: "ab" }]), NEEDS_REASON],
      ] as const;
      for (const [list, error] of lists) {
        const key = crypto.randomUUID();
        expect(await saveViolations(db, actor, key, list, MOMENT)).toEqual({
          ok: false,
          error,
        });
        expect(await violationsUnder(db, key)).toEqual([]);
      }
    });
  });

  it("answers a list sent again as the first time, keeping it once", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const actor = await bam(db);
      const key = crypto.randomUUID();
      const list = sentList(TODAY, [
        sentRow(setting.residents[0] ?? ""),
        sentRow(setting.residents[1] ?? ""),
      ]);

      const first = await saveViolations(db, actor, key, list, MOMENT);
      const second = await saveViolations(db, actor, key, list, MOMENT);

      expect(second).toEqual(first);
      expect(await violationsUnder(db, key)).toHaveLength(2);
    });
  });

  it("refuses a list sent again under its key with other content or by another account", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const actor = await bam(db);
      const other = await addViolationActor(db, "BAM Lain Uji", ["bam_bphk"]);
      const key = crypto.randomUUID();
      const row = sentRow(setting.residents[0] ?? "");
      await saveViolations(db, actor, key, sentList(TODAY, [row]), MOMENT);

      const changed = sentList(TODAY, [{ ...row, reason: "Lain lagi" }]);
      expect(await saveViolations(db, actor, key, changed, MOMENT)).toEqual(
        LIST_ALREADY_SENT,
      );
      expect(
        await saveViolations(db, other, key, sentList(TODAY, [row]), MOMENT),
      ).toEqual(LIST_ALREADY_SENT);
      expect(await violationsUnder(db, key)).toHaveLength(1);
    });
  });
});
