import { forbidden } from "next/navigation";
import { openPage } from "@/auth/open-page";
import { database } from "@/db/database";
import { readVerification } from "@/features/activities/verification";
import { readVerificationParams } from "@/features/activities/verification-address";
import { VerificationScreen } from "@/features/activities/verification-screen";
import { fileStorage } from "@/files/file-storage";

export default async function VerificationPage(
  props: PageProps<"/kegiatan/verifikasi">,
) {
  const opened = await openPage("kegiatan", "verifikasi");
  const params = readVerificationParams(await props.searchParams);
  const answer = await readVerification(
    database(),
    opened.account,
    params,
    new Date(),
    fileStorage() !== null,
  );
  if (answer.kind === "refused") forbidden();
  return (
    <VerificationScreen
      tabs={{ pagePath: "kegiatan", tabs: opened.tabs, open: "verifikasi" }}
      verification={answer.verification}
    />
  );
}
