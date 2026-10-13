import { openPage } from "@/auth/open-page";
import { EmptyPage } from "@/ui/empty-page";

export default async function ClarificationPage() {
  const opened = await openPage("kegiatan", "klarifikasi");
  return (
    <EmptyPage
      title={opened.page.title}
      tabs={{ pagePath: "kegiatan", tabs: opened.tabs, open: "klarifikasi" }}
    />
  );
}
