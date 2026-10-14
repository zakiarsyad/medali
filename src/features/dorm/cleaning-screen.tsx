import { database } from "@/db/database";
import shared from "@/ui/data-screen.module.css";
import { PageHead } from "@/ui/page-head";
import { TabLinks, type TabLinksProps } from "@/ui/tab-links";
import styles from "./cleaning.module.css";
import { type CleaningParams, shownDorms } from "./cleaning-address";
import { readCleaningPlaces } from "./cleaning-place-list";
import { CleaningPlacesBoard, type DormPlaces } from "./cleaning-places-board";
import { readOccupiedRoomsOf } from "./cleaning-rooms";
import { CleaningSwitch } from "./cleaning-switch";

/** Pembersihan asrama for staff: the places of the dorms shown. */
export async function CleaningScreen({
  tabs,
  params,
  mayManage,
}: {
  tabs: TabLinksProps;
  params: CleaningParams;
  /** Whether the account may change places and duties, or only see them. */
  mayManage: boolean;
}) {
  const db = database();
  const dorms = shownDorms(params);
  const [places, rooms] = await Promise.all([
    readCleaningPlaces(db, dorms),
    readOccupiedRoomsOf(db, dorms),
  ]);
  const groups: DormPlaces[] = dorms.map((dorm) => ({
    dorm,
    places: places.filter((place) => place.dorm === dorm),
    rooms: rooms.get(dorm)?.length ?? 0,
  }));
  return (
    <>
      <PageHead title="Pembersihan asrama">
        Tempat pembersihan bersama tiap asrama dan kamar yang bertugas
        membersihkannya.
      </PageHead>
      <TabLinks {...tabs} />
      {!mayManage && (
        <p className={styles.note}>
          Pembersihan asrama dikelola oleh Pengelola Asrama dan BAM. Anda dapat
          melihat tempat dan jadwalnya.
        </p>
      )}
      <CleaningSwitch params={params} />
      <section className={shared.panel}>
        <h2 className={shared.heading}>Tempat pembersihan</h2>
        <p className={styles.sub}>
          Daftar tempat yang dibersihkan bergiliran. Selain tempat ini, setiap
          kamar penghuni dapat ditugaskan membersihkan kamarnya sendiri.
        </p>
        <CleaningPlacesBoard
          groups={groups}
          mayManage={mayManage}
          formDorm={params.dorm ?? "dana_rakca"}
        />
      </section>
    </>
  );
}
