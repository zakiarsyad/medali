import { PageHead } from "@/ui/page-head";
import { KIND_TITLES } from "./dashboard-kind";
import type { MenteeDashboard } from "./mentee-recap";
import { menteeLede, NO_GROUP_HELD } from "./mentee-words";

/** Dashboard anak asuh, for Pengasuh: only their own anak asuh. */
export function MenteeScreen({ view }: { view: MenteeDashboard }) {
  if (view.kind === "no_group") {
    return <PageHead title={KIND_TITLES.mentees}>{NO_GROUP_HELD}</PageHead>;
  }
  return <PageHead title={KIND_TITLES.mentees}>{menteeLede(view)}</PageHead>;
}
