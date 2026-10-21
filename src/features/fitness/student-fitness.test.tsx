// Sample NIMs of this file: 9989410000 to 9989410099.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { addTestNote } from "@/health-notes/test-health";
import { readStudentFitness } from "./student-fitness";
import { StudentFitnessView } from "./student-fitness-view";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

const ADVICE = "Kontrol rutin ke klinik kampus.";

/**
 * Ani and Budi of one program, Ani a mentee of the Pengasuh; Citra of
 * another program. Ani scored 80 (Baik) and has a note of asthma that
 * puts her in Perlu perhatian. Budi scored 50 and has no note. Citra
 * scored 90 and has a note. Nobody else is tested.
 */
async function addRecords(db: Database) {
  const kepala = await addTestActor(db, "Kepala Uji Jasmani Detail", [
    "head_of_unit",
  ]);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Jasmani Detail",
    ["9989410001", "9989410002", "9989410004"],
  );
  const [ani = "", budi = "", dewi = ""] = studentIds;
  const otherId = await addTestProgram(db, "Prodi Uji Jasmani Detail Lain");
  const citra = await addTestStudent(db, otherId, {
    nim: "9989410003",
    name: "Mahasiswa Uji Jasmani Detail Lain",
  });
  const mentor = await addTestActor(db, "Pengasuh Uji Jasmani Detail", [
    "mentor",
  ]);
  const group = await addTestGroup(db, programId, [ani], {
    mentorId: mentor.id,
  });
  const otherGroup = await addTestGroup(db, otherId, [budi, citra], {
    number: 2,
  });
  await addTestScores(db, kepala, {
    groupId: group,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [{ studentId: ani, score: 80 }],
  });
  await addTestScores(db, kepala, {
    groupId: otherGroup,
    testedOn: "2026-10-02",
    enteredAt: new Date("2026-10-02T03:00:00Z"),
    scores: [
      { studentId: budi, score: 50 },
      { studentId: citra, score: 90 },
    ],
  });
  for (const studentId of [ani, citra]) {
    await addTestNote(db, kepala, {
      studentId,
      savedAt: new Date("2026-10-05T03:00:00Z"),
      illnesses: [{ illness: "asthma", note: "sejak SMP" }],
      advice: ADVICE,
      category: "attention",
    });
  }
  const actor = (name: string, roles: RoleId[]) =>
    addTestActor(db, name, roles, { studyProgramId: programId });
  return { ani, budi, citra, dewi, kepala, mentor, actor };
}

