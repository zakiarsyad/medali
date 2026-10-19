// Sample Tahun akademik of this file: 3502 to 3502.
// Sample NIMs of this file: 9935000300 to 9935000399.
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import { academicPeriods, dormResidentChoiceChanges } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { addResident } from "./add-resident";
import { makeNonResident } from "./make-non-resident";
import { readStudentDorm } from "./student-dorm";
import { addTestActor } from "./test-records";

/*
 * Two presses at the same moment need two connections that both see the
 * saved rows. So these checks have a database of their own, dropped at
 * the end.
 */
const own = withOwnTestDatabase("residentchoice");

/** Angkatan 3502 is in semester 1 in it, angkatan 3501 in semester 3. */
const ODD_3502 = {
  startYear: 3502,
  term: "odd",
  startsOn: "3502-08-01",
  endsOn: "3503-01-31",
} as const;
const DAY = "3502-10-12";

beforeAll(async () => {
  await own.db.insert(academicPeriods).values(ODD_3502);
});

/** A Reguler woman of semester 3, who lives in no dorm by the usual rule. */
async function addSenior(nim: string): Promise<string> {
  const program = await addTestProgram(own.db, `Prodi Uji Serentak ${nim}`);
  return addTestStudent(own.db, program, {
    nim,
    name: `Uji ${nim}`,
    cohortYear: 3501,
  });
}

async function addManager(): Promise<{ id: string; roles: RoleId[] }> {
  return addTestActor(own.db, "Pengelola Uji", ["dorm_manager"]);
}

async function logLinesOf(studentId: string): Promise<number> {
  const lines = await own.db
    .select({ id: dormResidentChoiceChanges.id })
    .from(dormResidentChoiceChanges)
    .where(eq(dormResidentChoiceChanges.studentId, studentId));
  return lines.length;
}

describe("two people adding the same student at the same moment", () => {
  it("saves one, and tells the other the student already lives in a dorm", async () => {
    const id = await addSenior("9935000301");
    const one = await addManager();
    const other = await addManager();
    const note = "";

    const both = await own.atOnce(
      (db) =>
        addResident(db, one, { studentId: id, dorm: "dana_rakca", note }, DAY),
      (db) =>
        addResident(
          db,
          other,
          { studentId: id, dorm: "wismantara_putri", note },
          DAY,
        ),
    );

    expect(both.sooner.ok).toBe(true);
    expect(both.later).toEqual({
      ok: false,
      error:
        "Uji 9935000301 sudah penghuni Asrama Dana Rakca. Muat ulang halaman untuk melihat daftar terbaru.",
    });
    expect(await readStudentDorm(own.db, id, DAY)).toBe("dana_rakca");
    expect(await logLinesOf(id)).toBe(1);
  });
});

describe("two people making the same resident Non asrama at the same moment", () => {
  it("saves one, and tells the other the student is Non asrama already", async () => {
    const program = await addTestProgram(own.db, "Prodi Uji Serentak Non");
    const id = await addTestStudent(own.db, program, {
      nim: "9935000302",
      name: "Uji 9935000302",
      cohortYear: 3502,
    });
    const one = await addManager();
    const other = await addManager();

    const both = await own.atOnce(
      (db) => makeNonResident(db, one, id, DAY),
      (db) => makeNonResident(db, other, id, DAY),
    );

    expect(both.sooner).toEqual({
      ok: true,
      value: "Uji 9935000302 dijadikan non asrama.",
    });
    expect(both.later).toEqual({
      ok: false,
      error:
        "Uji 9935000302 sudah non asrama. Muat ulang halaman untuk melihat daftar terbaru.",
    });
    expect(await readStudentDorm(own.db, id, DAY)).toBeNull();
    expect(await logLinesOf(id)).toBe(1);
  });
});
