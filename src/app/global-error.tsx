"use client";

import "@/ui/tokens.css";
import "@/ui/base.css";
import { BareScreen } from "@/ui/bare-screen";
import { brandFont } from "@/ui/brand-font";
import { FaultNotice } from "@/ui/fault-notice";

/**
 * Shown in place of the whole app when the frame around it cannot load,
 * such as when the menu cannot be read. It replaces the app's own frame,
 * so it brings its page, its styles and its font itself.
 */
export default function GlobalFault({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="id" className={brandFont.variable}>
      <body>
        <title>MEDALI</title>
        <BareScreen>
          <FaultNotice onRetry={retry} centred />
        </BareScreen>
      </body>
    </html>
  );
}
