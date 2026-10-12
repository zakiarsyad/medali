import type { SQL } from "drizzle-orm";
import { database } from "@/db/database";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { readDormCohorts } from "./dorm-cohorts";
import { DormNumbers, DormSwitch } from "./dorm-summary";
import { FloorPanel } from "./floor-panel";
import {
  countResidents,
  listUnplaced,
  type ResidentScope,
  readFloorResidents,
  readRooms,
} from "./room-list";
import styles from "./rooms.module.css";
import type { RoomsParams } from "./rooms-address";
import { freeStalePlaces } from "./stale-places";
import { UnplacedPanel } from "./unplaced-panel";

export async function RoomsScreen({
  tabs,
  params,
  visible,
  mayManage,
}: {
  tabs: TabLinksProps;
  params: RoomsParams;
  /** The student rows the account that opened the page may see. */
  visible: SQL;
  /** Whether the account may change rooms, or only see them. */
  mayManage: boolean;
}) {
  const db = database();
  const dormCohorts = await readDormCohorts(db);
  await freeStalePlaces(db, dormCohorts);
  const scope: ResidentScope = { dorm: params.dorm, dormCohorts, visible };
  const [rooms, residents, counts, unplaced] = await Promise.all([
    readRooms(db, params.dorm),
    readFloorResidents(db, scope, params.floor),
    countResidents(db, scope),
    listUnplaced(db, scope, params.query),
  ]);
  return (
    <>
      <PageHead title="Ploting kamar">
        Penempatan penghuni ke kamar asrama, lantai 1 sampai 8.
      </PageHead>
      <TabLinks {...tabs} />
      {!mayManage && (
        <p className={styles.note}>
          Menu asrama dikelola oleh Pengelola Asrama. Anda dapat melihat rekap
          dan rinciannya.
        </p>
      )}
      <DormSwitch open={params.dorm} floor={params.floor} />
      <DormNumbers dorm={params.dorm} counts={counts} rooms={rooms} />
      <FloorPanel
        dorm={params.dorm}
        floor={params.floor}
        rooms={rooms}
        residents={residents}
        offered={mayManage ? unplaced.shown : null}
      />
      <UnplacedPanel
        params={params}
        unplaced={unplaced}
        residents={counts.residents}
        mayManage={mayManage}
      />
    </>
  );
}
