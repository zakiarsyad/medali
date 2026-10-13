import { eq, sql } from "drizzle-orm";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, rowLimitForTab } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  activitySchedules,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { visibleTo } from "@/features/students/visible-students";
import {
  type ClarificationPanel,
  panelLine,
  readClarificationPanel,
} from "./clarification-panel";
import { ClarificationPanelView } from "./clarification-panel-view";
import { storedSummaries } from "./clarification-rows";
import {
  addTestActivity,
  addTestActor,
  addTestClarification,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudentAccount,
  type TestStudentAccount,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2260, the programs
 * UJIKLARPANEL and UJIKLARPANELLAIN and the NIMs 9973200000 to
 * 9973200099.
 */

const inTestDatabase = withTestDatabase();

const SENT_AT = new Date("2260-09-12T05:00:00Z");

interface Records {
  assessorId: string;
  programId: number;
  otherProgramId: number;
  scheduleId: string;
  /** Three students of the first program, then two of the other. */
  students: TestStudentAccount[];
}

async function addRecords(db: Database): Promise<Records> {
  const assessor = await addTestActor(db, "Penilai Uji Panel", ["assessor"]);
  const activityId = await addTestActivity(db, assessor.id, {
    name: "Kegiatan uji panel",
  });
  const periods = await addTestPeriods(db, 2260);
  const programId = await addTestProgram(db, "UJIKLARPANEL");
  const otherProgramId = await addTestProgram(db, "UJIKLARPANELLAIN");
  const students: TestStudentAccount[] = [];
  for (let place = 0; place < 5; place++) {
    const student = await addTestStudentAccount(
      db,
      place < 3 ? programId : otherProgramId,
      {
        nim: `997320000${place}`,
        name: `Mahasiswa Uji Panel ${place}`,
        cohortYear: 2259,
      },
    );
    students.push(student);
  }
  const scheduleId = await addTestSchedule(db, {
    activityId,
    academicPeriodId: periods.oddId,
    changedBy: assessor.id,
    startsOn: "2260-09-10",
  });
  return {
    assessorId: assessor.id,
    programId,
    otherProgramId,
    scheduleId,
    students,
  };
}

function studentAt(records: Records, place: number): TestStudentAccount {
  const student = records.students[place];
  if (!student) throw new Error(`There is no student ${place}.`);
  return student;
}

/** A clarification of a student, sent a number of minutes after `SENT_AT`. */
function addSent(
  db: Database,
  records: Records,
  place: number,
  more: Partial<Parameters<typeof addTestClarification>[2]> = {},
): Promise<string> {
  return addTestClarification(db, records.assessorId, {
    scheduleId: records.scheduleId,
    studentId: studentAt(records, place).studentId,
    status: "submitted",
    sentAt: new Date(SENT_AT.getTime() + place * 60_000),
    ...more,
  });
}

/** One of each student: two wait, one accepted, one rejected, one waits. */
async function addOneEach(db: Database, records: Records): Promise<void> {
  await addSent(db, records, 0);
  await addSent(db, records, 1, { status: "accepted" });
  await addSent(db, records, 2, { status: "rejected", note: "Uji." });
  await addSent(db, records, 3);
  await addSent(db, records, 4, {
    status: "accepted",
    acceptedAs: "dispensation",
  });
}

/** The students an account sees on the tab "Kegiatan PPKS", as its page asks. */
function seenOnTab(account: AccountForAccess) {
  return visibleTo(rowLimitForTab(account, "activities", "ppks"));
}

function accountOf(
  id: string,
  role: RoleId,
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id, roles: [role], studyProgramId, studentId: null };
}

/** A group of the first program that the mentor holds today, with these students. */
async function addGroupOf(
  db: Database,
  records: Records,
  mentorId: string,
  places: number[],
): Promise<void> {
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: records.programId,
      cohortYear: 2259,
      entryPath: "regular",
      number: 1,
      startsOn: "2260-08-01",
    })
    .returning({ id: mentorGroups.id });
  if (!group) throw new Error("The group was not added.");
  await db.insert(mentorGroupMentors).values({
    groupId: group.id,
    mentorId,
    startsOn: "2260-08-01",
  });
  await db.insert(mentorGroupMembers).values(
    places.map((place) => ({
      groupId: group.id,
      studentId: studentAt(records, place).studentId,
    })),
  );
}

