// Sample Tahun akademik of this file: 2916 to 2916.
// Sample NIMs of this file: 9964001700 to 9964001799.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { sikuRequests } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { memoryStore, unreachableStore } from "@/files/memory-store";
import { openRequestPhoto } from "./open-request-photo";
import { addTestRequest, photosOf } from "./test-requests";
import { addTestActor, addTestGroup, addTestStudents } from "./test-siku";

const inTestDatabase = withTestDatabase();

const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const THUMB = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9]);

/** What the address of a photo passes on for an account that reads SIKU. */
function seenBy(account: AccountForAccess) {
  return visibleTo(rowLimitForAction(account, "view_siku"));
}

async function addRecords(db: Database) {
  const own = await addTestStudents(db, "Prodi Uji Foto Bukti", 2916, [
    "9964001701",
    "9964001702",
  ]);
  const other = await addTestStudents(db, "Prodi Uji Foto Bukti Lain", 2916, [
    "9964001703",
  ]);
  const [ani = "", budi = ""] = own.studentIds;
  const mentor = await addTestActor(db, "Pengasuh Uji Foto", ["mentor"]);
  const otherMentor = await addTestActor(db, "Pengasuh Uji Foto Lain", [
    "mentor",
  ]);
  await addTestGroup(
    db,
    { programId: own.programId, year: 2916, number: 1 },
    mentor.id,
    [ani],
  );
  await addTestGroup(
    db,
    { programId: other.programId, year: 2916, number: 1 },
    otherMentor.id,
    other.studentIds,
  );
  const requestId = await addTestRequest(db, ani, {
    photoKeys: ["siku-request-photos/besar"],
  });
  const [photo] = await photosOf(db, requestId);
  if (!photo) throw new Error("The photo was not added.");
  const store = memoryStore();
  await store.put("siku-request-photos/besar", {
    bytes: PHOTO,
    contentType: "image/jpeg",
  });
  await store.put("siku-request-photos/besar-kecil", {
    bytes: THUMB,
    contentType: "image/jpeg",
  });
  return {
    ani: await addTestActor(db, "Ani Uji Foto", ["student"], {
      studentId: ani,
    }),
    budi: await addTestActor(db, "Budi Uji Foto", ["student"], {
      studentId: budi,
    }),
    mentor,
    otherMentor,
    ownHead: await addTestActor(db, "KP Uji Foto", ["head_of_program"], {
      studyProgramId: own.programId,
    }),
    otherHead: await addTestActor(db, "KP Uji Foto Lain", ["head_of_program"], {
      studyProgramId: other.programId,
    }),
    director: await addTestActor(db, "Direktur Uji Foto", ["director"]),
    counsellor: await addTestActor(db, "Konselor Uji Foto", ["counsellor"]),
    requestId,
    photoId: photo.id,
    store,
  };
}

describe("openRequestPhoto", () => {
  it("gives the student who sent it the photo, and its small copy when asked", async () => {
    await inTestDatabase(async (db) => {
      const r = await addRecords(db);

      const large = await openRequestPhoto(
        db,
        r.store,
        r.ani,
        null,
        r.photoId,
        false,
      );
      const small = await openRequestPhoto(
        db,
        r.store,
        r.ani,
        null,
        r.photoId,
        true,
      );

      expect(large).toEqual({
        ok: true,
        file: {
          name: "foto-bukti-siku.jpg",
          contentType: "image/jpeg",
          bytes: PHOTO,
        },
      });
      expect(small.ok && small.file.bytes).toEqual(THUMB);
    });
  });

  it.each(["director", "ownHead", "mentor"] as const)(
    "gives it to %s, who reads that student's SIKU",
    async (who) => {
      await inTestDatabase(async (db) => {
        const r = await addRecords(db);
        const account = r[who];

        const opened = await openRequestPhoto(
          db,
          r.store,
          account,
          seenBy(account),
          r.photoId,
          false,
        );

        expect(opened.ok).toBe(true);
      });
    },
  );

  it.each(["otherHead", "otherMentor"] as const)(
    "answers %s, who does not see that student, as if there were no photo",
    async (who) => {
      await inTestDatabase(async (db) => {
        const r = await addRecords(db);
        const account = r[who];

        const opened = await openRequestPhoto(
          db,
          r.store,
          account,
          seenBy(account),
          r.photoId,
          false,
        );

        expect(opened).toEqual({ ok: false, refusal: "not-found" });
      });
    },
  );

  it("answers another student as if there were no photo", async () => {
    await inTestDatabase(async (db) => {
      const r = await addRecords(db);

      const opened = await openRequestPhoto(
        db,
        r.store,
        r.budi,
        null,
        r.photoId,
        false,
      );

      expect(opened).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("refuses a role that neither reads SIKU nor asks, and a visitor not signed in", async () => {
    await inTestDatabase(async (db) => {
      const r = await addRecords(db);

      expect(
        await openRequestPhoto(
          db,
          r.store,
          r.counsellor,
          null,
          r.photoId,
          false,
        ),
      ).toEqual({ ok: false, refusal: "not-allowed" });
      expect(
        await openRequestPhoto(db, r.store, null, null, r.photoId, false),
      ).toEqual({ ok: false, refusal: "not-signed-in" });
    });
  });

  it("opens the photos of a withdrawn request for nobody, not even its student", async () => {
    await inTestDatabase(async (db) => {
      const r = await addRecords(db);
      await db
        .update(sikuRequests)
        .set({ status: "withdrawn", withdrawnAt: new Date() })
        .where(eq(sikuRequests.id, r.requestId));

      const own = await openRequestPhoto(
        db,
        r.store,
        r.ani,
        null,
        r.photoId,
        false,
      );
      const director = await openRequestPhoto(
        db,
        r.store,
        r.director,
        seenBy(r.director),
        r.photoId,
        false,
      );

      expect(own).toEqual({ ok: false, refusal: "not-found" });
      expect(director).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("answers as not found where file keeping is off, for a key that is no key, and for a photo not kept", async () => {
    await inTestDatabase(async (db) => {
      const r = await addRecords(db);

      expect(
        await openRequestPhoto(db, null, r.ani, null, r.photoId, false),
      ).toEqual({ ok: false, refusal: "not-found" });
      expect(
        await openRequestPhoto(db, r.store, r.ani, null, "bukan", false),
      ).toEqual({ ok: false, refusal: "not-found" });
      expect(
        await openRequestPhoto(
          db,
          memoryStore(),
          r.ani,
          null,
          r.photoId,
          false,
        ),
      ).toEqual({ ok: false, refusal: "not-found" });
    });
  });

  it("says to try again when the file storage cannot be reached", async () => {
    await inTestDatabase(async (db) => {
      const r = await addRecords(db);

      const opened = await openRequestPhoto(
        db,
        unreachableStore(),
        r.ani,
        null,
        r.photoId,
        false,
      );

      expect(opened).toEqual({ ok: false, refusal: "unreachable" });
    });
  });
});
