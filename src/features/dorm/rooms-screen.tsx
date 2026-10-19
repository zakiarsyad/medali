import type { SQL } from "drizzle-orm";
import Link from "next/link";
import type { Database } from "@/db/connect";
import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import { AddResidentPanel } from "./add-resident-panel";
import { DormNumbers, DormSwitch } from "./dorm-summary";
import { FloorPanel } from "./floor-panel";
import { NO_PERIOD } from "./place-resident";
import styles from "./rooms.module.css";
import { addingAddress, type RoomsParams } from "./rooms-address";
import { loadNonResidents, loadRooms } from "./rooms-view";
import { UnplacedPanel } from "./unplaced-panel";

/** "Tambah penghuni": its button, or its panel once the button opened it. */
async function AddResident({
  db,
  params,
  visible,
}: {
  db: Database;
  params: RoomsParams;
  visible: SQL;
}) {
  if (params.adding === null) {
    return (
      <div className={shared.actions}>
        <Link
          href={addingAddress(params.dorm, params.floor)}
          className={shared.button}
        >
          Tambah penghuni
        </Link>
      </div>
    );
  }
  const found = await loadNonResidents(db, params.adding, visible);
  return <AddResidentPanel params={params} found={found} />;
}

export async function RoomsScreen({
  tabs,
  params,
  visible,
  mayManage,
  maySetResidents,
}: {
  tabs: TabLinksProps;
  params: RoomsParams;
  /** The student rows the account that opened the page may see. */
  visible: SQL;
  /** Whether the account may change rooms, or only see them. */
  mayManage: boolean;
  /** Whether the account may add residents and make them Non asrama. */
  maySetResidents: boolean;
}) {
  const db = database();
  const view = await loadRooms(db, params, visible);
  const { rooms, residents, counts, unplaced, companions } = view;
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
      {!view.periodRuns && (
        <p className={styles.note} role="status">
          {NO_PERIOD.error}
        </p>
      )}
      {maySetResidents && (
        <AddResident db={db} params={params} visible={visible} />
      )}
      <DormSwitch open={params.dorm} floor={params.floor} />
      <DormNumbers
        dorm={params.dorm}
        counts={counts}
        rooms={rooms}
        companions={companions?.counts ?? null}
      />
      <FloorPanel
        dorm={params.dorm}
        floor={params.floor}
        rooms={rooms}
        residents={residents}
        offered={mayManage ? unplaced.shown : null}
        companions={companions}
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
