import { type SQL, sql } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import {
  activityAttendances,
  activityClarifications,
  dormClarifications,
  dormReturnReports,
  dormViolationAppeals,
  sikuRequestPhotos,
  sikuRequests,
} from "@/db/schema";
import type { ProofKind } from "./proof-kinds";

/**
 * Where one kind of proof file is kept: the table whose rows hold the
 * place of the file and its removal mark, and how a row gives the status
 * of its record and when the file was sent.
 */
export interface ProofSource {
  kind: ProofKind;
  table: PgTable;
  id: PgColumn;
  /** Every place a row keeps a copy of its file; all go together. */
  keys: readonly [PgColumn, ...PgColumn[]];
  removedAt: PgColumn;
  /** The status of the record, as text. */
  status: SQL<string>;
  sentAt: PgColumn | SQL;
}

/** A SIKU photo row takes its status and its time sent from its request. */
function ofSikuRequest(column: PgColumn): SQL {
  return sql`(select ${column} from ${sikuRequests} where ${sikuRequests.id} = ${sikuRequestPhotos.requestId})`;
}

export const PROOF_SOURCES: Record<ProofKind, ProofSource> = {
  attendance_photo: {
    kind: "attendance_photo",
    table: activityAttendances,
    id: activityAttendances.id,
    keys: [activityAttendances.photoKey],
    removedAt: activityAttendances.fileRemovedAt,
    status: sql<string>`${activityAttendances.status}::text`,
    sentAt: activityAttendances.sentAt,
  },
  siku_photo: {
    kind: "siku_photo",
    table: sikuRequestPhotos,
    id: sikuRequestPhotos.id,
    keys: [sikuRequestPhotos.photoKey, sikuRequestPhotos.thumbKey],
    removedAt: sikuRequestPhotos.fileRemovedAt,
    status: sql<string>`${ofSikuRequest(sikuRequests.status)}::text`,
    sentAt: ofSikuRequest(sikuRequests.sentAt),
  },
  return_photo: {
    kind: "return_photo",
    table: dormReturnReports,
    id: dormReturnReports.id,
    keys: [dormReturnReports.photoKey],
    removedAt: dormReturnReports.fileRemovedAt,
    status: sql<string>`${dormReturnReports.status}::text`,
    sentAt: dormReturnReports.sentAt,
  },
  activity_clarification: {
    kind: "activity_clarification",
    table: activityClarifications,
    id: activityClarifications.id,
    keys: [activityClarifications.fileKey],
    removedAt: activityClarifications.fileRemovedAt,
    status: sql<string>`${activityClarifications.status}::text`,
    sentAt: activityClarifications.sentAt,
  },
  dorm_clarification: {
    kind: "dorm_clarification",
    table: dormClarifications,
    id: dormClarifications.id,
    keys: [dormClarifications.fileKey],
    removedAt: dormClarifications.fileRemovedAt,
    status: sql<string>`${dormClarifications.status}::text`,
    sentAt: dormClarifications.sentAt,
  },
  appeal_proof: {
    kind: "appeal_proof",
    table: dormViolationAppeals,
    id: dormViolationAppeals.id,
    keys: [dormViolationAppeals.fileKey],
    removedAt: dormViolationAppeals.fileRemovedAt,
    status: sql<string>`${dormViolationAppeals.status}::text`,
    sentAt: dormViolationAppeals.sentAt,
  },
};

/** The campus day a moment falls on, as year-month-day; null for none. */
export function campusDayOf(at: PgColumn | SQL): SQL<string | null> {
  return sql<
    string | null
  >`to_char(${at} at time zone 'Asia/Jakarta', 'YYYY-MM-DD')`;
}

/** Whether a row still keeps its file: its copies are kept or gone together. */
export function keepsFile(source: ProofSource): SQL {
  return sql`${source.keys[0]} is not null`;
}
