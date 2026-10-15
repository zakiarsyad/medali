/** What an upload, a removal or a conversion answers to a role without the right. */
export const NOT_ALLOWED_TO_UPLOAD = {
  ok: false,
  error:
    "Anda tidak berhak mengunggah data SKPM atau mengubah konversinya. Data SKPM diunggah oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa.",
} as const;
