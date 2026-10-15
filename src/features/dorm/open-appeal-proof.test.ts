// Sample Tahun akademik of this file: 3241 to 3241.
// Sample NIMs of this file: 9982110000 to 9982110099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { testPaper } from "@/clarifications/test-paper";
import type { Database } from "@/db/connect";
import { dormViolationAppeals } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore, unreachableStore } from "@/files/memory-store";
import { openAppealProof } from "./open-appeal-proof";
import { sendViolationAppeal } from "./send-appeal";
import {
  addTestViolation,
  addViolationActor,
  addViolationSetting,
} from "./test-violations";

const inTestDatabase = withTestDatabase();

const PAPER = { name: "surat izin.pdf", bytes: testPaper(300) };
const NOT_FOUND = { ok: false, refusal: "not-found" };
const NOT_ALLOWED = { ok: false, refusal: "not-allowed" };
// 21:30 on campus on 12 October 3241, half an hour after the announcement.
const AT = new Date("3241-10-12T14:30:00Z");

/** Ani's appeal with its proof; Bea lives in her dorm. */
async function addRecords(db: Database) {
  const setting = await addViolationSetting(db, 3241, "Prodi Uji Buka Bukti", [
    "9982110001",
    "9982110002",
    "9982110003",
    "9982110004",
    "9982110005",
  ]);
  const [aniId = "", beaId = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Buka Bukti", ["bam_bphk"]);
  const ani = await addViolationActor(db, "Ani", ["student"], aniId);
  const bea = await addViolationActor(db, "Bea", ["student"], beaId);
  const violationId = await addTestViolation(db, aniId, bam.id, "3241-10-12");
  const store = memoryStore();
  const sent = await sendViolationAppeal(
    db,
    store,
    ani,
    {
      violationId,
      reason: "Saya sedang izin resmi pada jam itu.",
      file: PAPER,
    },
    AT,
  );
  if (!sent.ok) throw new Error(sent.error);
  const [appeal] = await db.select().from(dormViolationAppeals);
  if (!appeal) throw new Error("The appeal was not kept.");
  return { store, ani, bea, appealId: appeal.id };
}

function staff(roles: RoleId[]) {
  return { roles, studentId: null };
}

const OPENED = {
  ok: true,
  file: {
    name: "surat izin.pdf",
    contentType: "application/pdf",
    bytes: PAPER.bytes,
  },
};

describe("openAppealProof", () => {
  it("gives the resident and BAM - BPHK and BAM - KI the proof, unchanged and under its own name", async () => {
    await inTestDatabase(async (db) => {
      const { store, ani, appealId } = await addRecords(db);

      for (const account of [
        ani,
        staff(["bam_bphk"]),
        staff(["bam_compliance"]),
      ]) {
        expect(await openAppealProof(db, store, account, appealId)).toEqual(
          OPENED,
        );
      }
    });
  });

  it("refuses Pengelola Asrama, Kepala Unit and the BAM roles that do not decide, before looking anything up", async () => {
    await inTestDatabase(async (db) => {
      const { store, appealId } = await addRecords(db);

      for (const role of [
        "dorm_manager",
        "head_of_unit",
        "bam_spiritual",
        "bam_health",
      ] as const) {
        expect(
          await openAppealProof(db, store, staff([role]), appealId),
        ).toEqual(NOT_ALLOWED);
      }
      expect(await openAppealProof(db, store, null, appealId)).toEqual({
        ok: false,
        refusal: "not-signed-in",
      });
    });
  });

  it("answers another resident's proof as one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { store, bea, appealId } = await addRecords(db);

      expect(await openAppealProof(db, store, bea, appealId)).toEqual(
        NOT_FOUND,
      );
    });
  });

  it("answers an address that is no key, no file storage, and a storage that cannot be reached", async () => {
    await inTestDatabase(async (db) => {
      const { ani, appealId } = await addRecords(db);

      expect(await openAppealProof(db, memoryStore(), ani, "x")).toEqual(
        NOT_FOUND,
      );
      expect(await openAppealProof(db, null, ani, appealId)).toEqual(NOT_FOUND);
      expect(
        await openAppealProof(db, unreachableStore(), ani, appealId),
      ).toEqual({ ok: false, refusal: "unreachable" });
    });
  });
});
