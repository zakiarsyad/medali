import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/ui/tokens.css";
import "@/ui/base.css";
import { brandFont } from "@/ui/brand-font";

export const metadata: Metadata = {
  title: "MEDALI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={brandFont.variable}>
      <body>{children}</body>
    </html>
  );
}
