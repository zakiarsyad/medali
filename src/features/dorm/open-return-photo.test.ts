// Sample Tahun akademik of this file: 2950 to 2950.
// Sample NIMs of this file: 9937940000 to 9937940099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { memoryStore, unreachableStore } from "@/files/memory-store";
import { openReturnPhoto } from "./open-return-photo";
import { addTestResidents } from "./test-leave";
import { addTestActor } from "./test-records";
import { addApprovedLeave, addTestReport } from "./test-returns";

const inTestDatabase = withTestDatabase();

const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

function accountOf(
  id: string,
  roles: AccountForAccess["roles"],
  more: Partial<AccountForAccess> = {},
): AccountForAccess {
  return { id, roles, studyProgramId: null, studentId: null, ...more };
}

/** What the address of a photo passes on for an account that sees dorm leave. */
function seenBy(account: AccountForAccess) {
  return visibleTo(rowLimitForAction(account, "view_dorm_leave"));
}

async function addRecords(db: Database) {
  const [ani, bea] = await addTestResidents(db, 2950, "Prodi Uji Foto Lapor", [
    "9937940001",
    "9937940002",
  ]);
  if (!ani || !bea) throw new Error("The residents were not added.");
  const manager = await addTestActor(db, "Pengelola Uji Foto Lapor", [
    "dorm_manager",
  ]);
  const leaveId = await addApprovedLeave(db, ani.studentId, manager.id, {
    startsAt: "2950-10-13T09:00",
    endsAt: "2950-10-13T16:00",
  });
  const reportId = await addTestReport(db, leaveId, "2950-10-13T15:50");
  const store = memoryStore();
  await store.put(`return-photos/${reportId}`, {
    bytes: PHOTO,
    contentType: "image/jpeg",
  });
  const otherProgram = await addTestProgram(db, "UJIFOTOLAIN");
  // A student of another program, so its head sees none of Ani's leave.
  await addTestStudent(db, otherProgram, {
    nim: "9937940003",
    name: "Mahasiswa Uji Prodi Lain",
  });
  const [own] = await db
    .select({ studyProgramId: students.studyProgramId })
    .from(students)
    .where(eq(students.id, ani.studentId));
  if (!own) throw new Error("The student was not read.");
  return {
    ani: accountOf(ani.studentId, ["student"], { studentId: ani.studentId }),
    bea: accountOf(bea.studentId, ["student"], { studentId: bea.studentId }),
    manager: accountOf(manager.id, ["dorm_manager"]),
    ownHead: accountOf("kp-own", ["head_of_program"], {
      studyProgramId: own.studyProgramId,
    }),
    otherHead: accountOf("kp-other", ["head_of_program"], {
      studyProgramId: otherProgram,
    }),
    mentor: accountOf("mentor", ["mentor"]),
    reportId,
    store,
  };
}

describe("openReturnPhoto", () => {
  it("gives the photo to the resident who sent it, and to staff who see that leave", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { reportId, store } = records;

      const own = await openReturnPhoto(db, store, records.ani, null, reportId);
      const staff = await openReturnPhoto(
        db,
        store,
        records.manager,
        seenBy(records.manager),
        reportId,
      );
      const head = await openReturnPhoto(
        db,
        store,
        records.ownHead,
        seenBy(records.ownHead),
        reportId,
      );

      for (const opened of [own, staff, head]) {
        expect(opened).toEqual({
          ok: true,
          file: {
            name: "foto-lapor-kembali.jpg",
            contentType: "image/jpeg",
            bytes: PHOTO,
          },
        });
      }
    });
  });

  it("answers another resident and Ketua Program Studi of another program as if there were no photo", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { reportId, store } = records;

      const other = await openReturnPhoto(
        db,
        store,
        records.bea,
        null,
        reportId,
      );
      const head = await openReturnPhoto(
        db,
        store,
        records.otherHead,
        seenBy(records.otherHead),
        reportId,
      );

      expect(other).toEqual({ ok: false, refusal: "not-found" });
      expect(head).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("refuses a role that sees no dorm leave, and a visitor who is not signed in", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { reportId, store } = records;

      expect(
        await openReturnPhoto(db, store, records.mentor, null, reportId),
      ).toEqual({ ok: false, refusal: "not-allowed" });
      expect(await openReturnPhoto(db, store, null, null, reportId)).toEqual({
        ok: false,
        refusal: "not-signed-in",
      });
    });
  });

  it("says so when the storage cannot be reached, or keeps no files", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      const { reportId } = records;

      expect(
        await openReturnPhoto(
          db,
          unreachableStore(),
          records.ani,
          null,
          reportId,
        ),
      ).toEqual({ ok: false, refusal: "unreachable" });
      expect(
        await openReturnPhoto(db, null, records.ani, null, reportId),
      ).toEqual({ ok: false, refusal: "not-found" });
    });
  });
});
