import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { studentBatches, studentBatchFiles } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { type MemoryStore, memoryStore } from "@/files/memory-store";
import { openStudentFile, studentFileRefusal } from "./open-student-file";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));
const CONTENT = new TextEncoder().encode("nim,nama\r\n9900001101,Uji Élan\r\n");
const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

/** A made-up kept file with its batch; gives the id of the file. */
async function addKeptFile(db: Database, store: MemoryStore): Promise<string> {
  const keeper = await addTestActor(db, "Pegawai Uji Berkas", ["upk_staff"]);
  const [batch] = await db
    .insert(studentBatches)
    .values({ inputAt: new Date(), inputBy: keeper.id })
    .returning({ id: studentBatches.id });
  if (!batch) throw new Error("The batch was not added.");
  const objectKey = "uji/berkas-1";
  await store.put(objectKey, { bytes: CONTENT, contentType: "text/csv" });
  const [file] = await db
    .insert(studentBatchFiles)
    .values({
      batchId: batch.id,
      objectKey,
      fileName: "mahasiswa uji.csv",
      byteSize: CONTENT.length,
      contentType: "text/csv; charset=utf-8",
      keptAt: new Date(),
      keptBy: keeper.id,
    })
    .returning({ id: studentBatchFiles.id });
  if (!file) throw new Error("The file was not added.");
  return file.id;
}

describe("studentFileRefusal", () => {
  it.each(ALLOWED)("lets %s open a kept file", (role) => {
    expect(studentFileRefusal({ id: "a", roles: [role] })).toBeNull();
  });

  it.each(OTHERS)("refuses %s", (role) => {
    expect(studentFileRefusal({ id: "a", roles: [role] })).toBe("not-allowed");
  });

  it("refuses Pengasuh and Direktur, who do not put students in", () => {
    expect(OTHERS).toContain("mentor");
    expect(OTHERS).toContain("director");
  });

  it("refuses an account with no roles", () => {
    expect(studentFileRefusal({ id: "a", roles: [] })).toBe("not-allowed");
  });

  it("refuses a visitor who is not signed in", () => {
    expect(studentFileRefusal(null)).toBe("not-signed-in");
  });

  it("lets an account with two roles open it when one of them may", () => {
    const actor = { id: "a", roles: ["mentor", "upk_staff"] as const };

    expect(studentFileRefusal(actor)).toBeNull();
  });
});

describe("openStudentFile", () => {
  it.each(ALLOWED)(
    "gives %s the file as it was kept, with its name",
    async (role) => {
      await inTestDatabase(async (db) => {
        const store = memoryStore();
        const id = await addKeptFile(db, store);
        const actor = await addTestActor(db, "Pembuka Uji", [role]);

        const opened = await openStudentFile(db, store, actor, id);

        expect(opened).toEqual({
          ok: true,
          file: {
            name: "mahasiswa uji.csv",
            contentType: "text/csv; charset=utf-8",
            bytes: CONTENT,
          },
        });
      });
    },
  );

  it.each(OTHERS)(
    "refuses %s, even with the exact id of a kept file",
    async (role) => {
      await inTestDatabase(async (db) => {
        const store = memoryStore();
        const id = await addKeptFile(db, store);
        const actor = await addTestActor(db, "Peminta Uji", [role]);

        const opened = await openStudentFile(db, store, actor, id);

        expect(opened).toEqual({ ok: false, refusal: "not-allowed" });
      });
    },
  );

  it("refuses a visitor who is not signed in, even with the exact id", async () => {
    await inTestDatabase(async (db) => {
      const store = memoryStore();
      const id = await addKeptFile(db, store);

      const opened = await openStudentFile(db, store, null, id);

      expect(opened).toEqual({ ok: false, refusal: "not-signed-in" });
    });
  });

  it("gives a role without the right the same answer for a file that exists and one that does not", async () => {
    await inTestDatabase(async (db) => {
      const store = memoryStore();
      const id = await addKeptFile(db, store);
      const actor = await addTestActor(db, "Pengasuh Uji", ["mentor"]);

      const existing = await openStudentFile(db, store, actor, id);
      const missing = await openStudentFile(db, store, actor, UNKNOWN_ID);
      const malformed = await openStudentFile(db, store, actor, "x");

      expect(missing).toEqual(existing);
      expect(malformed).toEqual(existing);
    });
  });

  it.each([
    ["an id no file has", UNKNOWN_ID],
    ["a text that is not an id", "bukan-id"],
    ["an attempt to reach another address", "../../etc/passwd"],
    ["an empty id", ""],
  ])("finds nothing for %s", async (_what, id) => {
    await inTestDatabase(async (db) => {
      const store = memoryStore();
      await addKeptFile(db, store);
      const actor = await addTestActor(db, "Pembuka Uji", ["head_of_unit"]);

      const opened = await openStudentFile(db, store, actor, id);

      expect(opened).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("finds nothing when the record is there but the file storage no longer holds the file", async () => {
    await inTestDatabase(async (db) => {
      const store = memoryStore();
      const id = await addKeptFile(db, store);
      store.files.clear();
      const actor = await addTestActor(db, "Pembuka Uji", ["head_of_unit"]);

      const opened = await openStudentFile(db, store, actor, id);

      expect(opened).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("refuses a kept file without its batch: the database holds them together", async () => {
    await inTestDatabase(async (db) => {
      const keeper = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const orphan = db.transaction((tx) =>
        tx.insert(studentBatchFiles).values({
          batchId: UNKNOWN_ID,
          objectKey: "uji/tanpa-batch",
          fileName: "uji.csv",
          byteSize: 1,
          contentType: "text/csv",
          keptAt: new Date(),
          keptBy: keeper.id,
        }),
      );

      await expect(orphan).rejects.toThrow();
      expect(await db.$count(studentBatchFiles)).toBe(0);
    });
  });
});
