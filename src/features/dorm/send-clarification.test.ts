// Sample Tahun akademik of this file: 3010 to 3010.
// Sample NIMs of this file: 9937980200 to 9937980299.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { testPaper, testPngPicture } from "@/clarifications/test-paper";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  type MemoryStore,
  memoryStore,
  unreachableStore,
} from "@/files/memory-store";
import {
  ABSENCE_NOT_FOUND,
  ASK_NOT_ALLOWED,
  CLARIFICATION_CLOSED,
  FILE_NOT_KEPT,
  NO_FILE_STORAGE,
  NOT_TO_CLARIFY,
} from "./clarification-messages";
import {
  type SentDormClarification,
  sendDormClarification,
} from "./send-clarification";
import { addTestActivity } from "./test-activities";
import {
  addTestClarification,
  addTestCount,
  clarificationsOf,
} from "./test-clarifications";
import { addTestResidents, type TestResident } from "./test-leave";
import { addTestActor } from "./test-records";
import { addApprovedLeave } from "./test-returns";

const inTestDatabase = withTestDatabase();

/** The day of the counted Apel pagi uji, 05:30 to 06:15. */
const DAY = "3010-10-13";
/** Ten in the morning on campus, on that day: the activity is over. */
const AFTER = new Date("3010-10-13T03:00:00Z");
/** Six in the morning on campus: the activity still runs. */
const WHILE_RUNNING = new Date("3010-10-12T23:00:00Z");
/** The last second of the seventh day after, on campus. */
const LAST_MOMENT = new Date("3010-10-20T16:59:59Z");
/** Midnight on campus, when the eighth day starts. */
const TOO_LATE = new Date("3010-10-20T17:00:00Z");
const MEGABYTE = 1024 * 1024;
const SENT = { ok: true, value: "Klarifikasi terkirim." };

function said(error: string) {
  return { ok: false, error };
}

interface Records {
  bamId: string;
  activityId: string;
  /** Absent in the announced count of the day. */
  ani: TestResident;
  /** Present in it. */
  budi: TestResident;
  /** Not in it at all. */
  citra: TestResident;
  countId: string;
}

async function addRecords(
  db: Database,
  count: { isAnnounced?: boolean } = {},
): Promise<Records> {
  const [ani, budi, citra] = await addTestResidents(
    db,
    3010,
    "Prodi Uji Kirim Klar Asrama",
    ["9937980201", "9937980202", "9937980203"],
  );
  if (!ani || !budi || !citra) throw new Error("The residents were not added.");
  const bam = await addTestActor(db, "BAM Uji Kirim Klar", ["bam_bphk"]);
  const activityId = await addTestActivity(db, bam.id);
  const countId = await addTestCount(db, {
    activityId,
    day: DAY,
    byId: bam.id,
    marks: {
      [ani.studentId]: { isAbsent: true, note: "" },
      [budi.studentId]: { isAbsent: false, note: "" },
    },
    ...count,
  });
  return { bamId: bam.id, activityId, ani, budi, citra, countId };
}

function sentFor(
  records: Records,
  more: Partial<SentDormClarification> = {},
): SentDormClarification {
  return {
    activityId: records.activityId,
    day: DAY,
    reason: "sick",
    explanation: "  Demam sejak malam dan beristirahat di kamar.  ",
    file: { name: "surat-dokter.pdf", bytes: testPaper(200) },
    ...more,
  };
}

function send(
  db: Database,
  store: MemoryStore | null,
  resident: { roles: RoleId[]; studentId: string | null },
  sent: SentDormClarification,
  at = AFTER,
) {
  return sendDormClarification(db, store, resident, sent, at);
}

