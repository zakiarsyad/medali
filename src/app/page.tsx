import { redirect } from "next/navigation";
import { pagesFor } from "@/auth/access";
import { currentAccount } from "@/auth/current-account";
import { Notice } from "@/ui/notice";

export default async function HomePage() {
  const account = await currentAccount();
  const first = account ? pagesFor(account.roles)[0] : undefined;
  if (first) redirect(`/${first.path}`);
  return (
    <Notice title="Belum masuk">
      Belum ada akun yang masuk. Masuk dengan akun kampus untuk membuka menu.
    </Notice>
  );
}
