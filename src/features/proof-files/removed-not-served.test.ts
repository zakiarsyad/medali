// Sample Tahun akademik of this file: 3402 to 3402.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { openAttendancePhoto } from "@/features/activities/open-attendance-photo";
import { openClarificationFile } from "@/features/activities/open-clarification-file";
import { addTestPeriods } from "@/features/activities/test-records";
import { openAppealProof } from "@/features/dorm/open-appeal-proof";
import { openDormClarificationFile } from "@/features/dorm/open-clarification-file";
import { openReturnPhoto } from "@/features/dorm/open-return-photo";
import { openRequestPhoto } from "@/features/siku/open-request-photo";
import type { FileStore } from "@/files/file-store";
import { memoryStore } from "@/files/memory-store";
import { PROOF_KINDS, type ProofKind } from "./proof-kinds";
import { PROOF_SOURCES } from "./proof-sources";
import { addProofSetting, addTestProofs } from "./test-proofs";
import { addTestActor } from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 3402, the program
 * UJIBERKASTUTUP and the NIMs 9989520000 to 9989520099.
 */

const inTestDatabase = withTestDatabase();

const SENT_AT = new Date("3402-09-10T03:00:00Z");

/** Every student's rows, as the page of a staff role that sees all would give. */
const EVERYONE = sql`true`;

/** An account as every kind of download takes it. */
type Opening = AccountForAccess & { roles: RoleId[] };

type Opener = (
  db: Database,
  store: FileStore,
  account: Opening,
  id: string,
) => Promise<{ ok: boolean }>;

/** How the download address of each kind opens its file. */
const OPENERS: Record<ProofKind, Opener> = {
  attendance_photo: openAttendancePhoto,
  siku_photo: (db, store, account, id) =>
    openRequestPhoto(db, store, account, isStaff(account), id, false),
  return_photo: (db, store, account, id) =>
    openReturnPhoto(db, store, account, isStaff(account), id),
  activity_clarification: openClarificationFile,
  dorm_clarification: openDormClarificationFile,
  appeal_proof: openAppealProof,
};

function isStaff(account: Opening) {
  return account.studentId === null ? EVERYONE : null;
}

/** Marks the file of a record as removed, while the file is still kept. */
async function mark(db: Database, kind: ProofKind, id: string): Promise<void> {
  const source = PROOF_SOURCES[kind];
  await db
    .update(source.table)
    .set({ fileRemovedAt: new Date() })
    .where(eq(source.id, id));
}

describe("a file marked as removed", () => {
  it.each(PROOF_KINDS)(
    "is not found by its old link, for its student and for staff: %s",
    async (kind) => {
      await inTestDatabase(async (db) => {
        const { oddId } = await addTestPeriods(db, 3402);
        const setting = await addProofSetting(
          db,
          oddId,
          "UJIBERKASTUTUP",
          "9989520001",
        );
        const store = memoryStore();
        const proofs = await addTestProofs(db, setting, SENT_AT, true, store);
        const staff = await addTestActor(db, "Staf Uji Tutup", [
          "upk_staff",
          "assessor",
          "bam_bphk",
        ]);
        const accounts: Opening[] = [
          setting.student,
          { ...staff, studyProgramId: null, studentId: null },
        ];
        const open = OPENERS[kind];
        const { id } = proofs[kind];
        for (const account of accounts) {
          expect((await open(db, store, account, id)).ok).toBe(true);
        }

        await mark(db, kind, id);

        for (const account of accounts) {
          expect(await open(db, store, account, id)).toEqual({
            ok: false,
            refusal: "not-found",
          });
        }
      });
    },
  );
});
