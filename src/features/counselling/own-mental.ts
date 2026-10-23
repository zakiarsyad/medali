import { and, eq } from "drizzle-orm";
import { type AccountForAccess, may, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { latestScreenings } from "@/mental-health/latest-screenings";
import { ADVICE_WORDS } from "@/mental-health/screening-words";
import type { OwnSessionSummary } from "@/mental-health/session-view";
import type {
  SharedData,
  SharingRecipient,
  SharingStatus,
} from "@/mental-health/sharing-ids";
import type { ConsentStatus } from "./consent-ids";
import { readOwnConsent } from "./consent-reads";
import { readOwnSessionSummary } from "./own-sessions";
import { readOwnSharing } from "./sharing-reads";
import type { SharingView } from "./sharing-view";
import type { ShownScreening } from "./student-mental";

const RIGHT = "view_own_mental_health";

/** The student's current sharing, as Profil saya names it: no summary. */
export interface OwnSharing {
  status: SharingStatus;
  recipients: SharingRecipient[];
  data: SharedData[];
}

/**
 * "Kesehatan mental" of the student of the account, for Profil saya: only
 * the lines the card shows. Never the scores, the "Risiko" mark, the
 * crisis advice, a session note or a marker of BAM - Kesehatan.
 */
export interface OwnMental {
  /** Null while the student was never screened. */
  screening: ShownScreening | null;
  /** Null for Belum diminta. */
  consent: ConsentStatus | null;
  /** Null while there is no session. */
  sessions: OwnSessionSummary | null;
  /** Null while no sharing is current. */
  sharing: OwnSharing | null;
}

/**
 * The latest screening with the advice of its level. Whether self-harm was
 * ticked is never read: the crisis advice would give the "Risiko" mark
 * away, as it would to a recipient of a sharing.
 */
async function readOwnScreening(
  db: Database,
  account: AccountForAccess,
  studentId: string,
): Promise<ShownScreening | null> {
  const own = visibleTo(rowLimitForAction(account, RIGHT));
  const latest = latestScreenings(db, {});
  const [found] = await db
    .select({
      level: latest.level,
      instrument: latest.instrument,
      screenedOn: latest.screenedOn,
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .where(and(eq(students.id, studentId), own));
  if (!found) return null;
  const { level, instrument, screenedOn } = found;
  return { level, instrument, screenedOn, advice: ADVICE_WORDS[level] };
}

/**
 * What the student of the account sees of their own mental health, or null
 * for an account without the right. Which student is never asked from
 * outside: it is the account's own.
 */
export async function readOwnMental(
  db: Database,
  account: AccountForAccess,
  now: Date = new Date(),
): Promise<OwnMental | null> {
  if (!may(account.roles, RIGHT)) return null;
  if (account.studentId === null) return null;
  const [screening, consent, sessions, sharing] = await Promise.all([
    readOwnScreening(db, account, account.studentId),
    readOwnConsent(db, account),
    readOwnSessionSummary(db, account, now),
    readOwnSharing(db, account),
  ]);
  return {
    screening,
    consent: consent?.status ?? null,
    sessions,
    sharing: sharing === null ? null : ownSharingOf(sharing),
  };
}

/** Who a sharing is for and what it holds; its summary stays on Konseling. */
function ownSharingOf(sharing: SharingView): OwnSharing {
  const { status, recipients, data } = sharing;
  return { status, recipients, data };
}
