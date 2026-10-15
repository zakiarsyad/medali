import { forbidden } from "next/navigation";
import { may } from "@/auth/access";
import { openPage } from "@/auth/open-page";
import { ProofFilesScreen } from "@/features/proof-files/proof-files-screen";

export default async function ProofFilesPage() {
  const opened = await openPage("pengaturan", "berkas");
  if (!may(opened.account.roles, "manage_proof_files")) forbidden();
  return (
    <ProofFilesScreen
      tabs={{ pagePath: "pengaturan", tabs: opened.tabs, open: "berkas" }}
    />
  );
}
