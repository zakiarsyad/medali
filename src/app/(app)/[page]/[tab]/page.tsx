import { openPage } from "@/auth/open-page";
import { residentHeader } from "@/features/dorm/resident-header";
import { EmptyPage } from "@/ui/empty-page";

export default async function TabPage(props: PageProps<"/[page]/[tab]">) {
  const { page, tab } = await props.params;
  const opened = await openPage(page, tab);
  const isDorm = opened.page.id === "dorm";
  return (
    <EmptyPage
      title={opened.page.title}
      lede={isDorm ? await residentHeader(opened.account.studentId) : null}
      tabs={{ pagePath: opened.page.path, tabs: opened.tabs, open: tab }}
    />
  );
}
