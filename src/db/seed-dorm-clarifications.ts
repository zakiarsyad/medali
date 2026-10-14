import { PDF } from "@/files/file-kinds";
import type { Database } from "./connect";
import {
  SAMPLE_PAPER_NAME,
  samplePaperBytes,
} from "./sample-clarification-paper";
import type { SamplePeriod } from "./sample-data";
import {
  type SampleDormClarification,
  sampleDormClarifications,
} from "./sample-dorm-clarifications";
import type { KeptSampleCount } from "./sample-dorm-counts";
import { dormClarificationChanges, dormClarifications } from "./schema";
import { sampleResidents } from "./seed-dorm-counts";
import { sampleAccount } from "./seed-dorm-leaves";

/** Who checks and decides the sample clarifications. */
interface SampleStaff {
  /** BAM - BPHK, who checks them and made the sample counts. */
  bamId: string;
  /** Pengelola Asrama, who decides them. */
  managerId: string;
}

type ClarificationRow = typeof dormClarifications.$inferInsert;
type ChangeRow = typeof dormClarificationChanges.$inferInsert;

function rowOf(
  sample: SampleDormClarification,
  staff: SampleStaff,
  fileSize: number,
): ClarificationRow {
  const { verified, decided, ...parts } = sample;
  const decidedBy = decided?.by === "bam" ? staff.bamId : staff.managerId;
  return {
    ...parts,
    id: crypto.randomUUID(),
    fileName: SAMPLE_PAPER_NAME,
    fileContentType: PDF.contentType,
    fileSize,
    verifiedBy: verified ? staff.bamId : null,
    verifiedAt: verified?.at ?? null,
    verifyNote: verified?.note ?? "",
    decidedBy: decided ? decidedBy : null,
    decidedAt: decided?.at ?? null,
    decisionNote: decided?.note ?? "",
  };
}

/** The log lines of a sample: BAM's check, then the last word, when there are. */
function changesOf(
  row: ClarificationRow,
  sample: SampleDormClarification,
): ChangeRow[] {
  const clarificationId = row.id;
  if (!clarificationId) throw new Error("A sample clarification has no key.");
  const changes: ChangeRow[] = [];
  const { verified, decided, status } = sample;
  if (verified && row.verifiedBy) {
    changes.push({
      clarificationId,
      changedBy: row.verifiedBy,
      changedAt: verified.at,
      statusBefore: "submitted",
      statusAfter: decided ? "verified" : status,
      note: verified.note,
    });
  }
  if (decided && row.decidedBy) {
    changes.push({
      clarificationId,
      changedBy: row.decidedBy,
      changedAt: decided.at,
      statusBefore: verified ? "verified" : "submitted",
      statusAfter: status,
      acceptedAs: sample.acceptedAs,
      note: decided.note,
    });
  }
  return changes;
}

/**
 * Adds the sample clarifications of the sample counts, in every status,
 * with the log of their checks and decisions: checked by the sample BAM -
 * BPHK and decided by the sample Pengelola Asrama. Each names the drawn
 * sample paper as its file, which the sample photos command keeps. The
 * residents are those of the running sample period.
 */
export async function addSampleDormClarifications(
  db: Database,
  counts: KeptSampleCount[],
  period: SamplePeriod,
  now: Date = new Date(),
): Promise<void> {
  const residents = await sampleResidents(db, period);
  const staff = {
    bamId: await sampleAccount(db, "bam_bphk"),
    managerId: await sampleAccount(db, "dorm_manager"),
  };
  const fileSize = samplePaperBytes().length;
  const samples = sampleDormClarifications(counts, residents, now);
  if (samples.length === 0) return;
  const rows = samples.map((sample) => rowOf(sample, staff, fileSize));
  const changes = rows.flatMap((row, place) => {
    const sample = samples[place];
    return sample ? changesOf(row, sample) : [];
  });
  await db.insert(dormClarifications).values(rows);
  if (changes.length > 0) {
    await db.insert(dormClarificationChanges).values(changes);
  }
}
