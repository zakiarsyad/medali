import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/ui/tokens.css";
import "@/ui/base.css";
import { pagesFor } from "@/auth/access";
import { currentAccount } from "@/auth/current-account";
import { signedInAs } from "@/auth/signed-in-as";
import { AppShell } from "@/ui/app-shell";
import { brandFont } from "@/ui/brand-font";

export const metadata: Metadata = {
  title: "MEDALI",
};

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
          menu={account ? pagesFor(account.roles) : []}
          signedInAs={account ? signedInAs(account) : null}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
