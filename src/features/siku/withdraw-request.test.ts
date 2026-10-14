// Sample Tahun akademik of this file: 2915 to 2915.
// Sample NIMs of this file: 9964001600 to 9964001699.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { sikuRequests } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  ALREADY_DECIDED,
  ASK_NOT_ALLOWED,
  REQUEST_NOT_FOUND,
  REQUEST_WITHDRAWN,
} from "./request-messages";
import { addTestRequest } from "./test-requests";
import { addTestActor, addTestStudents } from "./test-siku";
import { withdrawSikuRequest } from "./withdraw-request";

const inTestDatabase = withTestDatabase();

const AT = new Date("2915-10-15T03:00:00Z");

async function addRecords(db: Database) {
  const { studentIds } = await addTestStudents(
    db,
    "Prodi Uji Tarik Pengajuan",
    2915,
    ["9964001601", "9964001602"],
  );
  const [ani = "", budi = ""] = studentIds;
  return {
    ani,
    budi,
    student: await addTestActor(db, "Ani Uji Tarik", ["student"], {
      studentId: ani,
    }),
  };
}

async function requestById(db: Database, id: string) {
  const [request] = await db
    .select()
    .from(sikuRequests)
    .where(eq(sikuRequests.id, id));
  return request;
}

describe("withdrawSikuRequest", () => {
  it("marks a waiting request of the student withdrawn, with when, and keeps it", async () => {
    await inTestDatabase(async (db) => {
      const { ani, student } = await addRecords(db);
      const id = await addTestRequest(db, ani);

      const withdrawn = await withdrawSikuRequest(db, student, id, AT);

      expect(withdrawn).toEqual({ ok: true, value: REQUEST_WITHDRAWN });
      expect(await requestById(db, id)).toMatchObject({
        status: "withdrawn",
        withdrawnAt: AT,
      });
    });
  });

  it("refuses a request of another student, as one that does not exist, and leaves it", async () => {
    await inTestDatabase(async (db) => {
      const { budi, student } = await addRecords(db);
      const id = await addTestRequest(db, budi);

      const withdrawn = await withdrawSikuRequest(db, student, id, AT);

      expect(withdrawn).toEqual(REQUEST_NOT_FOUND);
      expect((await requestById(db, id))?.status).toBe("waiting");
    });
  });

  it("refuses a request that was decided", async () => {
    await inTestDatabase(async (db) => {
      const { ani, student } = await addRecords(db);
      const penilai = await addTestActor(db, "Penilai Uji Tarik", ["assessor"]);
      const id = await addTestRequest(db, ani, {
        more: {
          status: "rejected",
          decisionNote: "Tidak sesuai.",
          decidedBy: penilai.id,
          decidedAs: "assessor",
          decidedAt: AT,
        },
      });

      const withdrawn = await withdrawSikuRequest(db, student, id, AT);

      expect(withdrawn).toEqual(ALREADY_DECIDED);
      expect((await requestById(db, id))?.status).toBe("rejected");
    });
  });

  it("answers a request withdrawn before as one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const { ani, student } = await addRecords(db);
      const id = await addTestRequest(db, ani);
      await withdrawSikuRequest(db, student, id, AT);

      expect(await withdrawSikuRequest(db, student, id, AT)).toEqual(
        REQUEST_NOT_FOUND,
      );
    });
  });

  it("refuses a role that may not ask, and a key that is no key", async () => {
    await inTestDatabase(async (db) => {
      const { ani, student } = await addRecords(db);
      const id = await addTestRequest(db, ani);

      expect(
        await withdrawSikuRequest(
          db,
          { ...student, roles: ["assessor"] },
          id,
          AT,
        ),
      ).toEqual(ASK_NOT_ALLOWED);
      expect(await withdrawSikuRequest(db, student, "bukan", AT)).toEqual(
        REQUEST_NOT_FOUND,
      );
      expect((await requestById(db, id))?.status).toBe("waiting");
    });
  });
});
