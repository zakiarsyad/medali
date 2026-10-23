import type { FormState } from "@/ui/form-message";
import type { DecreeStep } from "./decree-input";
import { ALREADY_FIXED, NOT_FIXED } from "./refusals";

/** A button of a penetapan that answers with a message. */
export type AnsweredStep = DecreeStep | "cancel";

/**
 * Refusals that come with a page showing the angkatan fixed or cancelled
 * meanwhile, so the form or button that was pressed is no longer there.
 */
const PANEL_GONE_REFUSALS: readonly string[] = [
  ALREADY_FIXED.error,
  NOT_FIXED.error,
];

const PANEL_TAKING_STEPS: readonly AnsweredStep[] = ["fix", "cancel"];

/**
 * Whether an answer is told above the angkatan instead of under its
 * button: true when the page that comes with it no longer holds the button.
 */
export function isToldAbove(step: AnsweredStep, answer: FormState): boolean {
  if (answer.error !== null) return PANEL_GONE_REFUSALS.includes(answer.error);
  if (answer.done === null) return false;
  return PANEL_TAKING_STEPS.includes(step);
}
