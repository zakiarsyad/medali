// Sample NIMs of this file: 9911610000 to 9911610099.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestNote } from "@/health-notes/test-health";
import { readOwnFitness } from "./student-fitness";
import { StudentFitnessView } from "./student-fitness-view";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

const ADVICE = "Hindari lari jarak jauh sampai kontrol berikutnya.";

const READERS_LINE =
  "Catatan kesehatan Anda juga dapat dibaca pengasuh Anda dan petugas yang berwenang, untuk keselamatan dalam kegiatan.";

/**
 * Ani scored 85 (Baik) and has a note by BAM - Kesehatan that puts her in
 * Perlu perhatian; Budi scored 50 and has a note of his own; Dewi was
 * never tested and has no note. Each has their own Mahasiswa account.
 */
async function addRecords(db: Database) {
  const kepala = await addTestActor(db, "Kepala Uji Jasmani Sendiri", [
    "head_of_unit",
  ]);
  const bam = await addTestActor(db, "BAM Kesehatan Uji Jasmani Sendiri", [
    "bam_health",
  ]);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Jasmani Sendiri",
    ["9911610001", "9911610002", "9911610003"],
  );
  const [ani = "", budi = "", dewi = ""] = studentIds;
  const group = await addTestGroup(db, programId, [ani, budi]);
  await addTestScores(db, kepala, {
    groupId: group,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [
      { studentId: ani, score: 85 },
      { studentId: budi, score: 50 },
    ],
  });
  await addTestNote(db, bam, {
    studentId: ani,
    savedAt: new Date("2026-10-05T03:00:00Z"),
    illnesses: [{ illness: "asthma", note: "kambuh saat lelah" }],
    advice: ADVICE,
    category: "attention",
  });
  await addTestNote(db, kepala, {
    studentId: budi,
    savedAt: new Date("2026-10-06T03:00:00Z"),
    advice: "Catatan Budi yang bukan milik Ani.",
  });
  const own = (name: string, studentId: string, roles: RoleId[]) =>
    addTestActor(db, name, roles, { studentId });
  return { ani, budi, dewi, kepala, bam, own };
}

describe("readOwnFitness", () => {
  it("gives a student their own score, day, final category with its mark, and the note BAM - Kesehatan wrote", async () => {
    await inTestDatabase(async (db) => {
      const { ani, own } = await addRecords(db);
      const account = await own("Ani Uji Jasmani Sendiri", ani, ["student"]);

      const shown = await readOwnFitness(db, account);

      expect(shown).toEqual({
        latest: { score: 85, testedOn: "2026-10-01" },
        final: { category: "attention", fromNote: true },
        health: {
          note: expect.objectContaining({
            illnesses: [{ illness: "asthma", note: "kambuh saat lelah" }],
            advice: ADVICE,
          }),
        },
      });
      expect(JSON.stringify(shown)).not.toContain("Budi");
    });
  });

  it("says a student who was never tested has no test and no note", async () => {
    await inTestDatabase(async (db) => {
      const { dewi, own } = await addRecords(db);
      const account = await own("Dewi Uji Jasmani Sendiri", dewi, ["student"]);

      expect(await readOwnFitness(db, account)).toEqual({
        latest: null,
        final: { category: "untested", fromNote: false },
        health: { note: null },
      });
    });
  });

  it("keeps a student who also holds a wide role to their own record", async () => {
    await inTestDatabase(async (db) => {
      const { ani, own } = await addRecords(db);
      const account = await own("Ani Uji Jasmani Sendiri Kepala", ani, [
        "student",
        "head_of_unit",
      ]);

      const shown = await readOwnFitness(db, account);

      expect(shown?.latest?.score).toBe(85);
      expect(JSON.stringify(shown)).not.toContain("Budi");
    });
  });

  it.each([
    ["head_of_unit", "Kepala Unit"],
    ["counsellor", "Konselor"],
    ["bam_health", "BAM - Kesehatan"],
    ["mentor", "Pengasuh"],
  ] as const)(
    "refuses %s, even with an account that names a student",
    async (role, name) => {
      await inTestDatabase(async (db) => {
        const { ani, own } = await addRecords(db);
        const account = await own(`${name} Uji Jasmani Sendiri`, ani, [role]);

        expect(await readOwnFitness(db, account)).toBeNull();
      });
    },
  );

  it("refuses a Mahasiswa account with no student", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);
      const account = await addTestActor(db, "Tanpa Mahasiswa Uji", [
        "student",
      ]);

      expect(await readOwnFitness(db, account)).toBeNull();
    });
  });
});

describe("StudentFitnessView on Profil saya", () => {
  it("shows the note with the line that says who else reads it", async () => {
    await inTestDatabase(async (db) => {
      const { ani, own } = await addRecords(db);
      const account = await own("Ani Uji Jasmani Sendiri", ani, ["student"]);
      const shown = await readOwnFitness(db, account);
      if (shown === null) throw new Error("Nothing shown.");

      const markup = renderToStaticMarkup(
        <StudentFitnessView fitness={shown} isOwn />,
      );

      expect(markup).toContain("Kesehatan jasmani");
      expect(markup).toContain("Perlu perhatian");
      expect(markup).toContain("berdasarkan catatan kesehatan");
      expect(markup).toContain("Skor tes kebugaran 2026");
      expect(markup).toContain("Tanggal tes");
      expect(markup).toContain("Catatan kesehatan");
      expect(markup).toContain(ADVICE);
      expect(markup).toContain(READERS_LINE);
    });
  });

  it("says the student never took the test, with no line on who reads a note", () => {
    const markup = renderToStaticMarkup(
      <StudentFitnessView
        fitness={{
          latest: null,
          final: { category: "untested", fromNote: false },
          health: { note: null },
        }}
        isOwn
      />,
    );

    expect(markup).toContain("Belum mengikuti tes kebugaran.");
    expect(markup).not.toContain(READERS_LINE);
  });

  it("gives staff the note without the line meant for the student", () => {
    const markup = renderToStaticMarkup(
      <StudentFitnessView
        fitness={{
          latest: { score: 85, testedOn: "2026-10-01" },
          final: { category: "attention", fromNote: true },
          health: {
            note: {
              illnesses: [],
              otherHistory: "",
              medicine: "",
              advice: ADVICE,
            },
          },
        }}
      />,
    );

    expect(markup).toContain(ADVICE);
    expect(markup).not.toContain(READERS_LINE);
  });
});
