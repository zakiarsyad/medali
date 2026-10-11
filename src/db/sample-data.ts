import type { RoleId } from "@/auth/role-ids";
import type { ValueKey } from "@/ui/medali-values";
import { MORE_SAMPLE_STUDENTS, type SampleStudent } from "./sample-students";

/*
 * Made-up people only. Every name is a mix of common given names and
 * family names, and every number is invented.
 */

export interface SampleAccount {
  name: string;
  title: string;
  roles: RoleId[];
  unit: string;
  /** The study program of a head of a study program, by name. */
  studyProgram?: string;
}

const UPK = "Unit Pembangunan Karakter";
const BAM = "Badan Asrama Mahasiswa";

/** The first account is the sample Kepala Unit, who adds all the others. */
export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  {
    name: "Ratna Kusumawati",
    title: "M.Si.",
    roles: ["head_of_unit"],
    unit: UPK,
  },
  {
    name: "Bambang Setiadi",
    title: "Ph.D.",
    roles: ["director"],
    unit: "Wakil Direktur III",
  },
  {
    name: "Wulan Anggraeni",
    title: "M.Ak.",
    roles: ["head_of_program"],
    unit: "Ketua Program Studi D3 Pajak",
    studyProgram: "D3 Pajak",
  },
  { name: "Hendra Wijaya", title: "S.E., M.M.", roles: ["mentor"], unit: UPK },
  {
    name: "Maya Puspitasari",
    title: "S.Psi.",
    roles: ["dorm_manager"],
    unit: "Pengelola Asrama",
  },
  {
    name: "Rizky Pratama",
    title: "",
    roles: ["bam_bphk"],
    unit: `${BAM} - BPHK`,
  },
  {
    name: "Nadia Lestari",
    title: "",
    roles: ["bam_compliance"],
    unit: `${BAM} - KI`,
  },
  {
    name: "Fajar Nugroho",
    title: "",
    roles: ["bam_household"],
    unit: `${BAM} - Kerumahtanggaan`,
  },
  {
    name: "Aisyah Rahmawati",
    title: "",
    roles: ["bam_spiritual"],
    unit: `${BAM} - Kerohanian`,
  },
  {
    name: "Dimas Saputra",
    title: "",
    roles: ["bam_catering"],
    unit: `${BAM} - Konsumsi`,
  },
  {
    name: "Putri Handayani",
    title: "",
    roles: ["bam_arts_sports"],
    unit: `${BAM} - Senipora`,
  },
  {
    name: "Galih Permana",
    title: "",
    roles: ["bam_health"],
    unit: `${BAM} - Kesehatan`,
  },
  { name: "Sri Wahyuningsih", title: "S.E.", roles: ["upk_staff"], unit: UPK },
  {
    name: "Indah Permatasari",
    title: "M.Psi., Psikolog",
    roles: ["counsellor"],
    unit: "Layanan Konseling Mahasiswa",
  },
  {
    name: "Agus Hermawan",
    title: "S.H.",
    roles: ["discipline_officer"],
    unit: UPK,
  },
  { name: "Lina Marlina", title: "M.Ak.", roles: ["assessor"], unit: UPK },
  {
    name: "Yusuf Hidayat",
    title: "S.E., M.Si.",
    roles: ["upk_staff", "counsellor"],
    unit: UPK,
  },
];

