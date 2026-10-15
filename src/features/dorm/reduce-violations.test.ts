// Sample Tahun akademik of this file: 3712 to 3712.
// Sample NIMs of this file: 9986112000 to 9986112099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormViolations } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { reduceViolations } from "./reduce-violations";
import {
  ALREADY_REDUCED,
  NOT_ESCALATED,
  OWN_REDUCTION,
  REDUCE_NOT_ALLOWED,
  REDUCED_NOT_FOUND,
} from "./reduction-messages";
import { REDUCTION_REASON_TOO_SHORT } from "./reduction-rules";
import { readStaffViolations } from "./staff-violations";
import { EVERYONE } from "./test-records";
import {
  addTestAppeal,
  addTestViolation,
  addViolationActor,
  addViolationSetting,
  linesOf,
} from "./test-violations";
import { addTestViolations } from "./test-warnings";
import { readStaffViolationParams } from "./violation-address";
import { readAnnouncement } from "./violation-announcement";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3712.
const NOW = new Date("3712-10-20T03:00:00Z");
const REASON = "Terbukti sedang izin resmi pada jam itu.";

/** Ani has 7 counted violations, so she is called for SP 1; Bea has 8. */
async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3712, "Prodi Uji Kurangi", [
    "9986112001",
    "9986112002",
    "9986112003",
    "9986112004",
    "9986112005",
  ]);
  const [ani = "", bea = "", cici = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Kurangi", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji Kurangi", [
    "dorm_manager",
  ]);
  const aniIds = await addTestViolations(db, ani, bam.id, 7, "3712-10-01");
  const beaIds = await addTestViolations(db, bea, bam.id, 8, "3712-10-01");
  return { ani, bea, cici, bam, manager, aniIds, beaIds };
}

function reduce(
  db: Database,
  actor: Parameters<typeof reduceViolations>[1],
  studentId: string,
  violationIds: unknown,
  reason: unknown = REASON,
) {
  return reduceViolations(db, actor, { studentId, violationIds, reason }, NOW);
}

async function markOf(db: Database, id: string) {
  const [found] = await db
    .select()
    .from(dormViolations)
    .where(eq(dormViolations.id, id));
  return found;
}

