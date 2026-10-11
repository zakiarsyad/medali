import { MEDALI_VALUES, type ValueKey } from "@/ui/medali-values";

/** The tahap of each level, from level 1 to level 4. */
export const STAGES = [
  "Penanaman",
  "Penumbuhan",
  "Pengembangan",
  "Pematangan",
] as const;

type LevelTexts = readonly [string, string, string, string];

/** The texts the indicators start with, from the prototype. */
const STARTING_TEXTS: Record<ValueKey, LevelTexts> = {
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

export interface MainIndicator {
  /** The letter of the value and the level, such as M1. It never changes. */
  code: string;
  level: number;
  stage: string;
  text: string;
}

/** One MEDALI value with its four indicators, from level 1 to level 4. */
export interface ValueIndicators {
  key: ValueKey;
  name: string;
  indicators: MainIndicator[];
}

/**
 * The main indicators of every value. An indicator shows its saved text,
 * and its starting text while none is saved. `saved` holds texts by code.
 */
export function mainIndicators(
  saved: ReadonlyMap<string, string>,
): ValueIndicators[] {
  return MEDALI_VALUES.map(({ key, name }) => ({
    key,
    name,
    indicators: STAGES.map((stage, place) => {
      const code = `${key}${place + 1}`;
      const text = saved.get(code) ?? STARTING_TEXTS[key][place] ?? "";
      return { code, level: place + 1, stage, text };
    }),
  }));
}
