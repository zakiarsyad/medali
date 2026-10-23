/**
 * The eight statements of the satisfaction survey, in the order students
 * rate them. They are fixed: changing one changes what earlier answers
 * were given to.
 */
export const SURVEY_STATEMENTS = [
  "Pengasuh mudah dihubungi dan tanggap ketika saya membutuhkan bantuan.",
  "Pengasuh hadir dan memimpin pertemuan pengasuhan secara teratur.",
  "Pengasuh memberi teladan sikap dan perilaku yang baik.",
  "Pengasuh membantu saya memahami dan menerapkan nilai-nilai MEDALI.",
  "Pengasuh memberi umpan balik yang membangun atas perkembangan saya.",
  "Pengasuh peduli terhadap kesulitan akademik maupun nonakademik saya.",
  "Pengasuh memperlakukan seluruh anggota kelompok secara adil.",
  "Secara keseluruhan, saya puas dengan pendampingan pengasuh saya.",
] as const;

/**
 * What each score of a statement means, from 1 to 5. The prototype's
 * scale, to be confirmed by the campus.
 */
export const SURVEY_SCALE = [
  "Sangat tidak setuju",
  "Tidak setuju",
  "Netral",
  "Setuju",
  "Sangat setuju",
] as const;

/** The lowest and the highest score of a statement. */
export const LOWEST_SCORE = 1;
export const HIGHEST_SCORE = SURVEY_SCALE.length;

/** How long "Saran untuk pengasuh" may be, in characters. */
export const SUGGESTION_MAX = 600;

/**
 * How many of a group must answer before its averages and its
 * suggestions are shown, the suggestions without names, so neither can
 * be traced to one student.
 */
export const FEWEST_ANSWERS_SHOWN = 3;
