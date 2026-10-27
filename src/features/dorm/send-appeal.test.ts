// Sample Tahun akademik of this file: 3280 to 3280.
// Sample NIMs of this file: 9982100000 to 9982100099.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { testPaper } from "@/clarifications/test-paper";
import type { Database } from "@/db/connect";
import { dormViolationAppeals } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore, unreachableStore } from "@/files/memory-store";
import {
  ALREADY_APPEALED,
  APPEAL_NOT_ALLOWED,
  APPEAL_SENT,
  APPEAL_TIME_OVER,
  APPEAL_VIOLATION_NOT_FOUND,
  NO_PROOF_STORAGE,
  PROOF_NOT_KEPT,
} from "./appeal-messages";
import { type SentAppeal, sendViolationAppeal } from "./send-appeal";
import {
  addTestViolation,
  addViolationActor,
  addViolationSetting,
  linesOf,
} from "./test-violations";

const inTestDatabase = withTestDatabase();

const DAY = "3280-10-12";
// 21:00 on campus on the day, when the violation is announced.
const ANNOUNCED = new Date("3280-10-12T14:00:00Z");
const MINUTE_MS = 60 * 1000;
const REASON = "Saya sedang izin resmi pulang pada jam tersebut.";
const SENT = { ok: true, value: APPEAL_SENT };

function minutesLater(minutes: number): Date {
  return new Date(ANNOUNCED.getTime() + minutes * MINUTE_MS);
}

/** Ani's violation, announced at 21:00; Ani and Bea, of her dorm, with accounts. */
async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3280, "Prodi Uji Advokasi", [
    "9982100001",
    "9982100002",
    "9982100003",
    "9982100004",
    "9982100005",
  ]);
  const [ani = "", bea = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Advokasi", ["bam_bphk"]);
  const resident = (studentId: string, roles: RoleId[] = ["student"]) =>
    addViolationActor(db, `Akun ${studentId.slice(0, 8)}`, roles, studentId);
  return {
    violationId: await addTestViolation(db, ani, bam.id, DAY),
    ani: await resident(ani),
    bea: await resident(bea),
    bam,
    outsider: await resident(setting.outsider),
  };
}

function sent(violationId: string, more: Partial<SentAppeal> = {}): SentAppeal {
  return { violationId, reason: REASON, file: null, ...more };
}

function appealsOf(db: Database, violationId: string) {
  return db
    .select()
    .from(dormViolationAppeals)
    .where(eq(dormViolationAppeals.violationId, violationId))
    .orderBy(asc(dormViolationAppeals.sentAt));
}