function namesOf(panel: ClarificationPanel | null): string[] {
  return (panel?.latest ?? []).map((card) => card.name);
}

const name = (place: number) => `Mahasiswa Uji Panel ${place}`;

describe("readClarificationPanel", () => {
  it("is not there for an account that sees no clarification", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addSent(db, records, 3);
      const ownProgram = seenOnTab(
        accountOf(records.assessorId, "head_of_program", records.programId),
      );

      expect(await readClarificationPanel(db, ownProgram)).toBeNull();
      expect(await readClarificationPanel(db, sql`false`)).toBeNull();
    });
  });

  it("counts and lists for Ketua Program Studi the clarifications of their own program only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addOneEach(db, records);
      const head = accountOf(
        records.assessorId,
        "head_of_program",
        records.programId,
      );

      const panel = await readClarificationPanel(db, seenOnTab(head));

      expect(panel?.counts).toEqual({ submitted: 1, accepted: 1, rejected: 1 });
      expect(namesOf(panel)).toEqual([name(2), name(1), name(0)]);
    });
  });

  it("counts and lists for Pengasuh the clarifications of their own mentees only", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addOneEach(db, records);
      const mentor = await addTestActor(db, "Pengasuh Uji Panel", ["mentor"]);
      const other = await addTestActor(db, "Pengasuh Uji Lain", ["mentor"]);
      await addGroupOf(db, records, mentor.id, [0, 2]);

      const own = await readClarificationPanel(
        db,
        seenOnTab(accountOf(mentor.id, "mentor")),
      );
      const none = await readClarificationPanel(
        db,
        seenOnTab(accountOf(other.id, "mentor")),
      );

      expect(own?.counts).toEqual({ submitted: 1, accepted: 0, rejected: 1 });
      expect(namesOf(own)).toEqual([name(2), name(0)]);
      expect(none).toBeNull();
    });
  });

  it.each([
    ["Kepala Unit", "head_of_unit"],
    ["Pegawai UPK", "upk_staff"],
    ["Direktur / Wakil Direktur", "director"],
  ] as const)(
    "counts and lists for %s the clarifications of every student",
    async (_who, role) => {
      await inTestDatabase(async (db) => {
        const records = await addRecords(db);
        const everyone = seenOnTab(accountOf(records.assessorId, role));
        const before = await readClarificationPanel(db, everyone);
        await addOneEach(db, records);

        const panel = await readClarificationPanel(db, everyone);

        const had = before?.counts ?? {
          submitted: 0,
          accepted: 0,
          rejected: 0,
        };
        expect(panel?.counts).toEqual({
          submitted: had.submitted + 2,
          accepted: had.accepted + 2,
          rejected: had.rejected + 1,
        });
      });
    },
  );

  it("lists the newest six, the newest first, and counts them all", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const earlier = await addTestSchedule(db, {
        activityId: await addTestActivity(db, records.assessorId),
        academicPeriodId: (await addTestPeriods(db, 2262)).oddId,
        changedBy: records.assessorId,
        startsOn: "2262-09-01",
      });
      for (let place = 0; place < 5; place++) {
        await addSent(db, records, place);
      }
      await addSent(db, records, 0, {
        scheduleId: earlier,
        sentAt: new Date(SENT_AT.getTime() + 10 * 60_000),
      });
      await addSent(db, records, 1, {
        scheduleId: earlier,
        sentAt: new Date(SENT_AT.getTime() + 11 * 60_000),
      });
      const both = sql`${visibleTo({ kind: "all" })} and students.nim like '99732000%'`;

      const panel = await readClarificationPanel(db, both);

      expect(panel?.counts.submitted).toBe(7);
      expect(namesOf(panel)).toEqual([
        name(1),
        name(0),
        name(4),
        name(3),
        name(2),
        name(1),
      ]);
    });
  });

  it("leaves out the clarifications of a removed schedule, from the list and from the counts", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      await addOneEach(db, records);
      const head = seenOnTab(
        accountOf(records.assessorId, "head_of_program", records.programId),
      );
      await db
        .update(activitySchedules)
        .set({ deletedAt: SENT_AT, deletedBy: records.assessorId })
        .where(eq(activitySchedules.id, records.scheduleId));

      expect(await readClarificationPanel(db, head)).toBeNull();
    });
  });

  it("hands over the student, the activity, the reason, the status, when it was sent and the decision with its note, and neither the explanation nor anything of the file", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const id = await addSent(db, records, 0, {
        status: "rejected",
        note: "Lampiran tidak terbaca.",
        explanation: "Penjelasan rahasia uji panel.",
        fileKey: "attendance-clarifications/rahasia-uji-panel.pdf",
        fileName: "rahasia-uji-panel.pdf",
      });
      const head = seenOnTab(
        accountOf(records.assessorId, "head_of_program", records.programId),
      );

      const panel = await readClarificationPanel(db, head);

      expect(panel?.latest).toEqual([
        {
          id,
          sentAt: "2260-09-12T05:00:00.000Z",
          name: name(0),
          nim: "9973200000",
          program: "UJIKLARPANEL",
          activity: "Kegiatan uji panel",
          held: "10 Sep 2260, 07:30–11:30",
          reason: "Sakit",
          status: "rejected",
          sent: "12 Sep 2260, 12.00",
          decision: {
            result: "Ditolak: Lampiran tidak terbaca.",
            by: "(Penilai Uji Panel, 11 Sep 2150, 10.00)",
          },
        },
      ]);
      expect(JSON.stringify(panel)).not.toContain("rahasia");
    });
  });

  it("does not ask the database for the explanation or the file at all", async () => {
    await inTestDatabase(async (db) => {
      const asked = storedSummaries(db, undefined).toSQL().sql;

      expect(asked).toContain('"activity_clarifications"."reason"');
      expect(asked).not.toContain("explanation");
      expect(asked).not.toContain("file_");
    });
  });
});

