import type {
  SharedData,
  SharingRecipient,
  SharingStatus,
  SharingWay,
} from "@/mental-health/sharing-ids";

/*
 * Read by the screen parts in the browser, so nothing here may take from
 * the database code.
 */

/** A request to share counselling data, as a screen shows it. */
export interface SharingView {
  id: string;
  status: SharingStatus;
  data: SharedData[];
  recipients: SharingRecipient[];
  summary: string | null;
  way: SharingWay | null;
  /** When the student answered or a paper approval was recorded. */
  answeredAt: Date | null;
  publishedAt: Date | null;
  /** The Konselor who published it; null on the student's page. */
  publishedByName: string | null;
  /** What a press sends back, so a change made since is caught. */
  version: string;
}

/**
 * What "Publikasi data kesehatan mental" shows Konselor of a student:
 * whether they may be asked, for what, and their latest sharing.
 */
export interface SharingPanel {
  /** At least one counselling session was written down. */
  hasSessions: boolean;
  /** At least one mental health screening was recorded. */
  hasScreening: boolean;
  /** Their consent to counselling is Disetujui. */
  hasConsent: boolean;
  /** Their latest sharing, current or ended; null for none. */
  sharing: SharingView | null;
}

/** A sharing as the student's own page shows it: no Konselor is named. */
export function withoutPublisher(sharing: SharingView): SharingView {
  return { ...sharing, publishedByName: null };
}
