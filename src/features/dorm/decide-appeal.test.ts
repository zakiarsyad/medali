// Sample Tahun akademik of this file: 3243 to 3243.
// Sample NIMs of this file: 9982130000 to 9982130099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { dormViolationAppeals } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { DECIDED_WORDS, NOTE_NEEDED } from "./appeal-decision";
import { readAppealInbox } from "./appeal-inbox";
import {
  APPEAL_DECIDED_BEFORE,
  APPEAL_NOT_FOUND,
  DECIDE_NOT_ALLOWED,
  OWN_APPEAL,
} from "./appeal-messages";
import { decideViolationAppeal } from "./decide-appeal";
import { sendViolationAppeal } from "./send-appeal";
import { EVERYONE } from "./test-records";
import {
  addTestViolation,
  addViolationActor,
  addViolationSetting,
  linesOf,
} from "./test-violations";

const inTestDatabase = withTestDatabase();

const DAY = "3243-10-12";
// 21:30 on campus on the day, half an hour after the announcement.
const SENT_AT = new Date("3243-10-12T14:30:00Z");
const LATER = new Date("3243-10-13T02:00:00Z");
const REASON = "Saya sedang izin resmi pulang pada jam tersebut.";

/**
 * Ani's and Bea's appeals of their violations, recorded by the BAM -
 * BPHK below; Bea is also a BAM - KI member.
 */
async function setUp(db: Database) {
  const setting = await addViolationSetting(
    db,
    3243,
    "Prodi Uji Putus Advokasi",
    ["9982130001", "9982130002", "9982130003", "9982130004", "9982130005"],
  );
  const [aniId = "", beaId = ""] = setting.residents;
  const bphk = await addViolationActor(db, "BAM Uji Putus", ["bam_bphk"]);
  const ani = await addViolationActor(db, "Ani", ["student"], aniId);
  const bea = await addViolationActor(
    db,
    "Bea",
    ["student", "bam_compliance"],
    beaId,
  );
  async function appealOf(account: typeof ani, studentId: string) {
    const violationId = await addTestViolation(db, studentId, bphk.id, DAY);
    const sent = await sendViolationAppeal(
      db,
      null,
      account,
      { violationId, reason: REASON, file: null },
      SENT_AT,
    );
    if (!sent.ok) throw new Error(sent.error);
    const [appeal] = await db
      .select()
      .from(dormViolationAppeals)
      .where(eq(dormViolationAppeals.violationId, violationId));
    return { appealId: appeal?.id ?? "", violationId };
  }
  return {
    ani: await appealOf(ani, aniId),
    bea: await appealOf(bea, beaId),
    bphk,
    beaAccount: bea,
  };
}

function appealById(db: Database, id: string) {
  return db
    .select()
    .from(dormViolationAppeals)
    .where(eq(dormViolationAppeals.id, id));
}