describe("readStudentFitness", () => {
  it("gives Kepala Unit the score, the day, the final category with its mark, and the note", async () => {
    await inTestDatabase(async (db) => {
      const { ani, kepala } = await addRecords(db);

      const shown = await readStudentFitness(db, kepala, ani);

      expect(shown).toEqual({
        latest: { score: 80, testedOn: "2026-10-01" },
        final: { category: "attention", fromNote: true },
        health: {
          note: expect.objectContaining({
            illnesses: [{ illness: "asthma", note: "sejak SMP" }],
            advice: ADVICE,
          }),
        },
      });
    });
  });

  it("gives Pengasuh the note of their own mentee", async () => {
    await inTestDatabase(async (db) => {
      const { ani, mentor } = await addRecords(db);

      const shown = await readStudentFitness(db, mentor, ani);

      expect(shown?.health?.note?.advice).toBe(ADVICE);
      expect(shown?.final.fromNote).toBe(true);
    });
  });

  it.each([
    ["director", "Direktur"],
    ["head_of_program", "Kaprodi"],
  ] as const)(
    "gives %s the score, the day and the final category, with no note, no illness and no mark of a note",
    async (role, name) => {
      await inTestDatabase(async (db) => {
        const { ani, actor } = await addRecords(db);
        const account = await actor(`${name} Uji Jasmani Detail`, [role]);

        const shown = await readStudentFitness(db, account, ani);

        expect(shown).toEqual({
          latest: { score: 80, testedOn: "2026-10-01" },
          final: { category: "attention", fromNote: false },
          health: null,
        });
        expect(JSON.stringify(shown)).not.toContain("asthma");
        if (!shown) throw new Error("Nothing shown.");
        const markup = renderToStaticMarkup(
          <StudentFitnessView fitness={shown} />,
        );
        expect(markup).toContain("Kesehatan jasmani");
        expect(markup).toContain("80");
        expect(markup).not.toContain(ADVICE);
        expect(markup).not.toContain("Asma");
        expect(markup).not.toContain("catatan kesehatan");
        expect(markup).not.toContain("Catatan kesehatan");
      });
    },
  );

  it("says nothing of a test for a student never tested", async () => {
    await inTestDatabase(async (db) => {
      const { dewi, kepala } = await addRecords(db);

      const shown = await readStudentFitness(db, kepala, dewi);

      expect(shown).toEqual({
        latest: null,
        final: { category: "untested", fromNote: false },
        health: { note: null },
      });
    });
  });

  it("refuses a role without the panel, the same whether or not the student was tested", async () => {
    await inTestDatabase(async (db) => {
      const { ani, dewi, actor } = await addRecords(db);
      const penilai = await actor("Penilai Uji Jasmani Detail", ["assessor"]);
      const konselor = await actor("Konselor Uji Jasmani Detail", [
        "counsellor",
      ]);

      for (const account of [penilai, konselor]) {
        expect(await readStudentFitness(db, account, ani)).toBeNull();
        expect(await readStudentFitness(db, account, dewi)).toBeNull();
      }
    });
  });

  it("refuses a student outside the program of Ketua Program Studi or the mentees of Pengasuh, the same whether or not the student was tested", async () => {
    await inTestDatabase(async (db) => {
      const { budi, citra, dewi, mentor, actor } = await addRecords(db);
      const kaprodi = await actor("Kaprodi Uji Jasmani Luar", [
        "head_of_program",
      ]);

      expect(await readStudentFitness(db, kaprodi, citra)).toBeNull();
      expect(await readStudentFitness(db, mentor, budi)).toBeNull();
      expect(await readStudentFitness(db, mentor, dewi)).toBeNull();
    });
  });

  it("refuses an id of nobody and a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addRecords(db);

      expect(
        await readStudentFitness(db, kepala, crypto.randomUUID()),
      ).toBeNull();
      expect(await readStudentFitness(db, kepala, "9989410001")).toBeNull();
    });
  });
});

describe("StudentFitnessView", () => {
  it("shows the note text, and the mark that the note made the category", () => {
    const markup = renderToStaticMarkup(
      <StudentFitnessView
        fitness={{
          latest: { score: 80, testedOn: "2026-10-01" },
          final: { category: "attention", fromNote: true },
          health: {
            note: {
              illnesses: [{ illness: "asthma", note: "sejak SMP" }],
              otherHistory: "",
              medicine: "",
              advice: ADVICE,
            },
          },
        }}
      />,
    );

    expect(markup).toContain("Skor tes kebugaran 2026");
    expect(markup).toContain("1 Okt 2026");
    expect(markup).toContain("berdasarkan catatan kesehatan");
    expect(markup).toContain(`Riwayat: Asma (sejak SMP). ${ADVICE}`);
  });

  it("asks for a note of a student in Perlu perhatian or worse who has none", () => {
    const markup = renderToStaticMarkup(
      <StudentFitnessView
        fitness={{
          latest: { score: 50, testedOn: "2026-10-02" },
          final: { category: "medical", fromNote: false },
          health: { note: null },
        }}
      />,
    );

    expect(markup).toContain("Belum ada catatan kesehatan.");
  });

  it("says the student never took the test, with no box for a note they need not have", () => {
    const markup = renderToStaticMarkup(
      <StudentFitnessView
        fitness={{
          latest: null,
          final: { category: "untested", fromNote: false },
          health: { note: null },
        }}
      />,
    );

    expect(markup).toContain("Belum mengikuti tes kebugaran.");
    expect(markup).toContain("Belum dites");
    expect(markup).not.toContain("catatan kesehatan");
  });
});
