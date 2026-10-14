// Sample Tahun akademik of this file: 2909 to 2909.
// Sample NIMs of this file: 9964001100 to 9964001199.
import { and, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { sikuAdjustmentChanges, sikuAdjustments, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelSikuEntry } from "./cancel-entry";
import { readOwnSiku } from "./own-siku";
import { saveSikuFile } from "./save-siku-file";
import { HISTORY_PAGE_SIZE } from "./siku-address";
import { readSeenStudents, readSikuHistory } from "./siku-history";
import { ALREADY_CANCELLED } from "./siku-messages";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

const YEAR = 2909;
// 10:00 on campus on 12 October 2909, in the odd period of 2909.
const MOMENT = new Date("2909-10-12T03:00:00Z");

function seenBy(actor: TestActor) {
  const visible = visibleTo(rowLimitForAction(actor, "view_siku"));
  return and(visible, eq(students.cohortYear, YEAR)) ?? visible;
}

function csv(...lines: string[]) {
  return {
    name: "siku-unggah.csv",
    bytes: new TextEncoder().encode(
      ["nim,jenis,alasan,poin,keterangan", ...lines].join("\n"),
    ),
  };
}

/**
 * Ani and Budi of the first program and Citra of the second. A file
 * gives Ani a gain and a loss, Budi a loss and Citra a gain; a form
 * entry before it gives Budi a gain.
 */
async function addRecords(db: Database) {
  const periods = await addTestYear(db, YEAR);
  const first = await addTestStudents(db, "Prodi Uji Unggah SIKU A", YEAR, [
    "9964001101",
    "9964001102",
  ]);
  const second = await addTestStudents(db, "Prodi Uji Unggah SIKU B", YEAR, [
    "9964001103",
  ]);
  const [ani, budi] = first.studentIds;
  const [citra] = second.studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Unggah", ["assessor"]);
  const form = await addTestEntry(db, penilai, {
    kind: "gain",
    reason: "knowledge_sharing",
    points: 4,
    day: `${YEAR}-10-01`,
    periodId: periods.odd,
    studentIds: [budi],
  });
  const upload = crypto.randomUUID();
  const saved = await saveSikuFile(
    db,
    penilai,
    upload,
    csv(
      "9964001101,tambah,1,3,Konten",
      "9964001101,kurang,2,2,Terlambat",
      "9964001102,kurang,3,5,",
      "9964001103,tambah,5,1,",
    ),
    false,
    MOMENT,
  );
  if (!saved.ok) throw new Error(saved.error);
  const kaprodi = await addTestActor(
    db,
    "Kaprodi Uji Unggah",
    ["head_of_program"],
    { studyProgramId: first.programId },
  );
  return { ids: { ani, budi, citra }, form, upload, penilai, kaprodi };
}

describe("an upload in the history", () => {
  it("shows as one entry with its file name, dated the day it was saved, before the older form entry", async () => {
    await inTestDatabase(async (db) => {
      const { form, upload, penilai } = await addRecords(db);

      const history = await readSikuHistory(db, seenBy(penilai), 1);

      expect(history.matching).toBe(2);
      expect(history.entries).toEqual([
        {
          source: "upload",
          id: upload,
          day: `${YEAR}-10-12`,
          fileName: "siku-unggah.csv",
          students: 3,
          enteredBy: "Penilai Uji Unggah",
        },
        expect.objectContaining({ source: "form", id: form, points: 4 }),
      ]);
    });
  });

  it("counts only the different students of it that the reader sees", async () => {
    await inTestDatabase(async (db) => {
      const { upload, kaprodi } = await addRecords(db);

      const history = await readSikuHistory(db, seenBy(kaprodi), 1);

      expect(history.entries).toContainEqual(
        expect.objectContaining({ id: upload, students: 2 }),
      );
    });
  });

  it("counts an upload as one entry on the pages of the history", async () => {
    await inTestDatabase(async (db) => {
      const { ids, penilai } = await addRecords(db);
      const periods = await db
        .select({ periodId: sikuAdjustments.periodId })
        .from(sikuAdjustments)
        .limit(1);
      const periodId = periods[0]?.periodId ?? "";
      for (let day = 1; day <= HISTORY_PAGE_SIZE; day++) {
        await addTestEntry(db, penilai, {
          kind: "gain",
          reason: "peer_mentoring",
          points: 1,
          day: `${YEAR}-09-${String(day).padStart(2, "0")}`,
          periodId,
          studentIds: [ids.ani],
        });
      }

      const first = await readSikuHistory(db, seenBy(penilai), 1);
      const second = await readSikuHistory(db, seenBy(penilai), 2);

      expect(first.matching).toBe(HISTORY_PAGE_SIZE + 2);
      expect(first.entries).toHaveLength(HISTORY_PAGE_SIZE);
      expect(first.entries[0]?.source).toBe("upload");
      expect(second.entries).toHaveLength(2);
    });
  });

  it("lists, under Lihat mahasiswa, one line per row with the student's own points and reason", async () => {
    await inTestDatabase(async (db) => {
      const { upload, penilai, kaprodi } = await addRecords(db);

      const seen = await readSeenStudents(db, seenBy(penilai), upload, 1);
      const ofProgram = await readSeenStudents(db, seenBy(kaprodi), upload, 1);

      expect(seen?.entry).toMatchObject({ source: "upload", id: upload });
      expect(seen?.matching).toBe(4);
      expect(
        seen?.students.map((line) => [line.nim, line.change]).sort(),
      ).toEqual(
        [
          [
            "9964001101",
            { kind: "gain", reason: "social_media_campaign", points: 3 },
          ],
          [
            "9964001101",
            { kind: "loss", reason: "discipline_penalty", points: 2 },
          ],
          [
            "9964001102",
            { kind: "loss", reason: "unannounced_absence", points: 5 },
          ],
          [
            "9964001103",
            { kind: "gain", reason: "spiritual_activity", points: 1 },
          ],
        ].sort(),
      );
      expect(ofProgram?.matching).toBe(3);
    });
  });

  it("is cancelled whole by Batalkan, each row with a line in the log, and refuses a second cancel", async () => {
    await inTestDatabase(async (db) => {
      const { form, upload, penilai } = await addRecords(db);

      const cancelled = await cancelSikuEntry(db, penilai, upload);
      const again = await cancelSikuEntry(db, penilai, upload);

      expect(cancelled).toEqual({ ok: true, value: null });
      expect(again).toEqual(ALREADY_CANCELLED);
      const rows = await db
        .select()
        .from(sikuAdjustments)
        .where(eq(sikuAdjustments.uploadId, upload));
      expect(rows).toHaveLength(4);
      for (const row of rows) {
        expect(row).toMatchObject({ cancelledBy: penilai.id });
        expect(row.cancelledAt).not.toBeNull();
      }
      const logged = await db
        .select()
        .from(sikuAdjustmentChanges)
        .where(
          and(
            inArray(
              sikuAdjustmentChanges.adjustmentId,
              rows.map((row) => row.id),
            ),
            eq(sikuAdjustmentChanges.action, "cancelled"),
          ),
        );
      expect(logged).toHaveLength(4);
      const history = await readSikuHistory(db, seenBy(penilai), 1);
      expect(history.entries.map((entry) => entry.id)).toEqual([form]);
      expect(await readSeenStudents(db, seenBy(penilai), upload, 1)).toBe(null);
    });
  });

  it("is never cancelled one row at a time", async () => {
    await inTestDatabase(async (db) => {
      const { upload, penilai } = await addRecords(db);
      const [row] = await db
        .select()
        .from(sikuAdjustments)
        .where(eq(sikuAdjustments.uploadId, upload));
      if (!row) throw new Error("Row missing.");

      const cancelled = await cancelSikuEntry(db, penilai, row.id);

      expect(cancelled.ok).toBe(false);
      const [kept] = await db
        .select()
        .from(sikuAdjustments)
        .where(eq(sikuAdjustments.id, row.id));
      expect(kept?.cancelledAt).toBeNull();
    });
  });
});

describe("a row from a file in Transparansi nilai SIKU", () => {
  it("is marked as entered by unggah berkas, and a form entry is not", async () => {
    await inTestDatabase(async (db) => {
      const { ids } = await addRecords(db);

      const own = await readOwnSiku(db, {
        roles: ["student"],
        studentId: ids.budi,
      });

      expect(own.kind === "shown" && own.siku.entries).toMatchObject([
        {
          reason: "unannounced_absence",
          enteredAs: "assessor",
          fromFile: true,
        },
        { reason: "knowledge_sharing", enteredAs: "assessor", fromFile: false },
      ]);
    });
  });
});