describe("reduceViolations", () => {
  it("marks a violation reduced with the reason, who and when, logs it, and the call for SP 1 is no longer active", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, aniIds } = await setUp(db);
      const [first = ""] = aniIds;

      expect(await reduce(db, manager, ani, [first])).toEqual({
        ok: true,
        value: { days: ["3712-10-01"], standing: { counted: 6, level: null } },
      });

      expect(await markOf(db, first)).toMatchObject({
        reducedBy: manager.id,
        reducedAt: NOW,
        reductionReason: REASON,
        cancelledAt: null,
      });
      const lines = await linesOf(db, first);
      expect(
        lines.map((line) => [
          line.action,
          line.changedBy,
          line.reductionReason,
        ]),
      ).toEqual([["reduced", manager.id, REASON]]);
    });
  });

  it("takes the reduced violation out of Pengumuman pelanggaran", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, aniIds } = await setUp(db);
      const [first = ""] = aniIds;
      const before = await readAnnouncement(db, EVERYONE, NOW, "3712-10-01", 1);

      await reduce(db, manager, ani, [first]);

      const after = await readAnnouncement(db, EVERYONE, NOW, "3712-10-01", 1);
      expect(before.rows.map((row) => row.id)).toContain(first);
      expect(after.rows.map((row) => row.id)).not.toContain(first);
      expect(after.matching).toBe(before.matching - 1);
    });
  });

  it("keeps the reduced violation in the box of the student, as Dikurangi, only for those who read reductions", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, aniIds } = await setUp(db);
      const [first = ""] = aniIds;
      await reduce(db, manager, ani, [first]);
      const params = { ...readStaffViolationParams({}), studentId: ani };

      const reader = await readStaffViolations(
        db,
        EVERYONE,
        params,
        NOW,
        true,
        true,
      );
      const bam = await readStaffViolations(
        db,
        EVERYONE,
        params,
        NOW,
        false,
        false,
      );

      const shown = reader.student?.rows.find((row) => row.id === first);
      expect(shown).toMatchObject({ reduced: true, reductionReason: REASON });
      expect(bam.student?.rows.map((row) => row.id)).not.toContain(first);
      expect(bam.student?.rows).toHaveLength(6);
      const counted = (board: typeof bam) =>
        board.rekap.rows.find((row) => row.studentId === ani)?.escalated;
      expect(counted(reader)).toBe(6);
      expect(counted(bam)).toBe(6);
    });
  });

  it("leaves a reduced violation out of Diumumkan hari ini for every reader, as the announcement does", async () => {
    await inTestDatabase(async (db) => {
      const { cici, bam, manager } = await setUp(db);
      const today = await addTestViolation(db, cici, bam.id, "3712-10-20", {
        announcedAt: new Date("3712-10-20T06:00:00+07:00"),
        enteredAt: new Date("3712-10-20T05:00:00+07:00"),
      });
      const reduced = await reduce(db, manager, cici, [today]);
      if (!reduced.ok) throw new Error(reduced.error);
      const params = readStaffViolationParams({});

      for (const withReductions of [true, false]) {
        const board = await readStaffViolations(
          db,
          EVERYONE,
          params,
          NOW,
          withReductions,
          withReductions,
        );
        expect(board.numbers.announcedToday).toBe(0);
        expect(board.announcement.days.map((each) => each.day)).not.toContain(
          "3712-10-20",
        );
      }
    });
  });

  it("says the call is still active while the count still reaches the SP", async () => {
    await inTestDatabase(async (db) => {
      const { bea, manager, beaIds } = await setUp(db);

      const reduced = await reduce(db, manager, bea, beaIds.slice(0, 1));

      expect(reduced).toMatchObject({
        ok: true,
        value: { standing: { counted: 7, level: 1 } },
      });
    });
  });

  it("reduces several at once, all of them or none", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, manager, aniIds, beaIds } = await setUp(db);
      const [first = "", second = ""] = aniIds;

      expect(await reduce(db, manager, ani, [first, beaIds[0] ?? ""])).toEqual(
        REDUCED_NOT_FOUND,
      );
      expect((await markOf(db, first))?.reducedAt).toBeNull();

      const both = await reduce(db, manager, ani, [first, second]);
      expect(both).toMatchObject({
        ok: true,
        value: { days: ["3712-10-01", "3712-10-02"] },
      });
      expect((await markOf(db, beaIds[0] ?? ""))?.reducedAt).toBeNull();
      expect(await reduce(db, manager, bea, [beaIds[0] ?? ""])).toMatchObject({
        ok: true,
      });
    });
  });

  it("reduces a violation pressed twice once, and refuses the second", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, aniIds } = await setUp(db);
      const [first = ""] = aniIds;

      await reduce(db, manager, ani, [first]);
      const again = await reduce(db, manager, ani, [first], "Alasan lain.");

      expect(again).toEqual(ALREADY_REDUCED);
      expect((await markOf(db, first))?.reductionReason).toBe(REASON);
      expect(await linesOf(db, first)).toHaveLength(1);
    });
  });

  it.each<RoleId>(["head_of_unit", "bam_bphk", "bam_compliance", "student"])(
    "refuses a hand-made reduction from %s",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { ani, aniIds } = await setUp(db);
        const other = await addViolationActor(db, "Akun Uji Kurangi", [role]);

        expect(await reduce(db, other, ani, aniIds.slice(0, 1))).toEqual(
          REDUCE_NOT_ALLOWED,
        );
        expect((await markOf(db, aniIds[0] ?? ""))?.reducedAt).toBeNull();
      });
    },
  );

  it("refuses a violation in Masa advokasi, with its appeal waiting or accepted, or not announced yet", async () => {
    await inTestDatabase(async (db) => {
      const { cici, bam, manager } = await setUp(db);
      const recent = await addTestViolation(db, cici, bam.id, "3712-10-20", {
        announcedAt: new Date(NOW.getTime() - 60 * 60 * 1000),
        enteredAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
      });
      const waiting = await addTestViolation(db, cici, bam.id, "3712-10-10");
      await addTestAppeal(db, waiting);
      const accepted = await addTestViolation(db, cici, bam.id, "3712-10-11");
      await addTestAppeal(db, accepted, {
        status: "accepted",
        decidedBy: bam.id,
        decidedAt: NOW,
      });
      const coming = await addTestViolation(db, cici, bam.id, "3712-10-20", {
        enteredAt: new Date(NOW.getTime() - 60 * 60 * 1000),
      });

      for (const id of [recent, waiting, accepted, coming]) {
        expect(await reduce(db, manager, cici, [id])).toEqual(NOT_ESCALATED);
        expect((await markOf(db, id))?.reducedAt).toBeNull();
      }
    });
  });

  it("reduces a violation whose appeal was rejected", async () => {
    await inTestDatabase(async (db) => {
      const { cici, bam, manager } = await setUp(db);
      const rejected = await addTestViolation(db, cici, bam.id, "3712-10-12");
      await addTestAppeal(db, rejected, {
        status: "rejected",
        decidedBy: bam.id,
        decidedAt: NOW,
        decisionNote: "Tidak ada izin tercatat.",
      });

      expect(await reduce(db, manager, cici, [rejected])).toMatchObject({
        ok: true,
      });
    });
  });

  it("refuses a Pengelola Asrama their own violation", async () => {
    await inTestDatabase(async (db) => {
      const { ani, aniIds } = await setUp(db);
      const own = await addViolationActor(
        db,
        "Pengelola Uji Kurangi Sendiri",
        ["dorm_manager", "student"],
        ani,
      );

      expect(await reduce(db, own, ani, aniIds.slice(0, 1))).toEqual(
        OWN_REDUCTION,
      );
    });
  });

  it("refuses a Pengelola Asrama their own violation sent with their id in capitals", async () => {
    await inTestDatabase(async (db) => {
      const { ani, aniIds } = await setUp(db);
      const own = await addViolationActor(
        db,
        "Pengelola Uji Kurangi Huruf Besar",
        ["dorm_manager", "student"],
        ani,
      );

      expect(
        await reduce(db, own, ani.toUpperCase(), aniIds.slice(0, 1)),
      ).toEqual(OWN_REDUCTION);
      expect((await markOf(db, aniIds[0] ?? ""))?.reducedAt).toBeNull();
    });
  });

  it("refuses a reason under 5 letters, nothing picked, and what is not a violation", async () => {
    await inTestDatabase(async (db) => {
      const { ani, manager, aniIds } = await setUp(db);

      expect(
        await reduce(db, manager, ani, aniIds.slice(0, 1), " abc "),
      ).toEqual({ ok: false, error: REDUCTION_REASON_TOO_SHORT });
      expect(await reduce(db, manager, ani, [])).toMatchObject({ ok: false });
      expect(await reduce(db, manager, ani, "semua")).toMatchObject({
        ok: false,
      });
      expect(await reduce(db, manager, ani, ["bukan-kunci"])).toEqual(
        REDUCED_NOT_FOUND,
      );
      expect((await markOf(db, aniIds[0] ?? ""))?.reducedAt).toBeNull();
    });
  });
});
