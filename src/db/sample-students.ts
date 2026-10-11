import type { NewStudent } from "@/features/students/add-student";

/*
 * Made-up people only. Every name is a mix of common given names and
 * family names, and every number is invented.
 */

export type SampleStudent = Omit<NewStudent, "studyProgramId"> & {
  /** The study program, by name, as the table changes add it. */
  studyProgram: string;
};

type Extra = Partial<
  Pick<
    SampleStudent,
    | "status"
    | "originAgency"
    | "isAffirmation"
    | "isSeedling"
    | "isInternational"
    | "isBlended"
  >
>;

/** One student in short. One with an instansi asal came by Alih program. */
type Row = [
  nim: string,
  name: string,
  sex: SampleStudent["sex"],
  cohortYear: number,
  className: string,
  province: string,
  extra?: Extra,
];

const ON_LEAVE: Extra = { status: "on_leave" };
const INACTIVE: Extra = { status: "inactive" };

function fromAgency(originAgency: string): Extra {
  return { originAgency, isBlended: true };
}

function inProgram(studyProgram: string, rows: Row[]): SampleStudent[] {
  return rows.map(
    ([nim, name, sex, cohortYear, className, province, extra = {}]) => ({
      nim,
      name,
      studyProgram,
      entryPath: extra.originAgency ? "transfer" : "regular",
      sex,
      cohortYear,
      className,
      province,
      ...extra,
    }),
  );
}

