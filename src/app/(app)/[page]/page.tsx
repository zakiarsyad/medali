import { openPage } from "@/auth/open-page";
import { EmptyPage } from "@/ui/empty-page";

export default async function Page(props: PageProps<"/[page]">) {
  const { page } = await props.params;
  const opened = await openPage(page);
  return <EmptyPage title={opened.page.title} />;
}
