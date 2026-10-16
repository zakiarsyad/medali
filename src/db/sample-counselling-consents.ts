import type {
  ConsentStatus,
  ConsentWay,
} from "@/features/counselling/consent-ids";

/*
 * Made-up consents to counselling only, for the made-up students.
 */

/** One change of a sample consent, some days ago. */
export interface SampleConsentStep {
  status: ConsentStatus;
  /** How a Disetujui was given; none for any other status. */
  way: ConsentWay | null;
  daysAgo: number;
}

/** A sample student's consent, with every change of it, oldest first. */
export interface SampleConsent {
  nim: string;
  steps: SampleConsentStep[];
}

/** The sample Konselor who asked for and recorded every sample consent. */
export const SAMPLE_COUNSELLOR = "Indah Permatasari";

const asked = (daysAgo: number): SampleConsentStep => ({
  status: "waiting",
  way: null,
  daysAgo,
});

/**
 * One student in every status: Ayu Lestiani has a request waiting, so
 * it can be answered after picking her on Ganti peran. Gita Purba
 * declined once and was asked again, so an earlier answer shows in the
 * log.
 */
export const SAMPLE_CONSENTS: SampleConsent[] = [
  { nim: "9900230001", steps: [asked(2)] },
  {
    nim: "9900240002",
    steps: [asked(20), { status: "approved", way: "online", daysAgo: 19 }],
  },
  {
    nim: "9900250003",
    steps: [{ status: "approved", way: "paper", daysAgo: 15 }],
  },
  {
    nim: "9900250005",
    steps: [asked(12), { status: "declined", way: null, daysAgo: 11 }],
  },
  {
    nim: "9900230006",
    steps: [
      asked(40),
      { status: "approved", way: "online", daysAgo: 38 },
      { status: "withdrawn", way: null, daysAgo: 6 },
    ],
  },
  {
    nim: "9900250007",
    steps: [
      asked(30),
      { status: "declined", way: null, daysAgo: 29 },
      asked(3),
    ],
  },
];

/**
 * Whether the student made a change on their own page. A request and a
 * paper form are the work of Konselor.
 */
export function isStudentStep(step: SampleConsentStep): boolean {
  if (step.status === "waiting") return false;
  return step.way !== "paper";
}
