import { openPage } from "@/auth/open-page";
import { EmptyPage } from "@/ui/empty-page";

export default async function TabPage(props: PageProps<"/[page]/[tab]">) {
  const { page, tab } = await props.params;
  const opened = await openPage(page, tab);
  return (
    <EmptyPage
      title={opened.page.title}
      tabs={{ pagePath: opened.page.path, tabs: opened.tabs, open: tab }}
    />
  );
}
