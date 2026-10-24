import type { ValueKey } from "./medali-values";

type LevelTexts = readonly [string, string, string, string];

/**
 * The texts the main indicators of each value start with, from level 1
 * to level 4, from the prototype. Kurikulum shows them until a text is
 * saved, and the indicators of the mentoring score start with level 1.
 */
export const STARTING_TEXTS: Record<ValueKey, LevelTexts> = {
  M: [
    "Mengatur waktu, keuangan, dan kebutuhan pribadi secara mandiri",
    "Menyelesaikan tugas dan peran organisasi tanpa bergantung pada orang lain",
    "Mengambil keputusan dan bertanggung jawab atas pilihannya dalam kegiatan lapangan",
    "Mandiri merencanakan karier dan kesiapan penempatan",
  ],
  E: [
    "Peka dan menghargai teman dari latar belakang berbeda",
    "Aktif membantu dan bekerja sama dalam kelompok",
    "Peduli pada masyarakat melalui pelayanan dan pengabdian",
    "Menjadi teladan kepedulian dan menggerakkan orang lain",
  ],
  D: [
    "Tepat waktu serta taat tata tertib kampus dan asrama",
    "Konsisten menjalankan kewajiban akademik dan organisasi",
    "Disiplin pada standar kerja dan prosedur saat praktik",
    "Menjadikan disiplin sebagai kebiasaan profesional aparatur",
  ],
  A: [
    "Menyesuaikan diri dengan kehidupan kampus kedinasan",
    "Terbuka terhadap masukan dan perubahan dalam kelompok",
    "Cepat beradaptasi dengan situasi kerja lapangan",
    "Siap ditempatkan dan beradaptasi di unit kerja mana pun",
  ],
  L: [
    "Bangga dan menjaga nama baik almamater",
    "Aktif dan berkomitmen dalam kegiatan institusi",
    "Mengutamakan kepentingan institusi dan negara dalam tugas",
    "Berkomitmen pada nilai Kementerian Keuangan sebagai calon aparatur",
  ],
  I: [
    "Jujur dalam akademik dan kegiatan sehari-hari",
    "Konsisten antara kata dan perbuatan dalam organisasi",
    "Berani menolak dan melaporkan kecurangan",
    "Berintegritas dan antikorupsi sebagai calon aparatur negara",
  ],
};
