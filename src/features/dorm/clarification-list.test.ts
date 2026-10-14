// Sample Tahun akademik of this file: 3040 to 3040.
// Sample NIMs of this file: 9937980500 to 9937980599.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { visibleTo } from "@/features/students/visible-students";
import type { ClarificationFilters } from "./clarification-address";
import { readClarificationBoard } from "./clarification-list";
import { addTestActivity } from "./test-activities";
import { addTestClarification, addTestCount } from "./test-clarifications";
import { addTestResidents } from "./test-leave";
import { addTestActor, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 14 October 3040.
const NOW = new Date("3040-10-14T03:00:00Z");
const ALL: ClarificationFilters = { query: "", status: "all" };

function board(
  db: Database,
  filters: ClarificationFilters = ALL,
  more: {
    page?: number;
    mayOpenFiles?: boolean;
    visible?: typeof EVERYONE;
  } = {},
) {
  return readClarificationBoard(
    db,
    more.visible ?? EVERYONE,
    filters,
    more.page ?? 1,
    { mayOpenFiles: more.mayOpenFiles ?? true, now: NOW },
  );
}

/** Two residents absent at the Apel pagi uji of 13 October 3040. */
async function addRecords(db: Database) {
  const [ani, budi] = await addTestResidents(
    db,
    3040,
    "Prodi Uji Daftar Klar",
    ["9937980501", "9937980502"],
  );
  if (!ani || !budi) throw new Error("The residents were not added.");
  const bam = await addTestActor(db, "BAM Uji Daftar Klar", ["bam_bphk"]);
  const manager = await addTestActor(db, "Pengelola Uji Daftar Klar", [
    "dorm_manager",
  ]);
  const activityId = await addTestActivity(db, bam.id);
  const countId = await addTestCount(db, {
    activityId,
    day: "3040-10-13",
    byId: bam.id,
    marks: {
      [ani.studentId]: { isAbsent: true, note: "" },
      [budi.studentId]: { isAbsent: true, note: "" },
    },
  });
  return { ani, budi, bam, manager, countId };
}

describe("readClarificationBoard", () => {
  it("counts the clarifications in each status, and shows one card for each with every check and decision, with who and when", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, bam, manager, countId } = await addRecords(db);
      await addTestClarification(db, bam.id, {
        countId,
        studentId: ani.studentId,
        status: "submitted",
        fileKey: "dorm-clarifications/uji-1",
        sentAt: new Date("3040-10-13T05:00:00Z"),
      });
      await addTestClarification(db, bam.id, {
        countId,
        studentId: budi.studentId,
        status: "accepted",
        acceptedAs: "leave",
        verifyNote: "Dikonfirmasi ketua kamar.",
        decidedBy: manager.id,
        decisionNote: "Surat sesuai.",
        sentAt: new Date("3040-10-13T04:00:00Z"),
      });

      const { counts, list } = await board(db);

      expect(counts).toEqual({
        submitted: 1,
        verified: 0,
        accepted: 1,
        rejected: 0,
      });
      expect(list.matching).toBe(2);
      expect(list.cards.map((card) => card.name)).toEqual([
        "Penghuni Uji Izin 1",
        "Penghuni Uji Izin 2",
      ]);
      const [waiting, accepted] = list.cards;
      expect(waiting).toMatchObject({
        nim: "9937980501",
        room: "Asrama Dana Rakca, belum diplot",
        activity: "Apel pagi uji",
        held: "13 Okt 3040, 05:30–06:15",
        reason: "Sakit",
        explanation: "Demam dan beristirahat di kamar.",
        status: "submitted",
        hasFile: true,
        file: {
          name: "surat-keterangan.pdf",
          isPdf: true,
          facts: "Dokumen PDF · 1 KB",
        },
        sent: "13 Okt 3040, 12.00",
        verification: null,
        decision: null,
      });
      expect(accepted).toMatchObject({
        hasFile: false,
        file: null,
        verification: {
          result: "Diterima BAM: Dikonfirmasi ketua kamar.",
          by: "(BAM Uji Daftar Klar, 13 Okt 2026, 12.00)",
        },
        decision: {
          result: "Diterima sebagai izin: Surat sesuai.",
          by: "(Pengelola Uji Daftar Klar, 13 Okt 2026, 12.00)",
        },
      });
    });
  });

  it("names no file to an account that may not open it, and says only that there is one", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bam, countId } = await addRecords(db);
      await addTestClarification(db, bam.id, {
        countId,
        studentId: ani.studentId,
        fileKey: "dorm-clarifications/uji-2",
      });

      const { list } = await board(db, ALL, { mayOpenFiles: false });

      expect(list.cards[0]).toMatchObject({ hasFile: true, file: null });
    });
  });

  it("narrows the cards to a status and to a name or NIM searched", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, bam, countId } = await addRecords(db);
      await addTestClarification(db, bam.id, {
        countId,
        studentId: ani.studentId,
        status: "verified",
      });
      await addTestClarification(db, bam.id, {
        countId,
        studentId: budi.studentId,
        status: "rejected",
      });

      const verified = await board(db, { query: "", status: "verified" });
      const found = await board(db, { query: "9937980502", status: "all" });
      const none = await board(db, { query: "", status: "closed" });

      expect(verified.list.cards.map((card) => card.status)).toEqual([
        "verified",
      ]);
      expect(found.list.cards.map((card) => card.nim)).toEqual(["9937980502"]);
      expect(none.list).toEqual({ cards: [], matching: 0, page: 1 });
      expect(none.counts.rejected).toBe(1);
    });
  });

  it("shows 20 cards a page, and the last page for one past the end", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bam, countId } = await addRecords(db);
      for (let place = 0; place < 21; place++) {
        await addTestClarification(db, bam.id, {
          countId,
          studentId: ani.studentId,
          status: "rejected",
          sentAt: new Date(Date.UTC(3040, 9, 13, 5, place)),
        });
      }

      const first = await board(db);
      const past = await board(db, ALL, { page: 9 });

      expect(first.list.cards).toHaveLength(20);
      expect(first.list.matching).toBe(21);
      expect(past.list.page).toBe(2);
      expect(past.list.cards).toHaveLength(1);
    });
  });

  it("shows Ketua Program Studi only the clarifications of their own study program", async () => {
    await inTestDatabase(async (db) => {
      const { ani, bam, countId } = await addRecords(db);
      await addTestClarification(db, bam.id, {
        countId,
        studentId: ani.studentId,
      });
      const [student] = await db
        .select({ program: students.studyProgramId })
        .from(students)
        .where(eq(students.id, ani.studentId));
      if (!student) throw new Error("The student was not found.");
      const limit = (program: number) =>
        visibleTo({
          kind: "some",
          studyProgramIds: [program],
          menteesOf: [],
          studentIds: [],
        });

      const outside = await board(db, ALL, {
        visible: limit(student.program + 1000),
      });
      const inside = await board(db, ALL, { visible: limit(student.program) });

      expect(outside.counts.submitted).toBe(0);
      expect(outside.list.cards).toEqual([]);
      expect(inside.list.cards).toHaveLength(1);
    });
  });
});
