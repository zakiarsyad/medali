// Sample Tahun akademik of this file: 3203 to 3203.
// Sample NIMs of this file: 9986115000 to 9986115099.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readDisciplineProposals } from "./discipline-proposals";
import { handleDisciplineProposal } from "./handle-proposal";
import { HANDLING_NOTE_NEEDED } from "./proposal-input";
import { addViolationActor, addViolationSetting } from "./test-violations";
import {
  addTestLetter,
  addTestViolations,
  issuedBy,
  letterLinesOf,
  lettersOf,
  periodIdOf,
} from "./test-warnings";
import {
  ALREADY_HANDLED,
  NO_PROPOSAL,
  OWN_PROPOSAL,
  PROPOSAL_HANDLED,
  PROPOSAL_NOT_ALLOWED,
} from "./warning-messages";

const inTestDatabase = withTestDatabase();

// 10:00 on campus on 20 October 3203.
const NOW = new Date("3203-10-20T03:00:00Z");
const NOTE = "Diteruskan ke Pembina Disiplin Mahasiswa.";
const PROPOSAL_NOTE = "Pelanggaran berulang setelah SP 1.";

/**
 * Ani has 12 violations, SP 1 and SP 2 with its proposal; Bea has SP 1
 * only; Kepala Unit handles proposals.
 */
async function setUp(db: Database) {
  const setting = await addViolationSetting(db, 3203, "Prodi Uji Pengajuan", [
    "9986115001",
    "9986115002",
    "9986115003",
    "9986115004",
    "9986115005",
  ]);
  const [ani = "", bea = ""] = setting.residents;
  const bam = await addViolationActor(db, "BAM Uji Pengajuan", ["bam_bphk"]);
  const manager = await addViolationActor(db, "Pengelola Uji Pengajuan", [
    "dorm_manager",
  ]);
  const head = await addViolationActor(db, "Kepala Uji Pengajuan", [
    "head_of_unit",
  ]);
  const periodId = await periodIdOf(db, 3203);
  await addTestViolations(db, ani, bam.id, 12, "3203-09-01");
  await addTestLetter(db, {
    studentId: ani,
    periodId,
    level: 1,
    ...issuedBy(manager.id, new Date("3203-09-10T09:30:00Z")),
  });
  const proposalId = await addTestLetter(db, {
    studentId: ani,
    periodId,
    level: 2,
    ...issuedBy(manager.id, new Date("3203-10-13T09:30:00Z")),
    proposalNote: PROPOSAL_NOTE,
  });
  const firstLetterId = await addTestLetter(db, {
    studentId: bea,
    periodId,
    level: 1,
    ...issuedBy(manager.id),
  });
  return {
    ani,
    bea,
    bam,
    manager,
    head,
    periodId,
    proposalId,
    firstLetterId,
  };
}

function handle(
  db: Database,
  actor: Parameters<typeof handleDisciplineProposal>[1],
  letterId: unknown,
  note: unknown = NOTE,
) {
  return handleDisciplineProposal(db, actor, { letterId, note }, NOW);
}

async function proposalOf(db: Database, studentId: string) {
  const letters = await lettersOf(db, studentId);
  return letters.find((letter) => letter.level === 2);
}

