import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readClarificationListParams } from "@/features/activities/clarification-list-address";
import { readClarifications } from "@/features/activities/clarifications";
import { ClarificationsScreen } from "@/features/activities/clarifications-screen";
import { fileStorage } from "@/files/file-storage";

export default async function ClarificationPage(
  props: PageProps<"/kegiatan/klarifikasi">,
) {
  const opened = await openPage("kegiatan", "klarifikasi");
  const params = readClarificationListParams(await props.searchParams);
  const answer = await readClarifications(
    database(),
    opened.account,
    params,
    fileStorage() !== null,
  );
  if (answer.kind === "refused") forbidden();
  return (
    <ClarificationsScreen
      tabs={{ pagePath: "kegiatan", tabs: opened.tabs, open: "klarifikasi" }}
      clarifications={answer.clarifications}
    />
  );
}
