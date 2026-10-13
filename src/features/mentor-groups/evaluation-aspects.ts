/** The four aspects a mentor is evaluated on, in the order the form asks. */
export const EVALUATION_ASPECTS = [
  "activity",
  "attendance",
  "achievement",
  "feedback",
] as const;

export type EvaluationAspect = (typeof EVALUATION_ASPECTS)[number];

/** One value of 0 to 100 for each aspect. */
export type EvaluationScores = Record<EvaluationAspect, number>;

export const ASPECT_TITLES: Record<EvaluationAspect, string> = {
  activity: "Keaktifan pendampingan",
  attendance: "Kehadiran pada kegiatan kelompok",
  achievement: "Capaian karakter kelompok",
  feedback: "Umpan balik mahasiswa",
};

/** What a list names an aspect by, where the whole title does not fit. */
export const ASPECT_SHORT_TITLES: Record<EvaluationAspect, string> = {
  activity: "Keaktifan",
  attendance: "Kehadiran",
  achievement: "Capaian",
  feedback: "Umpan balik",
};

/** What the form says under each aspect. */
export const ASPECT_HINTS: Record<EvaluationAspect, string> = {
  activity: "Frekuensi dan kualitas catatan pengasuhan",
  attendance: "Hadir di pertemuan rutin dan kegiatan wajib",
  achievement: "Perkembangan nilai MEDALI dan pembinaan anggota",
  feedback: "Hasil survei kepuasan anggota kelompok",
};

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
