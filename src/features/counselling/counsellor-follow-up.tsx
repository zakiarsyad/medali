"use client";

import { useRef } from "react";
import type { Parsed } from "@/parsed";
import { type ConsentView, versionOfConsent } from "./consent-view";
import {
  CounsellingListPart,
  type CounsellorStudents,
} from "./counselling-list-panel";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { CounsellorSharingPanel } from "./counsellor-sharing-panel";
import { followUpOf } from "./follow-up";
import { ReferralPanel } from "./referral-panel";
import type { ReferralList } from "./referral-view";
import { useConsentPick } from "./use-consent-pick";

/** The consent the panel shows, by its version; null until it is read. */
function consentVersionOf(
  looked: Parsed<ConsentView | null> | null,
): string | null {
  if (looked === null || !looked.ok) return null;
  return versionOfConsent(looked.value);
}

/**
 * The dorm referrals, "Persetujuan konseling", "Publikasi data
 * kesehatan mental" and "Daftar mahasiswa" of Konselor, which share
 * the student picked: "Tindak lanjuti" of a referral picks the student
 * in the panel and brings it into view. Each shows only to an account
 * with its own right.
 */
export function CounsellorFollowUp({
  referrals,
  mayManageConsent,
  mayKeepSessions,
  mayShare = false,
  students = null,
}: {
  referrals: ReferralList | null;
  mayManageConsent: boolean;
  mayKeepSessions: boolean;
  /** "Publikasi data kesehatan mental" about the student picked. */
  mayShare?: boolean;
  /** The numbers and "Daftar mahasiswa", or null without the right. */
  students?: CounsellorStudents | null;
}) {
  const picking = useConsentPick(mayKeepSessions);
  const consentPanel = useRef<HTMLElement>(null);

  const followUp = followUpOf(picking.pick, () =>
    consentPanel.current?.scrollIntoView({ behavior: "smooth" }),
  );

  return (
    <>
      {referrals && (
        <ReferralPanel
          list={referrals}
          onFollowUp={mayManageConsent ? followUp : null}
        />
      )}
      {mayManageConsent && (
        <CounsellorConsentPanel picking={picking} ref={consentPanel} />
      )}
      {mayShare && (
        <CounsellorSharingPanel
          picked={picking.picked}
          consentVersion={consentVersionOf(picking.looked)}
        />
      )}
      {students && <CounsellingListPart students={students} />}
    </>
  );
}