describe("panelLine", () => {
  it("says how many wait for Penilai Mahasiswa, were accepted and were rejected", () => {
    const counts = { submitted: 1250, accepted: 22, rejected: 0 };

    expect(panelLine(counts)).toBe(
      "1.250 menunggu Penilai Mahasiswa · 22 diterima · 0 ditolak",
    );
  });
});

describe("ClarificationPanelView", () => {
  const panel: ClarificationPanel = {
    counts: { submitted: 2, accepted: 1, rejected: 1 },
    latest: [
      {
        id: "00000000-0000-4000-8000-0000000000e1",
        sentAt: "2026-10-13T05:00:00.000Z",
        name: "Mahasiswa Uji Panel",
        nim: "8800000021",
        program: "Akuntansi uji",
        activity: "Latihan dasar kepemimpinan uji",
        held: "10 Okt 2026, 07:30–11:30",
        reason: "Sakit",
        status: "accepted",
        sent: "13 Okt 2026, 12.00",
        decision: {
          result: "Diterima sebagai dispensasi: Surat sesuai.",
          by: "(Penilai Uji, 14 Okt 2026, 09.00)",
        },
      },
    ],
  };
  const shown = renderToStaticMarkup(<ClarificationPanelView panel={panel} />);

  it("is headed Klarifikasi kehadiran, with the line that counts", () => {
    expect(shown).toMatch(/<h2[^>]*>Klarifikasi kehadiran<\/h2>/);
    expect(shown).toContain(
      "2 menunggu Penilai Mahasiswa · 1 diterima · 1 ditolak",
    );
  });

  it("shows the student, the activity with its time, the reason, the status, when it was sent and the decision with who and when", () => {
    for (const words of [
      "Mahasiswa Uji Panel",
      "8800000021 · Akuntansi uji",
      "Diterima</span>",
      "<dt>Kegiatan</dt><dd>Latihan dasar kepemimpinan uji",
      "10 Okt 2026, 07:30–11:30",
      "<dt>Alasan</dt><dd>Sakit</dd>",
      "<dt>Diajukan</dt><dd>13 Okt 2026, 12.00</dd>",
      "<dt>Keputusan</dt><dd>Diterima sebagai dispensasi: Surat sesuai.",
      "(Penilai Uji, 14 Okt 2026, 09.00)",
    ]) {
      expect(shown).toContain(words);
    }
  });

  it("shows no Penjelasan, no Lampiran, nothing to press and no way to the file", () => {
    expect(shown).not.toContain("Penjelasan");
    expect(shown).not.toContain("Lampiran");
    expect(shown).not.toContain("<button");
    expect(shown).not.toContain("<input");
    expect(shown).not.toContain("/lampiran/");
  });
});
