import shared from "@/ui/data-screen.module.css";
import { OWN_RECORD_NOTE } from "./own-record";

/** Shown in place of the deciding buttons on the account's own record. */
export function OwnRecordNote() {
  return <p className={shared.detail}>{OWN_RECORD_NOTE}</p>;
}
