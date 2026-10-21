"use client";

import { useRef } from "react";
import { CounsellorConsentPanel } from "./counsellor-consent-panel";
import { followUpOf } from "./follow-up";
import { ReferralPanel } from "./referral-panel";
import type { ReferralList } from "./referral-view";
import { useConsentPick } from "./use-consent-pick";

/**
 * The dorm referrals and "Persetujuan konseling" of Konselor, which share
 * the student picked: "Tindak lanjuti" of a referral picks the student
 * in the panel and brings it into view. Each shows only to an account
 * with its own right.
 */
export function CounsellorFollowUp({
  referrals,
  mayManageConsent,
  mayKeepSessions,
}: {
  referrals: ReferralList | null;
  mayManageConsent: boolean;
  mayKeepSessions: boolean;
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
    </>
  );
}
