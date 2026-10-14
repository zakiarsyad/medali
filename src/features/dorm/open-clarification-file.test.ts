// Sample Tahun akademik of this file: 3030 to 3030.
// Sample NIMs of this file: 9937980400 to 9937980499.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { testPaper } from "@/clarifications/test-paper";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore, unreachableStore } from "@/files/memory-store";
import { openDormClarificationFile } from "./open-clarification-file";
import { sendDormClarification } from "./send-clarification";
import { addTestActivity } from "./test-activities";
import {
  addTestClarification,
  addTestCount,
  clarificationsOf,
} from "./test-clarifications";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const PAPER = { name: "surat dokter.pdf", bytes: testPaper(300) };
const NOT_FOUND = { ok: false, refusal: "not-found" };
/** Ten in the morning on campus, after the Apel pagi of the counted day. */
const AFTER = new Date("3030-10-13T03:00:00Z");

/** A resident's clarification of an absence, sent with its file. */
async function addRecords(db: Database) {
  const [ani, budi] = await addTestResidents(db, 3030, "Prodi Uji Buka Klar", [
    "9937980401",
    "9937980402",
  ]);
  if (!ani || !budi) throw new Error("The residents were not added.");
  const bam = await addTestActor(db, "BAM Uji Buka Klar", ["bam_bphk"]);
  const activityId = await addTestActivity(db, bam.id);
  const countId = await addTestCount(db, {
    activityId,
    day: "3030-10-13",
    byId: bam.id,
    marks: { [ani.studentId]: { isAbsent: true, note: "" } },
  });
  const store = memoryStore();
  const sent = await sendDormClarification(
    db,
    store,
    ani,
    {
      activityId,
      day: "3030-10-13",
      reason: "sick",
      explanation: "Demam dan beristirahat di kamar.",
      file: PAPER,
    },
    AFTER,
  );
  if (!sent.ok) throw new Error(sent.error);
  const [kept] = await clarificationsOf(db, ani.studentId);
  if (!kept) throw new Error("The clarification was not kept.");
  return { store, ani, budi, bamId: bam.id, countId, clarificationId: kept.id };
}

function staff(roles: RoleId[]) {
  return { roles, studentId: null };
}

describe("openDormClarificationFile", () => {
  it("gives the resident the file they sent, unchanged and under its own name", async () => {
    await inTestDatabase(async (db) => {
      const { store, ani, clarificationId } = await addRecords(db);

      expect(
        await openDormClarificationFile(db, store, ani, clarificationId),
      ).toEqual({
        ok: true,
        file: {
          name: "surat dokter.pdf",
          contentType: "application/pdf",
          bytes: PAPER.bytes,
        },
      });
    });
  });

  it.each([
    ["BAM - BPHK", ["bam_bphk"]],
    ["BAM - KI", ["bam_compliance"]],
    ["Pengelola Asrama", ["dorm_manager"]],
  ] as const)(
    "gives %s the file of any resident, to check or decide the clarification",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const { store, clarificationId } = await addRecords(db);

        expect(
          await openDormClarificationFile(
            db,
            store,
            staff([...roles]),
            clarificationId,
          ),
        ).toMatchObject({ ok: true, file: { bytes: PAPER.bytes } });
      });
    },
  );

  it.each([
    ["Kepala Unit", ["head_of_unit"]],
    ["Direktur", ["director"]],
    ["Ketua Program Studi", ["head_of_program"]],
    ["BAM - Kesehatan", ["bam_health"]],
    ["Pengasuh", ["mentor"]],
  ] as const)(
    "refuses %s, even with the exact address and the resident's own record",
    async (_who, roles) => {
      await inTestDatabase(async (db) => {
        const { store, ani, clarificationId } = await addRecords(db);

        expect(
          await openDormClarificationFile(
            db,
            store,
            { ...ani, roles: [...roles] },
            clarificationId,
          ),
        ).toEqual({ ok: false, refusal: "not-allowed" });
      });
    },
  );

  it("refuses another resident, as if the file did not exist, and a visitor who is not signed in", async () => {
    await inTestDatabase(async (db) => {
      const { store, budi, clarificationId } = await addRecords(db);

      expect(
        await openDormClarificationFile(db, store, budi, clarificationId),
      ).toEqual(NOT_FOUND);
      expect(
        await openDormClarificationFile(db, store, null, clarificationId),
      ).toEqual({ ok: false, refusal: "not-signed-in" });
    });
  });

  it("finds nothing for an unknown or malformed key, for a clarification without a file, and where file keeping is off", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { store, ani, clarificationId } = records;
      const noFile = await addTestClarification(db, records.bamId, {
        countId: records.countId,
        studentId: ani.studentId,
        status: "rejected",
      });
      const unknown = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

      for (const id of [unknown, "bukan-kunci", "", noFile]) {
        expect(await openDormClarificationFile(db, store, ani, id)).toEqual(
          NOT_FOUND,
        );
      }
      expect(
        await openDormClarificationFile(db, null, ani, clarificationId),
      ).toEqual(NOT_FOUND);
    });
  });

  it("says to try again when the file storage cannot be reached", async () => {
    await inTestDatabase(async (db) => {
      const { ani, clarificationId } = await addRecords(db);

      expect(
        await openDormClarificationFile(
          db,
          unreachableStore(),
          ani,
          clarificationId,
        ),
      ).toEqual({ ok: false, refusal: "unreachable" });
    });
  });
});
