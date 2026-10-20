// Sample NIMs of this file: 9988600200 to 9988600299.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentalHealthScreeningLog } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { openScreeningDetail } from "./screening-detail";
import { ADVICE_WORDS, CRISIS_ADVICE } from "./screening-words";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestScreening } from "./test-screenings";

const inTestDatabase = withTestDatabase();

async function addTwice(db: Database) {
  const people = await addTestPeople(db, "Prodi Uji Rincian Asesmen", [
    "9988600201",
  ]);
  const [studentId = ""] = people.studentIds;
  const by = people.counsellor.id;
  await addTestScreening(db, studentId, by, {
    screenedOn: "2026-10-01",
    note: "Cemas menjelang ujian.",
  });
  await addTestScreening(db, studentId, by, {
    screenedOn: "2026-10-10",
    instrument: "srq20",
    depression: null,
    anxiety: null,
    stress: null,
    srqYes: 4,
    selfHarm: true,
    level: "extremely_severe",
    note: "Didampingi tim krisis.",
  });
  const [account] = people.students;
  if (!account) throw new Error("The student's account was not added.");
  return { counsellor: people.counsellor, studentId, account };
}

async function logOf(db: Database, studentId: string) {
  return db
    .select()
    .from(mentalHealthScreeningLog)
    .where(eq(mentalHealthScreeningLog.studentId, studentId));
}

describe("Rincian of a screened student", () => {
  it("shows every screening, the newest first, with its scores, advice and note", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addTwice(db);
      const items = await openScreeningDetail(db, counsellor, studentId);
      expect(items).toEqual([
        expect.objectContaining({
          screenedOn: "2026-10-10",
          instrument: "srq20",
          srqYes: 4,
          scales: [],
          level: "extremely_severe",
          advice: CRISIS_ADVICE,
          risk: true,
          note: "Didampingi tim krisis.",
        }),
        expect.objectContaining({
          screenedOn: "2026-10-01",
          instrument: "dass21",
          scales: [
            { scale: "depression", score: 12, level: "mild" },
            { scale: "anxiety", score: 6, level: "normal" },
            { scale: "stress", score: 16, level: "mild" },
          ],
          level: "mild",
          advice: ADVICE_WORDS.mild,
          risk: false,
          note: "Cemas menjelang ujian.",
        }),
      ]);
    });
  });

  it("logs each opening with who and when, and nothing of the screenings", async () => {
    await inTestDatabase(async (db) => {
      const { counsellor, studentId } = await addTwice(db);
      const at = new Date("2026-10-16T03:00:00Z");
      await openScreeningDetail(db, counsellor, studentId, at);
      await openScreeningDetail(db, counsellor, studentId, at);
      const lines = await logOf(db, studentId);
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        expect(line).toEqual({
          id: expect.any(String),
          studentId,
          event: "opened",
          by: counsellor.id,
          at,
        });
      }
    });
  });

  it("gives nothing and logs nothing for a student with no screening or a wrong id", async () => {
    await inTestDatabase(async (db) => {
      const people = await addTestPeople(db, "Prodi Uji Rincian Kosong", [
        "9988600202",
      ]);
      const [studentId = ""] = people.studentIds;
      expect(
        await openScreeningDetail(db, people.counsellor, studentId),
      ).toBeNull();
      expect(
        await openScreeningDetail(db, people.counsellor, "bukan-id"),
      ).toBeNull();
      expect(await logOf(db, studentId)).toEqual([]);
    });
  });

  it.each<RoleId>([
    "head_of_unit",
    "director",
    "head_of_program",
    "mentor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_health",
    "discipline_officer",
    "student",
  ])("is refused to %s, with nothing sent or logged", async (role) => {
    await inTestDatabase(async (db) => {
      const { studentId } = await addTwice(db);
      const other = await addTestActor(db, "Bukan Konselor", [role]);
      expect(await openScreeningDetail(db, other, studentId)).toBeNull();
      expect(await logOf(db, studentId)).toEqual([]);
    });
  });

  it("is refused to a Konselor for their own student record", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, account } = await addTwice(db);
      const own = { ...account, roles: ["counsellor", "student"] as RoleId[] };
      expect(await openScreeningDetail(db, own, studentId)).toBeNull();
    });
  });
});