describe("sendViolationAppeal", () => {
  it("keeps the appeal of the resident within 3 hours, waiting, with its line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);

      expect(
        await sendViolationAppeal(
          db,
          null,
          ani,
          sent(violationId, { reason: `  ${REASON}  ` }),
          minutesLater(179),
        ),
      ).toEqual(SENT);

      const [kept] = await appealsOf(db, violationId);
      expect(kept).toMatchObject({
        reason: REASON,
        status: "waiting",
        fileKey: null,
        fileName: null,
        sentAt: minutesLater(179),
      });
      const lines = await linesOf(db, violationId);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["appealed", ani.id],
      ]);
    });
  });

  it("keeps a proof in the file storage with its name, kind and size", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);
      const store = memoryStore();
      const file = { name: "C:\\dok\\surat izin.pdf", bytes: testPaper(300) };

      expect(
        await sendViolationAppeal(
          db,
          store,
          ani,
          sent(violationId, { file }),
          minutesLater(5),
        ),
      ).toEqual(SENT);

      const [kept] = await appealsOf(db, violationId);
      expect(kept).toMatchObject({
        fileName: "surat izin.pdf",
        fileContentType: "application/pdf",
        fileSize: 300,
      });
      expect(kept?.fileKey).toMatch(/^dorm-violation-appeals\//);
      expect(store.files.get(kept?.fileKey ?? "")?.bytes).toEqual(file.bytes);
    });
  });

  it("refuses a reason under 15 letters, a proof of the wrong kind or over 4 MB, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);
      const store = memoryStore();
      const at = minutesLater(5);
      const big = { name: "a.pdf", bytes: testPaper(4 * 1024 * 1024 + 1) };
      const wrong = { name: "a.exe", bytes: testPaper(300) };
      const send = (more: Partial<SentAppeal>) =>
        sendViolationAppeal(db, store, ani, sent(violationId, more), at);

      expect(await send({ reason: "   Izin resmi   " })).toEqual({
        ok: false,
        error: "Alasan advokasi minimal 15 karakter.",
      });
      expect(await send({ file: big })).toEqual({
        ok: false,
        error: "Ukuran lampiran maksimal 4 MB.",
      });
      expect(await send({ file: wrong })).toEqual({
        ok: false,
        error: "Lampiran harus berupa PDF atau gambar.",
      });
      expect(await appealsOf(db, violationId)).toEqual([]);
      expect(store.files.size).toBe(0);
    });
  });

  it("refuses once 3 hours have passed, and before the announcement", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);
      const send = (at: Date) =>
        sendViolationAppeal(db, null, ani, sent(violationId), at);

      expect(await send(minutesLater(180))).toEqual(APPEAL_TIME_OVER);
      expect(APPEAL_TIME_OVER.error).toBe(
        "Batas waktu advokasi 3 jam sudah lewat.",
      );
      expect(await send(minutesLater(-1))).toEqual(APPEAL_VIOLATION_NOT_FOUND);
      expect(await appealsOf(db, violationId)).toEqual([]);
    });
  });

  it("refuses a second appeal of the same violation, and keeps the first unchanged", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);
      const store = memoryStore();
      const file = { name: "bukti.pdf", bytes: testPaper(300) };

      await sendViolationAppeal(
        db,
        null,
        ani,
        sent(violationId),
        minutesLater(5),
      );
      expect(
        await sendViolationAppeal(
          db,
          store,
          ani,
          sent(violationId, { reason: `${REASON} Lagi.`, file }),
          minutesLater(6),
        ),
      ).toEqual(ALREADY_APPEALED);

      const kept = await appealsOf(db, violationId);
      expect(kept.map((each) => each.reason)).toEqual([REASON]);
      expect(store.files.size).toBe(0);
    });
  });

  it("answers a violation of another resident as one that is not there, and keeps nothing", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, bea } = await setUp(db);

      expect(
        await sendViolationAppeal(
          db,
          null,
          bea,
          sent(violationId),
          minutesLater(5),
        ),
      ).toEqual(APPEAL_VIOLATION_NOT_FOUND);
      expect(await appealsOf(db, violationId)).toEqual([]);
    });
  });

  it("refuses staff, BAM, and a student who lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, bam, outsider } = await setUp(db);
      const manager = await addViolationActor(db, "Pengelola Uji Advokasi", [
        "dorm_manager",
      ]);

      for (const account of [bam, manager, outsider]) {
        expect(
          await sendViolationAppeal(
            db,
            null,
            account,
            sent(violationId),
            minutesLater(5),
          ),
        ).toEqual(APPEAL_NOT_ALLOWED);
      }
      expect(await appealsOf(db, violationId)).toEqual([]);
    });
  });

  it("refuses an appeal with a proof where no file storage is set, and keeps one without", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);
      const file = { name: "bukti.pdf", bytes: testPaper(300) };

      expect(
        await sendViolationAppeal(
          db,
          null,
          ani,
          sent(violationId, { file }),
          minutesLater(5),
        ),
      ).toEqual(NO_PROOF_STORAGE);
      expect(await appealsOf(db, violationId)).toEqual([]);
    });
  });

  it("tells the resident to try again when the file storage cannot be reached", async () => {
    await inTestDatabase(async (db) => {
      const { violationId, ani } = await setUp(db);
      const file = { name: "bukti.pdf", bytes: testPaper(300) };

      expect(
        await sendViolationAppeal(
          db,
          unreachableStore(),
          ani,
          sent(violationId, { file }),
          minutesLater(5),
        ),
      ).toEqual(PROOF_NOT_KEPT);
      expect(await appealsOf(db, violationId)).toEqual([]);
    });
  });
});
