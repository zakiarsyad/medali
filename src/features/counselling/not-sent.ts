import { SAVE_NOT_SENT } from "@/ui/save-not-sent";

/** The refused outcome of a counselling save that did not reach the server. */
export const REFUSED_NOT_SENT = {
  kind: "refused",
  error: SAVE_NOT_SENT,
} as const;