/** More made-up students, so that every filter of a list finds some. */
export const MORE_SAMPLE_STUDENTS: SampleStudent[] = [
  ...inProgram("Akuntansi Sektor Publik STR", [
    ["9900220019", "Arif Maulana", "male", 2022, "4-02", "Jawa Timur"],
    [
      "9900230020",
      "Bella Simanjuntak",
      "female",
      2023,
      "4-01",
      "Sumatera Utara",
      { isSeedling: true },
    ],
    ["9900250021", "Candra Wirawan", "male", 2025, "1-02", "Banten"],
    [
      "9900240022",
      "Desi Anggraini",
      "female",
      2024,
      "3-02",
      "Jawa Barat",
      fromAgency("Badan Pemeriksa Keuangan"),
    ],
    ["9900220023", "Erwin Sitompul", "male", 2022, "4-02", "Riau", INACTIVE],
  ]),
  ...inProgram("D3 Akuntansi", [
    ["9900250024", "Fitri Ramadhani", "female", 2025, "1-03", "Sumatera Barat"],
    [
      "9900250025",
      "Gilang Prakoso",
      "male",
      2025,
      "1-03",
      "Jawa Tengah",
      { isAffirmation: true },
    ],
    ["9900240026", "Hana Pertiwi", "female", 2024, "2-01", "Kalimantan Timur"],
    ["9900230027", "Irfan Hakim", "male", 2023, "3-02", "Sulawesi Tengah"],
    [
      "9900230028",
      "Jihan Maharani",
      "female",
      2023,
      "3-02",
      "DKI Jakarta",
      ON_LEAVE,
    ],
  ]),
  ...inProgram("D3 Kebendaharaan Negara", [
    ["9900250029", "Kevin Manurung", "male", 2025, "1-01", "Sumatera Utara"],
    ["9900240030", "Laras Widyastuti", "female", 2024, "2-02", "DI Yogyakarta"],
    [
      "9900240031",
      "Miko Tanjung",
      "male",
      2024,
      "2-02",
      "Kepulauan Riau",
      { isSeedling: true },
    ],
    ["9900230032", "Nia Kartika", "female", 2023, "3-04", "Jawa Barat"],
    ["9900220033", "Omar Fadillah", "male", 2022, "3-01", "Aceh", INACTIVE],
  ]),
  ...inProgram("D3 Kepabeanan dan Cukai", [
    ["9900250034", "Prita Damanik", "female", 2025, "1-02", "Sumatera Utara"],
    ["9900250035", "Reza Firmansyah", "male", 2025, "1-02", "Jawa Timur"],
    [
      "9900240036",
      "Salsa Oktaviani",
      "female",
      2024,
      "2-03",
      "Nusa Tenggara Barat",
      { isAffirmation: true },
    ],
    [
      "9900230037",
      "Tomi Hutagalung",
      "male",
      2023,
      "3-03",
      "Kepulauan Bangka Belitung",
    ],
    ["9900230038", "Ulfa Rosdiana", "female", 2023, "3-03", "Banten", ON_LEAVE],
  ]),
  ...inProgram("D3 Manajemen Aset", [
    ["9900250039", "Vino Ardiansyah", "male", 2025, "1-04", "Gorontalo"],
    ["9900240040", "Winda Sulistyowati", "female", 2024, "2-01", "Jawa Tengah"],
    [
      "9900240041",
      "Yoga Pangaribuan",
      "male",
      2024,
      "2-01",
      "Sumatera Selatan",
    ],
    [
      "9900250042",
      "Zahra Amelia",
      "female",
      2025,
      "1-04",
      "Luar negeri",
      { isInternational: true },
    ],
  ]),
  ...inProgram("D3 PBB/Penilai", [
    ["9900250043", "Adit Nugraha", "male", 2025, "1-05", "Jawa Barat"],
    ["9900240044", "Bunga Silalahi", "female", 2024, "2-02", "Sumatera Utara"],
    ["9900230045", "Coki Marpaung", "male", 2023, "3-01", "Jambi"],
    ["9900220046", "Dewi Anjarwati", "female", 2022, "3-01", "Bali", INACTIVE],
  ]),
  ...inProgram("D3 Pajak", [
    ["9900250047", "Elang Mahardika", "male", 2025, "1-06", "Jawa Timur"],
    ["9900250048", "Farah Nabilah", "female", 2025, "1-06", "DKI Jakarta"],
    [
      "9900250049",
      "Gery Sinaga",
      "male",
      2025,
      "1-07",
      "Sumatera Utara",
      { isSeedling: true },
    ],
    ["9900240050", "Hesti Wulandari", "female", 2024, "2-04", "Jawa Tengah"],
    [
      "9900240051",
      "Ilham Suryadi",
      "male",
      2024,
      "2-05",
      "Maluku",
      { isAffirmation: true },
    ],
    ["9900230052", "Julia Tambunan", "female", 2023, "3-05", "Riau"],
    ["9900230053", "Krisna Aditama", "male", 2023, "3-05", "Bali", ON_LEAVE],
    [
      "9900220054",
      "Lidya Napitupulu",
      "female",
      2022,
      "3-06",
      "Lampung",
      INACTIVE,
    ],
  ]),
  ...inProgram("Manajemen Aset Publik STR", [
    [
      "9900240055",
      "Mario Tampubolon",
      "male",
      2024,
      "3-01",
      "DKI Jakarta",
      fromAgency("Direktorat Jenderal Kekayaan Negara"),
    ],
    [
      "9900250056",
      "Nurul Hasanati",
      "female",
      2025,
      "1-01",
      "Kalimantan Selatan",
    ],
    ["9900230057", "Pandu Wicaksono", "male", 2023, "4-01", "DI Yogyakarta"],
    [
      "9900250058",
      "Qori Azzahra",
      "female",
      2025,
      "1-01",
      "Luar negeri",
      { isInternational: true },
    ],
  ]),
  ...inProgram("Manajemen Keuangan Negara STR", [
    [
      "9900250059",
      "Rendi Situmorang",
      "male",
      2025,
      "1-02",
      "Sumatera Utara",
      { originAgency: "Direktorat Jenderal Anggaran" },
    ],
    [
      "9900240060",
      "Sekar Ayuningtyas",
      "female",
      2024,
      "3-03",
      "Jawa Timur",
      fromAgency("Direktorat Jenderal Bea dan Cukai"),
    ],
    [
      "9900230061",
      "Tio Panjaitan",
      "male",
      2023,
      "4-03",
      "Papua Barat",
      { isAffirmation: true },
    ],
    [
      "9900220062",
      "Vania Kusnadi",
      "female",
      2022,
      "4-03",
      "Sulawesi Tenggara",
      ON_LEAVE,
    ],
  ]),
];