describe("sendDormClarification", () => {
  it("keeps a clarification of the resident's own absence, waiting for BAM, with its file", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      expect(await send(db, store, records.ani, sentFor(records))).toEqual(
        SENT,
      );

      const [kept] = await clarificationsOf(db, records.ani.studentId);
      expect(kept).toMatchObject({
        countId: records.countId,
        status: "submitted",
        reason: "sick",
        explanation: "Demam sejak malam dan beristirahat di kamar.",
        fileName: "surat-dokter.pdf",
        fileContentType: "application/pdf",
        fileSize: 200,
        sentAt: AFTER,
        verifiedAt: null,
        decidedAt: null,
      });
      expect(kept?.fileKey).toMatch(/^dorm-clarifications\//);
      expect(store.files.get(kept?.fileKey ?? "")?.bytes).toEqual(
        testPaper(200),
      );
    });
  });

  it("keeps one when sent twice, and removes the file of the second", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      await send(db, store, records.ani, sentFor(records));
      expect(await send(db, store, records.ani, sentFor(records))).toEqual(
        SENT,
      );

      expect(await clarificationsOf(db, records.ani.studentId)).toHaveLength(1);
      expect(store.files.size).toBe(1);
    });
  });

  it("takes a clarification up to the last second of the seventh day after the activity, and refuses it after", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      expect(
        await send(db, store, records.ani, sentFor(records), TOO_LATE),
      ).toEqual(CLARIFICATION_CLOSED);
      expect(
        await send(db, store, records.ani, sentFor(records), LAST_MOMENT),
      ).toEqual(SENT);
    });
  });

  it("refuses an account without the right, and one without a student", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();
      const bamWithStudent = { ...records.ani, roles: ["bam_bphk" as const] };
      const noStudent = { roles: ["student" as const], studentId: null };

      for (const account of [bamWithStudent, noStudent]) {
        expect(await send(db, store, account, sentFor(records))).toEqual(
          ASK_NOT_ALLOWED,
        );
      }
      expect(store.files.size).toBe(0);
    });
  });

  it("refuses a resident who was present, and one who asks of an absence that is another resident's", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const store = memoryStore();

      expect(await send(db, store, records.budi, sentFor(records))).toEqual(
        NOT_TO_CLARIFY,
      );
      expect(await send(db, store, records.citra, sentFor(records))).toEqual(
        NOT_TO_CLARIFY,
      );
      expect(store.files.size).toBe(0);
      expect(await clarificationsOf(db, records.ani.studentId)).toEqual([]);
    });
  });

  it("refuses an absence of a count that is still a draft, or of an activity that still runs", async () => {
    await inTestDatabase(async (db) => {
      const draft = await addRecords(db, { isAnnounced: false });

      expect(await send(db, memoryStore(), draft.ani, sentFor(draft))).toEqual(
        NOT_TO_CLARIFY,
      );
      expect(
        await send(db, memoryStore(), draft.ani, sentFor(draft), WHILE_RUNNING),
      ).toEqual(NOT_TO_CLARIFY);
    });
  });

  it("refuses an absence of an activity that still runs, though it was announced", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(
        await send(
          db,
          memoryStore(),
          records.ani,
          sentFor(records),
          WHILE_RUNNING,
        ),
      ).toEqual(NOT_TO_CLARIFY);
    });
  });

  it("refuses an absence that approved leave covers: the resident is Izin there", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addApprovedLeave(db, records.ani.studentId, records.bamId, {
        kind: "outing",
        startsAt: `${DAY}T05:00`,
        endsAt: `${DAY}T09:00`,
      });

      expect(
        await send(db, memoryStore(), records.ani, sentFor(records)),
      ).toEqual(NOT_TO_CLARIFY);
    });
  });

  it("takes another after a rejection or a closing, and none after an acceptance", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { countId, ani } = records;
      const own = { countId, studentId: ani.studentId };
      await addTestClarification(db, records.bamId, {
        ...own,
        status: "rejected",
      });
      await addTestClarification(db, records.bamId, {
        ...own,
        status: "closed",
      });

      expect(await send(db, memoryStore(), ani, sentFor(records))).toEqual(
        SENT,
      );
    });
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addTestClarification(db, records.bamId, {
        countId: records.countId,
        studentId: records.ani.studentId,
        status: "accepted",
      });

      expect(
        await send(db, memoryStore(), records.ani, sentFor(records)),
      ).toEqual(NOT_TO_CLARIFY);
    });
  });

  it.each([
    [
      "an explanation that is too short",
      { explanation: "Sakit." },
      "Tulis penjelasan minimal satu kalimat.",
    ],
    ["no file", { file: null }, "Lampirkan dokumen pendukung."],
    [
      "a file of another kind",
      { file: { name: "gambar.svg", bytes: testPaper() } },
      "Lampiran harus berupa PDF atau gambar.",
    ],
    [
      "a file that is not what its name says",
      { file: { name: "surat.pdf", bytes: testPngPicture() } },
      "Lampiran harus berupa PDF atau gambar.",
    ],
    [
      "a file larger than 5 MB",
      { file: { name: "surat.pdf", bytes: testPaper(5 * MEGABYTE + 1) } },
      "Ukuran lampiran maksimal 5 MB.",
    ],
    [
      "a reason not on the list",
      { reason: "technical_trouble" },
      "Pilih alasan klarifikasi.",
    ],
  ] as const)(
    "saves nothing for %s, and says why",
    async (_kind, wrong, words) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const store = memoryStore();

        expect(
          await send(db, store, records.ani, sentFor(records, wrong)),
        ).toEqual(said(words));
        expect(store.files.size).toBe(0);
        expect(await clarificationsOf(db, records.ani.studentId)).toEqual([]);
      });
    },
  );

  it("refuses an activity or a day that is not one", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      for (const wrong of [{ activityId: "lain" }, { day: "3010-02-30" }]) {
        expect(
          await send(db, memoryStore(), records.ani, sentFor(records, wrong)),
        ).toEqual(ABSENCE_NOT_FOUND);
      }
    });
  });

  it("saves nothing where file storage is off, and says so", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      expect(await send(db, null, records.ani, sentFor(records))).toEqual(
        NO_FILE_STORAGE,
      );
      expect(await clarificationsOf(db, records.ani.studentId)).toEqual([]);
    });
  });

  it("saves nothing when the file storage cannot be reached, and asks to try again", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const answer = await sendDormClarification(
        db,
        unreachableStore(),
        records.ani,
        sentFor(records),
        AFTER,
      );

      expect(answer).toEqual(FILE_NOT_KEPT);
      expect(await clarificationsOf(db, records.ani.studentId)).toEqual([]);
    });
  });
});
