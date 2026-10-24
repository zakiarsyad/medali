/*
 * What tells one setting of the indicators from another, shared by the
 * forms in the browser and the server that checks what they send.
 */

/** The version of a form opened while the starting indicators are in force. */
export const STARTING_INDICATORS_VERSION = "start";

/**
 * The name of the lock a save of the indicators holds alone, and a save
 * of scores shares, so scores are never given on indicators being changed.
 */
export const INDICATOR_SET_LOCK = "mentoring_indicator_set";
