/*
 * The fixed facts of a character assessment. Read by the screen parts in
 * the browser and by the table definitions, so nothing here may take
 * from the database code.
 */

/** "Sumber asesmen", in the prototype's order. */
export const ASSESSMENT_SOURCES = [
  "mentor_observation",
  "self_assessment",
  "peer_assessment",
  "mentor_board_meeting",
  "medali_instrument",
] as const;

export type AssessmentSource = (typeof ASSESSMENT_SOURCES)[number];

/** Where a slider starts for a student who has no assessment yet. */
export const STARTING_SCORE = 75;

/** The longest "Catatan penilai". */
export const NOTE_MAX_LENGTH = 500;
