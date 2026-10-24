import type { ReactNode } from "react";
import { USUAL_SIZE_WORDS } from "./group-size";
import type { TabLinksProps } from "./tab-links";
import { TabbedHead } from "./tabbed-head";

/** The head every tab of Pengasuh starts with, and the tab's notes under it. */
export function MentorsHead({
  tabs,
  children,
}: {
  tabs: TabLinksProps;
  /** The open tab's notes, each a `TabNote`. */
  children?: ReactNode;
}) {
  return (
    <TabbedHead
      title="Pengasuh"
      tabs={tabs}
      lede={
        <>
          Setiap pengasuh membina satu kelompok pengasuhan berisi{" "}
          {USUAL_SIZE_WORDS} mahasiswa. Kelompok dibentuk saat mahasiswa pertama
          kali masuk PKN STAN, tidak mengikuti kelas akademik, dan diasuh
          pengasuh yang sama sampai lulus kecuali ada penggantian.
        </>
      }
    >
      {children}
    </TabbedHead>
  );
}