/** Two made-up students in each study program, then the rest. */
export const SAMPLE_STUDENTS: SampleStudent[] = [
  {
    nim: "9900230001",
    name: "Ayu Lestiani",
    studyProgram: "Akuntansi Sektor Publik STR",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2023,
    className: "4-01",
    province: "Jawa Barat",
    isAffirmation: true,
  },
  {
    nim: "9900240002",
    name: "Bayu Santoso",
    studyProgram: "Akuntansi Sektor Publik STR",
    entryPath: "transfer",
    sex: "male",
    cohortYear: 2024,
    className: "3-02",
    province: "Riau",
    originAgency: "Direktorat Jenderal Pajak",
    isBlended: true,
  },
  {
    nim: "9900250003",
    name: "Citra Nasution",
    studyProgram: "D3 Akuntansi",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2025,
    className: "1-03",
    province: "Sumatera Utara",
  },
  {
    nim: "9900240004",
    name: "Dimas Halim",
    studyProgram: "D3 Akuntansi",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2024,
    className: "2-01",
    province: "DKI Jakarta",
    status: "on_leave",
  },
  {
    nim: "9900250005",
    name: "Eka Siregar",
    studyProgram: "D3 Kebendaharaan Negara",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2025,
    className: "1-01",
    province: "Jawa Tengah",
    isSeedling: true,
  },
  {
    nim: "9900230006",
    name: "Fikri Wibowo",
    studyProgram: "D3 Kebendaharaan Negara",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2023,
    className: "3-04",
    province: "Jawa Timur",
  },
  {
    nim: "9900250007",
    name: "Gita Purba",
    studyProgram: "D3 Kepabeanan dan Cukai",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2025,
    className: "1-02",
    province: "Kalimantan Barat",
    isAffirmation: true,
  },
  {
    nim: "9900240008",
    name: "Hadi Kurniawan",
    studyProgram: "D3 Kepabeanan dan Cukai",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2024,
    className: "2-03",
    province: "Bali",
  },
  {
    nim: "9900250009",
    name: "Intan Harahap",
    studyProgram: "D3 Manajemen Aset",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2025,
    className: "1-04",
    province: "Sulawesi Selatan",
    isInternational: true,
  },
  {
    nim: "9900230010",
    name: "Joko Sembiring",
    studyProgram: "D3 Manajemen Aset",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2023,
    className: "3-01",
    province: "Lampung",
    status: "inactive",
  },
  {
    nim: "9900240011",
    name: "Kirana Utomo",
    studyProgram: "D3 PBB/Penilai",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2024,
    className: "2-02",
    province: "DI Yogyakarta",
  },
  {
    nim: "9900250012",
    name: "Lutfi Tarigan",
    studyProgram: "D3 PBB/Penilai",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2025,
    className: "1-05",
    province: "Aceh",
  },
  {
    nim: "9900250013",
    name: "Mega Saragih",
    studyProgram: "D3 Pajak",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2025,
    className: "1-06",
    province: "Banten",
  },
  {
    nim: "9900240014",
    name: "Nanda Gunawan",
    studyProgram: "D3 Pajak",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2024,
    className: "2-04",
    province: "Papua",
    isAffirmation: true,
  },
  {
    nim: "9900240015",
    name: "Oki Rahayu",
    studyProgram: "Manajemen Aset Publik STR",
    entryPath: "transfer",
    sex: "male",
    cohortYear: 2024,
    className: "3-01",
    province: "Jawa Barat",
    originAgency: "Direktorat Jenderal Perbendaharaan",
    isBlended: true,
  },
  {
    nim: "9900250016",
    name: "Rani Pane",
    studyProgram: "Manajemen Aset Publik STR",
    entryPath: "regular",
    sex: "female",
    cohortYear: 2025,
    className: "1-01",
    province: "Sumatera Barat",
  },
  {
    nim: "9900250017",
    name: "Sinta Susanto",
    studyProgram: "Manajemen Keuangan Negara STR",
    entryPath: "transfer",
    sex: "female",
    cohortYear: 2025,
    className: "1-02",
    province: "Jawa Tengah",
    originAgency: "Badan Kebijakan Fiskal",
  },
  {
    nim: "9900230018",
    name: "Teguh Lubis",
    studyProgram: "Manajemen Keuangan Negara STR",
    entryPath: "regular",
    sex: "male",
    cohortYear: 2023,
    className: "4-03",
    province: "Sulawesi Utara",
  },
  ...MORE_SAMPLE_STUDENTS,
];

export interface SamplePpksActivity {
  semester: number;
  name: string;
  valueKeys: ValueKey[];
  indicatorCodes: string[];
  targetParticipants: number | null;
  isRequired: boolean;
  description: string;
}

/** A few made-up PPKS activities. Semester 8 has none, to show an empty list. */
export const SAMPLE_PPKS_ACTIVITIES: SamplePpksActivity[] = [
  {
    semester: 1,
    name: "Orientasi kehidupan kampus",
    valueKeys: ["D", "A"],
    indicatorCodes: ["D1", "A1"],
    targetParticipants: 120,
    isRequired: true,
    description: "Pengenalan tata tertib kampus dan asrama.",
  },
  {
    semester: 1,
    name: "Pelatihan mengatur waktu dan keuangan pribadi",
    valueKeys: ["M"],
    indicatorCodes: ["M1"],
    targetParticipants: null,
    isRequired: true,
    description: "",
  },
  {
    semester: 2,
    name: "Bakti sosial lingkungan kampus",
    valueKeys: ["E", "L"],
    indicatorCodes: ["E1", "L1"],
    targetParticipants: 60,
    isRequired: false,
    description: "Kerja bakti bersama warga sekitar kampus.",
  },
  {
    semester: 3,
    name: "Latihan dasar kepemimpinan organisasi",
    valueKeys: ["M", "D"],
    indicatorCodes: ["M2", "D2"],
    targetParticipants: 110,
    isRequired: true,
    description: "Latihan memimpin rapat dan membagi tugas.",
  },
  {
    semester: 4,
    name: "Kerja kelompok lintas program studi",
    valueKeys: ["E", "A"],
    indicatorCodes: ["E2", "A2"],
    targetParticipants: null,
    isRequired: true,
    description: "Proyek kelompok dengan anggota dari program studi lain.",
  },
  {
    semester: 5,
    name: "Pembekalan praktik kerja lapangan",
    valueKeys: ["D", "A"],
    indicatorCodes: ["D3", "A3"],
    targetParticipants: 100,
    isRequired: true,
    description: "Persiapan sikap kerja sebelum praktik di lapangan.",
  },
  {
    semester: 6,
    name: "Pengabdian kepada masyarakat",
    valueKeys: ["E"],
    indicatorCodes: ["E3"],
    targetParticipants: 100,
    isRequired: false,
    description: "",
  },
  {
    semester: 7,
    name: "Seminar integritas dan antikorupsi",
    valueKeys: ["I", "L"],
    indicatorCodes: ["I4", "L4"],
    targetParticipants: 95,
    isRequired: true,
    description: "Bekal integritas menjelang penempatan.",
  },
];
