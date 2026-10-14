// Sample NIMs of this file: 9964000400 to 9964000499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  sikuAdjustmentChanges,
  sikuAdjustments,
  sikuUploads,
} from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { cancelSikuEntry } from "./cancel-entry";
import { saveSikuEntry } from "./save-entry";
import { FILE_ALREADY_SENT, saveSikuFile } from "./save-siku-file";
import { ALREADY_CANCELLED, ENTRY_ALREADY_SENT } from "./siku-messages";
import {
  addTestActor,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("siku");

// 10:00 on campus on 12 October 2026.
const MOMENT = new Date("2026-10-12T03:00:00Z");

let records: { penilai: TestActor; studentIds: string[] } | undefined;

/** The period, the students and Penilai Mahasiswa, once for the file. */
async function prepared() {
  if (records) return records;
  await addTestYear(own.db, 2026);
  const { studentIds } = await addTestStudents(
    own.db,
    "Prodi Uji SIKU Sekaligus",
    2026,
    ["9964000401", "9964000402"],
  );
  const penilai = await addTestActor(own.db, "Penilai Uji Sekaligus", [
    "assessor",
  ]);
  records = { penilai, studentIds };
  return records;
}

describe("Simpan pressed twice at the same moment", () => {
  it("keeps the entry once, with one log line: the second waits, then answers the same", async () => {
    const { penilai, studentIds } = await prepared();
    const id = crypto.randomUUID();
    const sent = {
      kind: "gain",
      reason: "peer_mentoring",
      points: "2",
      day: "2026-10-12",
      note: "",
      basis: "",
      studentIds,
    };

    const both = await own.atOnce(
      (db) => saveSikuEntry(db, penilai, id, sent, MOMENT),
      (db) => saveSikuEntry(db, penilai, id, sent, MOMENT),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: { kind: "gain", points: 2, students: 2 },
    });
    expect(both.later).toEqual(both.sooner);
    const kept = await own.db
      .select()
      .from(sikuAdjustments)
      .where(eq(sikuAdjustments.id, id));
    const lines = await own.db
      .select()
      .from(sikuAdjustmentChanges)
      .where(eq(sikuAdjustmentChanges.adjustmentId, id));
    expect(kept).toHaveLength(1);
    expect(lines).toHaveLength(1);
  });
});

describe("Batalkan pressed twice at the same moment", () => {
  it("cancels the entry once, with one log line: the second waits, then is refused", async () => {
    const { penilai, studentIds } = await prepared();
    const id = crypto.randomUUID();
    const saved = await saveSikuEntry(
      own.db,
      penilai,
      id,
      {
        kind: "loss",
        reason: "discipline_penalty",
        points: "5",
        day: "2026-10-12",
        note: "",
        basis: "",
        studentIds,
      },
      MOMENT,
    );
    if (!saved.ok) throw new Error(saved.error);

    const both = await own.atOnce<Parsed<null>>(
      (db) => cancelSikuEntry(db, penilai, id),
      (db) => cancelSikuEntry(db, penilai, id),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(ALREADY_CANCELLED);
    const lines = await own.db
      .select({ action: sikuAdjustmentChanges.action })
      .from(sikuAdjustmentChanges)
      .where(eq(sikuAdjustmentChanges.adjustmentId, id));
    expect(lines.map((line) => line.action).sort()).toEqual([
      "cancelled",
      "entered",
    ]);
  });
});

describe("a form entry and a file saved at the same moment with the same key", () => {
  // The students of `prepared`, a gain for one and a loss for the other.
  const FILE = {
    name: "siku-sekaligus.csv",
    bytes: new TextEncoder().encode(
      [
        "nim,jenis,alasan,poin,keterangan",
        "9964000401,tambah,1,2,",
        "9964000402,kurang,3,1,",
      ].join("\n"),
    ),
  };

  function formFor(studentIds: string[]) {
    return {
      kind: "gain",
      reason: "peer_mentoring",
      points: "2",
      day: "2026-10-12",
      note: "",
      basis: "",
      studentIds,
    };
  }

  async function keptUnder(id: string) {
    const entries = await own.db
      .select()
      .from(sikuAdjustments)
      .where(eq(sikuAdjustments.id, id));
    const uploads = await own.db
      .select()
      .from(sikuUploads)
      .where(eq(sikuUploads.id, id));
    return { entries: entries.length, uploads: uploads.length };
  }

  it("keeps the form entry when it comes first: the file waits, then is refused", async () => {
    const { penilai, studentIds } = await prepared();
    const id = crypto.randomUUID();

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => saveSikuEntry(db, penilai, id, formFor(studentIds), MOMENT),
      (db) => saveSikuFile(db, penilai, id, FILE, true, MOMENT),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual(FILE_ALREADY_SENT);
    expect(await keptUnder(id)).toEqual({ entries: 1, uploads: 0 });
  });

  it("keeps the file when it comes first: the form entry waits, then is refused", async () => {
    const { penilai, studentIds } = await prepared();
    const id = crypto.randomUUID();

    const both = await own.atOnce<Parsed<unknown>>(
      (db) => saveSikuFile(db, penilai, id, FILE, true, MOMENT),
      (db) => saveSikuEntry(db, penilai, id, formFor(studentIds), MOMENT),
    );

    expect(both.sooner).toEqual({ ok: true, value: { saved: 2 } });
    expect(both.later).toEqual(ENTRY_ALREADY_SENT);
    expect(await keptUnder(id)).toEqual({ entries: 0, uploads: 1 });
  });
});
