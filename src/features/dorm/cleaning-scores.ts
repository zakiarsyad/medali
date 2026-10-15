import { and, asc, countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { dormCleaningDuties, dormCleaningPlaces, dormRooms } from "@/db/schema";
import type { DormId } from "@/dorms/dorms";
import { pageWithin } from "@/ui/list-pages";
import { RANKING_PAGE_SIZE } from "./cleaning-ids";
import { DUTY_SHOWN } from "./cleaning-schedule";

/** One room of "Skor kebersihan kamar". */
export interface RoomScore {
  roomId: string;
  dorm: DormId;
  number: string;
  /** How many of its duties were validated Memenuhi. */
  plus: number;
  /** How many of its duties were validated Tidak memenuhi. */
  minus: number;
}

/** One page of "Skor kebersihan kamar". */
export interface RankingPage {
  rooms: RoomScore[];
  /** How many rooms have a validated result in all. */
  matching: number;
  page: number;
}

/** The two numbers staff see beside the schedule. */
export interface WaitingCounts {
  /** Duties Dinilai BAM, waiting for Pengelola Asrama. */
  waiting: number;
  /** Repeats still to be judged. */
  repeats: number;
}

const PLACE_OF_DUTY = eq(dormCleaningPlaces.id, dormCleaningDuties.placeId);

const PLUS =
  sql<number>`count(*) filter (where ${dormCleaningDuties.result} = 'met')`.mapWith(
    Number,
  );
const MINUS =
  sql<number>`count(*) filter (where ${dormCleaningDuties.result} = 'not_met')`.mapWith(
    Number,
  );

/** The validated duties of some dorms. */
function validatedIn(dorms: readonly DormId[]) {
  return and(
    eq(dormCleaningDuties.status, "validated"),
    inArray(dormCleaningDuties.dorm, [...dorms]),
  );
}

/**
 * "Menunggu validasi" and "Pembersihan ulang" of some dorms, of every
 * date: the duties that wait for Pengelola Asrama, and the repeats that
 * wait to be judged. A duty of a removed place no longer shows, so it is
 * not counted.
 */
export async function countWaiting(
  db: Database,
  dorms: readonly DormId[],
): Promise<WaitingCounts> {
  const [counted] = await db
    .select({
      waiting:
        sql<number>`count(*) filter (where ${dormCleaningDuties.status} = 'judged')`.mapWith(
          Number,
        ),
      repeats:
        sql<number>`count(*) filter (where ${dormCleaningDuties.status} = 'scheduled' and ${dormCleaningDuties.repeatOf} is not null)`.mapWith(
          Number,
        ),
    })
    .from(dormCleaningDuties)
    .leftJoin(dormCleaningPlaces, PLACE_OF_DUTY)
    .where(
      and(
        inArray(dormCleaningDuties.dorm, [...dorms]),
        sql`(${dormCleaningDuties.status} = 'judged' or (${dormCleaningDuties.status} = 'scheduled' and ${dormCleaningDuties.repeatOf} is not null))`,
        DUTY_SHOWN,
      ),
    );
  return { waiting: counted?.waiting ?? 0, repeats: counted?.repeats ?? 0 };
}

/**
 * One page of "Skor kebersihan kamar" for some dorms: the rooms on
 * Ploting kamar with a validated result, by Skor high to low, then by
 * more +, then by number. Counted for all time. A room removed since
 * keeps its results on the schedule but leaves the ranking, as its
 * duties no longer name it.
 */
export async function readRanking(
  db: Database,
  dorms: readonly DormId[],
  page: number,
): Promise<RankingPage> {
  const [counted] = await db
    .select({ matching: countDistinct(dormRooms.id) })
    .from(dormCleaningDuties)
    .innerJoin(dormRooms, eq(dormRooms.id, dormCleaningDuties.roomId))
    .where(validatedIn(dorms));
  const matching = counted?.matching ?? 0;
  const shown = pageWithin(page, matching, RANKING_PAGE_SIZE);
  if (matching === 0) return { rooms: [], matching, page: shown };

  const rooms = await db
    .select({
      roomId: dormRooms.id,
      dorm: dormRooms.dorm,
      number: dormRooms.number,
      plus: PLUS,
      minus: MINUS,
    })
    .from(dormCleaningDuties)
    .innerJoin(dormRooms, eq(dormRooms.id, dormCleaningDuties.roomId))
    .where(validatedIn(dorms))
    .groupBy(dormRooms.id)
    .orderBy(
      desc(sql`${PLUS} - ${MINUS}`),
      desc(PLUS),
      asc(dormRooms.number),
      asc(dormRooms.id),
    )
    .limit(RANKING_PAGE_SIZE)
    .offset((shown - 1) * RANKING_PAGE_SIZE);
  return { rooms, matching, page: shown };
}
