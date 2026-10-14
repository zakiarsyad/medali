// Sample Tahun akademik of this file: 2907 to 2907.
// Sample NIMs of this file: 9964000800 to 9964000899.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readOwnSiku } from "./own-siku";
import {
  addTestActor,
  addTestEntry,
  addTestStudents,
  addTestYear,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

const STAFF_NAME = "Penilai Uji Milik Sendiri";

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2907);
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji SIKU Sendiri",
    2907,
    ["9964000801", "9964000802"],
  );
  const [ani, budi] = studentIds;
  if (!ani || !budi) throw new Error("Students missing.");
  const penilai = await addTestActor(db, STAFF_NAME, ["assessor"]);
  const entry = { periodId: periods.odd };
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "gain",
    reason: "peer_mentoring",
    points: 4,
    day: "2907-10-10",
    studentIds: [ani, budi],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "discipline_penalty",
    points: 3,
    day: "2908-03-02",
    periodId: periods.even,
    studentIds: [ani],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "student_violation",
    points: 9,
    day: "2907-10-12",
    studentIds: [budi],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "gain",
    reason: "knowledge_sharing",
    points: 2,
    day: "2907-10-13",
    studentIds: [ani],
    cancelled: true,
  });
  return { ani, budi };
}

describe("readOwnSiku", () => {
  it("shows a student their own gains and losses of every period, the latest first, and nobody else's", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const answer = await readOwnSiku(db, {
        roles: ["student"],
        studentId: ani,
      });

      if (answer.kind !== "shown") throw new Error("The SIKU was refused.");
      expect(answer.siku.totals).toEqual({ gains: 4, losses: 3 });
      expect(
        answer.siku.entries.map((entry) => [entry.day, entry.reason]),
      ).toEqual([
        ["2908-03-02", "discipline_penalty"],
        ["2907-10-10", "peer_mentoring"],
      ]);
    });
  });

  it("names the role that entered each one, never the staff member", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const answer = await readOwnSiku(db, {
        roles: ["student"],
        studentId: ani,
      });

      if (answer.kind !== "shown") throw new Error("The SIKU was refused.");
      for (const entry of answer.siku.entries) {
        expect(entry.enteredAs).toBe("assessor");
      }
      expect(JSON.stringify(answer)).not.toContain(STAFF_NAME);
    });
  });

  it.each<RoleId>(["mentor", "assessor", "head_of_unit"])(
    "refuses %s, who has no SIKU of their own",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { ani } = await addRecords(db);

        expect(
          await readOwnSiku(db, { roles: [role], studentId: ani }),
        ).toEqual({ kind: "refused" });
      });
    },
  );

  it("refuses a student account with no student", async () => {
    await inTestDatabase(async (db) => {
      expect(
        await readOwnSiku(db, { roles: ["student"], studentId: null }),
      ).toEqual({ kind: "refused" });
    });
  });
});