describe("decideViolationAppeal", () => {
  it("lets BAM - BPHK accept an appeal of a violation they recorded, with its line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bphk } = await setUp(db);

      expect(
        await decideViolationAppeal(
          db,
          bphk,
          ani.appealId,
          { kind: "accept", note: "" },
          LATER,
        ),
      ).toEqual({ ok: true, value: DECIDED_WORDS.accept });

      const [kept] = await appealById(db, ani.appealId);
      expect(kept).toMatchObject({
        status: "accepted",
        decidedBy: bphk.id,
        decidedAt: LATER,
        decisionNote: "",
      });
      const lines = await linesOf(db, ani.violationId);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["appealed", expect.any(String)],
        ["appeal_accepted", bphk.id],
      ]);
    });
  });

  it("refuses Tolak without a note, and keeps one with it", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bphk } = await setUp(db);
      const reject = (note: string) =>
        decideViolationAppeal(
          db,
          bphk,
          ani.appealId,
          { kind: "reject", note },
          LATER,
        );

      expect(await reject("  ")).toEqual({ ok: false, error: NOTE_NEEDED });
      expect((await appealById(db, ani.appealId))[0]?.status).toBe("waiting");
      expect(await reject("Tidak ada izin tercatat.")).toEqual({
        ok: true,
        value: DECIDED_WORDS.reject,
      });
      const [kept] = await appealById(db, ani.appealId);
      expect(kept).toMatchObject({
        status: "rejected",
        decisionNote: "Tidak ada izin tercatat.",
      });
    });
  });

  it("refuses a second decision on the same appeal and keeps the first", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bphk, beaAccount } = await setUp(db);

      await decideViolationAppeal(
        db,
        bphk,
        ani.appealId,
        { kind: "accept", note: "" },
        LATER,
      );
      expect(
        await decideViolationAppeal(
          db,
          beaAccount,
          ani.appealId,
          { kind: "reject", note: "Tidak ada izin." },
          LATER,
        ),
      ).toEqual(APPEAL_DECIDED_BEFORE);

      expect((await appealById(db, ani.appealId))[0]?.status).toBe("accepted");
      const lines = await linesOf(db, ani.violationId);
      expect(lines.map((line) => line.action)).toEqual([
        "appealed",
        "appeal_accepted",
      ]);
    });
  });

  it("refuses a decider their own appeal, which another decider decides", async () => {
    await inTestDatabase(async (db) => {
      const { bea, bphk, beaAccount } = await setUp(db);

      expect(
        await decideViolationAppeal(
          db,
          beaAccount,
          bea.appealId,
          { kind: "accept", note: "" },
          LATER,
        ),
      ).toEqual(OWN_APPEAL);
      expect((await appealById(db, bea.appealId))[0]?.status).toBe("waiting");
      expect(
        await decideViolationAppeal(
          db,
          bphk,
          bea.appealId,
          { kind: "accept", note: "" },
          LATER,
        ),
      ).toEqual({ ok: true, value: DECIDED_WORDS.accept });
    });
  });

  it("refuses Pengelola Asrama, Kepala Unit, the BAM roles that do not decide and Mahasiswa", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await setUp(db);
      const roles: RoleId[] = [
        "dorm_manager",
        "head_of_unit",
        "bam_spiritual",
        "bam_household",
        "student",
      ];

      for (const role of roles) {
        const actor = await addViolationActor(db, `Uji ${role}`, [role]);
        expect(
          await decideViolationAppeal(
            db,
            actor,
            ani.appealId,
            { kind: "accept", note: "" },
            LATER,
          ),
        ).toEqual(DECIDE_NOT_ALLOWED);
      }
      expect((await appealById(db, ani.appealId))[0]?.status).toBe("waiting");
    });
  });

  it("answers an appeal that is not there", async () => {
    await inTestDatabase(async (db) => {
      const { bphk } = await setUp(db);
      const decide = (id: string) =>
        decideViolationAppeal(
          db,
          bphk,
          id,
          { kind: "accept", note: "" },
          LATER,
        );

      expect(await decide("x")).toEqual(APPEAL_NOT_FOUND);
      expect(await decide(crypto.randomUUID())).toEqual(APPEAL_NOT_FOUND);
    });
  });
});

describe("readAppealInbox", () => {
  it("counts and lists the appeals that wait, the soonest sent first, with their reason and violation", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bea, bphk } = await setUp(db);

      const before = await readAppealInbox(db, EVERYONE, 1);
      await decideViolationAppeal(
        db,
        bphk,
        ani.appealId,
        { kind: "accept", note: "" },
        LATER,
      );
      const after = await readAppealInbox(db, EVERYONE, 1);

      expect(before.waiting).toBe(2);
      expect(before.cards.map((card) => card.id).sort()).toEqual(
        [ani.appealId, bea.appealId].sort(),
      );
      expect(before.cards[0]).toMatchObject({
        reason: REASON,
        proofName: null,
        violationDay: DAY,
        violationReason: "Terlambat apel pagi",
        punishment: "warning",
      });
      expect(after.waiting).toBe(1);
      expect(after.cards.map((card) => card.id)).toEqual([bea.appealId]);
    });
  });
});
