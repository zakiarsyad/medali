import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/ui/tokens.css";
import "@/ui/base.css";
import { pagesForAccount } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import { currentAccount } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { currentDorm } from "@/features/dorm/current-dorm";
import { AppShell } from "@/ui/app-shell";
import { brandFont } from "@/ui/brand-font";

export const metadata: Metadata = {
  title: "MEDALI",
};

async function menuOf(account: Account) {
  const dorm = await currentDorm(account.studentId);
  return pagesForAccount(account.roles, dorm !== null);
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const account = await currentAccount();
  return (
    <html lang="id" className={brandFont.variable}>
      <body>
        <AppShell
          menu={account ? await menuOf(account) : []}
          signedInAs={account ? signedInAs(account) : null}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
