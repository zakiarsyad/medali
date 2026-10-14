import type { Database } from "./connect";
import {
  type SampleSikuEntry,
  sampleEntryDay,
} from "./sample-siku-adjustments";
import {
  SAMPLE_SIKU_REQUESTS,
  type SampleRequestDecision,
  type SampleSikuRequest,
} from "./sample-siku-requests";
import { sikuRequestPhotos, sikuRequests } from "./schema";
import { studentIdsByNim } from "./seed-mentor-groups";
import { momentOf, sampleAccountOf } from "./seed-siku-adjustments";

type NewRequest = typeof sikuRequests.$inferInsert;

/** Seven in the morning on campus of a day: before any decision that day. */
function sentMomentOf(day: string, now: Date): Date {
  const morning = new Date(`${day}T07:00:00+07:00`);
  return morning < now ? morning : now;
}

function entryIdOf(
  entryIds: Map<SampleSikuEntry, string>,
  gain: SampleSikuEntry,
) {
  const id = entryIds.get(gain);
  if (id === undefined) {
    throw new Error("A sample request names a gain that was not added.");
  }
  return id;
}

/** What a decision keeps on the request, beside what every request keeps. */
function decided(
  decision: SampleRequestDecision,
  context: {
    today: string;
    now: Date;
    assessorId: string;
    entryIds: Map<SampleSikuEntry, string>;
  },
): Partial<NewRequest> {
  const { today, now, assessorId, entryIds } = context;
  if (decision.kind === "waiting") return { status: "waiting" };
  if (decision.kind === "withdrawn") {
    const day = sampleEntryDay(today, decision.daysAgo);
    return { status: "withdrawn", withdrawnAt: momentOf(day, now) };
  }
  const byAssessor = { decidedBy: assessorId, decidedAs: "assessor" } as const;
  if (decision.kind === "rejected") {
    const day = sampleEntryDay(today, decision.daysAgo);
    return {
      ...byAssessor,
      status: "rejected",
      decidedAt: momentOf(day, now),
      decisionNote: decision.note,
    };
  }
  const day = sampleEntryDay(today, decision.gain.daysAgo);
  return {
    ...byAssessor,
    status: "approved",
    decidedAt: momentOf(day, now),
    decisionNote: decision.note,
    entryId: entryIdOf(entryIds, decision.gain),
  };
}

function studentIdOf(ids: Map<string, string>, sample: SampleSikuRequest) {
  const id = ids.get(sample.nim);
  if (id === undefined) {
    throw new Error(`A sample request names the missing NIM ${sample.nim}.`);
  }
  return id;
}

/**
 * Adds the sample requests for a SIKU gain, each with its photos, whose
 * pictures the sample photos command keeps later. Decisions are those of
 * the sample Penilai Mahasiswa. An approved one names the sample gain it
 * made, whose key `entryIds` gives. `today` is today on campus.
 */
export async function addSampleSikuRequests(
  db: Database,
  today: string,
  entryIds: Map<SampleSikuEntry, string>,
  now: Date = new Date(),
): Promise<void> {
  const studentIds = await studentIdsByNim(db);
  const assessorId = await sampleAccountOf(db, "assessor");
  const context = { today, now, assessorId, entryIds };
  for (const sample of SAMPLE_SIKU_REQUESTS) {
    const id = crypto.randomUUID();
    const sentDay = sampleEntryDay(today, sample.sentDaysAgo);
    await db.insert(sikuRequests).values({
      id,
      studentId: studentIdOf(studentIds, sample),
      reason: sample.reason,
      day: sampleEntryDay(today, sample.daysAgo),
      report: sample.report,
      sentAt: sentMomentOf(sentDay, now),
      ...decided(sample.decision, context),
    });
    const places = Array.from({ length: sample.photos }, (_, at) => at + 1);
    await db
      .insert(sikuRequestPhotos)
      .values(places.map((place) => ({ requestId: id, place })));
  }
}