describe("handleDisciplineProposal", () => {
  it("marks the proposal Diproses with the note, who and when, and a line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { ani, head, proposalId } = await setUp(db);

      expect(await handle(db, head, proposalId)).toEqual({
        ok: true,
        value: PROPOSAL_HANDLED,
      });

      expect(await proposalOf(db, ani)).toMatchObject({
        handlingNote: NOTE,
        handledBy: head.id,
        handledAt: NOW,
        proposalNote: PROPOSAL_NOTE,
      });
      const lines = await letterLinesOf(db, proposalId);
      expect(lines.map((line) => [line.action, line.changedBy])).toEqual([
        ["handled", head.id],
      ]);
    });
  });

  it("changes the status once when pressed twice, keeping the first note and one line in the log", async () => {
    await inTestDatabase(async (db) => {
      const { ani, head, proposalId } = await setUp(db);

      await handle(db, head, proposalId);
      expect(
        await handle(db, head, proposalId, "Catatan kedua yang berbeda."),
      ).toEqual(ALREADY_HANDLED);

      expect((await proposalOf(db, ani))?.handlingNote).toBe(NOTE);
      const lines = await letterLinesOf(db, proposalId);
      expect(lines.map((line) => line.action)).toEqual(["handled"]);
    });
  });

  it("refuses an empty note and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const { ani, head, proposalId } = await setUp(db);

      expect(await handle(db, head, proposalId, "   ")).toEqual({
        ok: false,
        error: HANDLING_NOTE_NEEDED,
      });

      expect((await proposalOf(db, ani))?.handledAt).toBeNull();
      expect(await letterLinesOf(db, proposalId)).toEqual([]);
    });
  });

  const refused: RoleId[] = [
    "dorm_manager",
    "discipline_officer",
    "bam_bphk",
    "bam_compliance",
    "director",
    "head_of_program",
    "student",
  ];

  it.each(refused)("refuses a hand-made Proses of %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { ani, proposalId } = await setUp(db);
      const actor = await addViolationActor(db, `Uji ${role}`, [role], ani);

      expect(await handle(db, actor, proposalId)).toEqual(PROPOSAL_NOT_ALLOWED);
      expect((await proposalOf(db, ani))?.handledAt).toBeNull();
    });
  });

  it("refuses an SP 1, an SP 2 not issued yet, a key that is no proposal and what is no key", async () => {
    await inTestDatabase(async (db) => {
      const { bea, head, firstLetterId, periodId } = await setUp(db);
      const calledId = await addTestLetter(db, {
        studentId: bea,
        periodId,
        level: 2,
      });

      for (const letterId of [
        firstLetterId,
        calledId,
        crypto.randomUUID(),
        "bukan-kunci",
        42,
      ]) {
        expect(await handle(db, head, letterId)).toEqual(NO_PROPOSAL);
      }
    });
  });

  it("refuses Kepala Unit the proposal about their own student", async () => {
    await inTestDatabase(async (db) => {
      const { ani, proposalId } = await setUp(db);
      const own = await addViolationActor(
        db,
        "Kepala Uji Pengajuan Sendiri",
        ["head_of_unit", "student"],
        ani,
      );

      expect(await handle(db, own, proposalId)).toEqual(OWN_PROPOSAL);
    });
  });
});

describe("readDisciplineProposals", () => {
  it("gives Kepala Unit and Pengelola Asrama each SP 2 with its counted violations, clarification, proposal and status", async () => {
    await inTestDatabase(async (db) => {
      const { ani, head, manager, proposalId } = await setUp(db);

      const before = await readDisciplineProposals(db, head, 1, NOW);
      const mine = before?.rows.filter((row) => row.studentId === ani);
      expect(mine).toEqual([
        {
          letterId: proposalId,
          studentId: ani,
          name: "Ani Uji Pelanggaran",
          nim: "9986115001",
          semesterTitle: "Ganjil 3203/3204",
          counted: 12,
          clarifiedOn: "3203-10-13",
          result: "Mahasiswa hadir dan mengakui pelanggarannya.",
          proposalNote: PROPOSAL_NOTE,
          proposedAt: new Date("3203-10-13T09:30:00Z"),
          handling: null,
        },
      ]);

      await handle(db, head, proposalId);
      const after = await readDisciplineProposals(db, manager, 1, NOW);
      const handled = after?.rows.find((row) => row.letterId === proposalId);
      expect(handled?.handling).toEqual({
        note: NOTE,
        by: "Kepala Uji Pengajuan",
        at: NOW,
      });
    });
  });

  it("is paged 20 at a time, the latest first, and a page past the end shows the last", async () => {
    await inTestDatabase(async (db) => {
      const { head, manager, periodId } = await setUp(db);
      const programId = await addTestProgram(db, "Prodi Uji Halaman Pengajuan");
      for (let place = 10; place < 30; place++) {
        const studentId = await addTestStudent(db, programId, {
          nim: `99861150${place}`,
          name: `Mahasiswa Uji Halaman ${place}`,
          cohortYear: 3203,
        });
        const day = String(place - 9).padStart(2, "0");
        await addTestLetter(db, {
          studentId,
          periodId,
          level: 2,
          ...issuedBy(manager.id, new Date(`3203-10-${day}T09:30:00Z`)),
        });
      }

      const first = await readDisciplineProposals(db, head, 1, NOW);
      const second = await readDisciplineProposals(db, head, 2, NOW);
      const past = await readDisciplineProposals(db, head, 99, NOW);

      expect(first?.matching).toBe(21);
      expect(first?.rows).toHaveLength(20);
      expect(first?.rows[0]?.name).toBe("Mahasiswa Uji Halaman 29");
      expect(second?.rows.map((row) => row.name)).toEqual([
        "Mahasiswa Uji Halaman 10",
      ]);
      expect(past?.page).toBe(2);
    });
  });

  const refused: RoleId[] = [
    "bam_bphk",
    "bam_compliance",
    "bam_spiritual",
    "director",
    "head_of_program",
    "discipline_officer",
    "student",
  ];

  it.each(refused)("refuses %s the proposals", async (role) => {
    await inTestDatabase(async (db) => {
      const { bea } = await setUp(db);
      const actor = await addViolationActor(db, `Uji ${role}`, [role], bea);

      expect(await readDisciplineProposals(db, actor, 1, NOW)).toBeNull();
    });
  });
});
