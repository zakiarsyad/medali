/** What a change to the curriculum answers to a role without the right. */
export const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengubah kurikulum.",
} as const;

/** What a change to the activities answers to a role without the right. */
export const ACTIVITIES_NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola kegiatan.",
} as const;
