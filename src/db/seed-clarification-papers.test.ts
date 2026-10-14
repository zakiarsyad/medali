// Sample Tahun akademik of this file: 2290 to 2290.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { CLARIFICATION_FILE_RULE } from "@/clarifications/clarification-file";
import {
  addTestActivity,
  addTestActor,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { addTestActivity as addTestDormActivity } from "@/features/dorm/test-activities";
import {
  addTestCount,
  addTestClarification as addTestDormClarification,
} from "@/features/dorm/test-clarifications";
import { fileFault } from "@/files/file-check";
import { PDF } from "@/files/file-kinds";
import { memoryStore } from "@/files/memory-store";
import type { Database } from "./connect";
import {
  SAMPLE_PAPER_NAME,
  samplePaperBytes,
} from "./sample-clarification-paper";
import { activityClarifications, dormClarifications } from "./schema";
import {
  addSamplePapers,
  samplePapersAdded,
} from "./seed-clarification-papers";
import { withTestDatabase } from "./test-database";

/*
 * This file's own sample values: the Tahun akademik 2290, the programs
 * UJIKERTASCONTOH and UJIKERTASASRAMA, and the NIMs 9973600000 to
 * 9973600099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  waitingId: string;
  rejectedId: string;
  sentId: string;
}

/** A waiting and a rejected clarification without a file, and one with its file. */
async function addRecords(db: Database): Promise<Records> {
  const assessor = await addTestActor(db, "Penilai Uji Kertas Contoh", [
    "assessor",
  ]);
  const activityId = await addTestActivity(db, assessor.id);
  const periods = await addTestPeriods(db, 2290);
  const programId = await addTestProgram(db, "UJIKERTASCONTOH");
  const { studentId } = await addTestStudentAccount(db, programId, {
    nim: "9973600001",
    name: "Mahasiswa Uji Kertas Contoh",
    cohortYear: 2289,
  });
  const days = ["2290-09-10", "2290-09-11"];
  const [first, second] = await Promise.all(
    days.map((startsOn) =>
      addTestSchedule(db, {
        activityId,
        academicPeriodId: periods.oddId,
        changedBy: assessor.id,
        startsOn,
      }),
    ),
  );
  if (!first || !second) throw new Error("The schedules were not added.");
  return {
    waitingId: await addTestClarification(db, assessor.id, {
      scheduleId: first,
      studentId,
      status: "submitted",
    }),
    rejectedId: await addTestClarification(db, assessor.id, {
      scheduleId: first,
      studentId,
      status: "rejected",
    }),
    sentId: await addTestClarification(db, assessor.id, {
      scheduleId: second,
      studentId,
      status: "submitted",
      fileKey: "attendance-clarifications/sudah-ada",
    }),
  };
}

async function fileKeyOf(db: Database, id: string): Promise<string | null> {
  const [clarification] = await db
    .select({ fileKey: activityClarifications.fileKey })
    .from(activityClarifications)
    .where(eq(activityClarifications.id, id));
  return clarification?.fileKey ?? null;
}

describe("the drawn sample paper", () => {
  const bytes = samplePaperBytes();
  const text = new TextDecoder().decode(bytes);

  it("is a small PDF that the rule for the file of a clarification takes", () => {
    expect(PDF.holds(bytes)).toBe(true);
    expect(
      fileFault({ name: SAMPLE_PAPER_NAME, bytes }, CLARIFICATION_FILE_RULE),
    ).toBeNull();
    expect(bytes.length).toBeLessThan(2000);
  });

  it("says it is a sample, and names nobody", () => {
    const written = [...text.matchAll(/\(([^)]*)\) Tj/g)].map(
      ([, words]) => words,
    );

    expect(written).toEqual([
      "SURAT KETERANGAN",
      "Lampiran contoh",
      "Tanda tangan",
    ]);
  });

  it("says where each of its parts starts, as a reader of PDF needs it", () => {
    const tableStart = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(text)?.[1]);
    const starts = [...text.matchAll(/^(\d{10}) 00000 n $/gm)].map(([, at]) =>
      Number(at),
    );

    expect(text.slice(tableStart, tableStart + 4)).toBe("xref");
    expect(starts).toHaveLength(5);
    for (const [place, start] of starts.entries()) {
      expect(text.slice(start).startsWith(`${place + 1} 0 obj\n`)).toBe(true);
    }
  });

  it("says how long its drawing is", () => {
    const length = Number(/\/Length (\d+)/.exec(text)?.[1]);
    const drawing = /stream\n([\s\S]*)\nendstream/.exec(text)?.[1];

    expect(drawing?.length).toBe(length);
  });
});

describe("addSamplePapers", () => {
  it("gives the paper to each clarification without a file, each a copy of its own", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      const added = await addSamplePapers(db, store);

      const waitingKey = await fileKeyOf(db, records.waitingId);
      const rejectedKey = await fileKeyOf(db, records.rejectedId);
      expect(added).toBe(2);
      expect(waitingKey).toMatch(/^attendance-clarifications\//);
      expect(rejectedKey).toMatch(/^attendance-clarifications\//);
      expect(waitingKey).not.toBe(rejectedKey);
      expect(store.files.get(waitingKey ?? "")).toEqual({
        bytes: samplePaperBytes(),
        contentType: "application/pdf",
      });
      expect(store.files.size).toBe(2);
    });
  });

  it("leaves a file that was sent as it is", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      await addSamplePapers(db, memoryStore());

      expect(await fileKeyOf(db, records.sentId)).toBe(
        "attendance-clarifications/sudah-ada",
      );
    });
  });

  it("adds nothing the second time", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const store = memoryStore();
      await addSamplePapers(db, store);

      expect(await addSamplePapers(db, store)).toBe(0);
      expect(store.files.size).toBe(2);
    });
  });
});

describe("samplePapersAdded", () => {
  it("keeps nothing and says so where the file storage settings are empty", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const said = await samplePapersAdded(db, null);

      expect(said).toBe(
        "The file storage settings are empty; no sample paper is kept.",
      );
      expect(await fileKeyOf(db, records.waitingId)).toBeNull();
    });
  });

  it("says how many papers were added", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await samplePapersAdded(db, memoryStore())).toBe(
        "Sample clarification papers added: 2.",
      );
    });
  });
});

describe("addSamplePapers for the dorm", () => {
  it("gives the paper to each dorm clarification without a file, in a folder of its own", async () => {
    await inTestDatabase(async (db) => {
      const bam = await addTestActor(db, "BAM Uji Kertas Contoh", ["bam_bphk"]);
      const programId = await addTestProgram(db, "UJIKERTASASRAMA");
      const { studentId } = await addTestStudentAccount(db, programId, {
        nim: "9973600002",
        name: "Penghuni Uji Kertas Contoh",
        cohortYear: 2289,
      });
      const countId = await addTestCount(db, {
        activityId: await addTestDormActivity(db, bam.id),
        day: "2290-09-10",
        byId: bam.id,
        marks: { [studentId]: { isAbsent: true, note: "" } },
      });
      const id = await addTestDormClarification(db, bam.id, {
        countId,
        studentId,
      });
      const store = memoryStore();

      expect(await addSamplePapers(db, store)).toBe(1);

      const [kept] = await db
        .select({ fileKey: dormClarifications.fileKey })
        .from(dormClarifications)
        .where(eq(dormClarifications.id, id));
      expect(kept?.fileKey).toMatch(/^dorm-clarifications\//);
      expect(store.files.get(kept?.fileKey ?? "")).toEqual({
        bytes: samplePaperBytes(),
        contentType: "application/pdf",
      });
    });
  });
});
