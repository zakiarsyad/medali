"use client";

import { FaultNotice } from "@/ui/fault-notice";

// Without this file a fault on a screen would be answered by the
// framework's own page in English, without the menu.
export default function ScreenFault({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <FaultNotice onRetry={retry} />;
}
