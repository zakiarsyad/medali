import type { ValueKey } from "@/ui/medali-values";

/** The kegiatan acuan and the text one nilai starts with at one tahap. */
type Start = readonly [activity: string, text: string];

/** The content the breakdown starts with, from the prototype, by tahap. */
export const STARTING_BREAKDOWNS: readonly Record<ValueKey, Start>[] = [
  {
    M: [
      "Manajemen diri mahasiswa baru",
      "Lokakarya mengatur waktu, keuangan pribadi, dan target belajar semester.",
    ],
    E: [
      "Kelompok sebaya lintas daerah",
      "Kelompok kecil campuran asal daerah untuk saling mengenal latar belakang.",
    ],
    D: [
      "Pembiasaan tata tertib kampus",
      "Apel pagi, tata busana, dan kehadiran kuliah minimal 90%.",
    ],
    A: [
      "Orientasi kehidupan kampus kedinasan",
      "Pengenalan sistem akademik, ruang belajar, dan budaya kerja Kemenkeu.",
    ],
    L: [
      "Sejarah dan peran Kemenkeu",
      "Kuliah umum pejabat Kemenkeu dan kunjungan museum keuangan.",
    ],
    I: [
      "Kejujuran akademik",
      "Pakta integritas, anti-plagiarisme, dan aturan ujian.",
    ],
  },
  {
    M: [
      "Proyek mandiri berbasis minat",
      "Mahasiswa merancang proyek kecil sesuai minat keilmuan.",
    ],
    E: [
      "Pengabdian masyarakat",
      "Pendampingan literasi keuangan bagi UMKM dan sekolah sekitar.",
    ],
    D: [
      "Kepanitiaan dan organisasi",
      "Tanggung jawab peran dalam kepanitiaan kampus.",
    ],
    A: [
      "Pembelajaran berbasis kasus",
      "Studi kasus perubahan regulasi keuangan negara.",
    ],
    L: [
      "Kebanggaan almamater",
      "Keterlibatan dalam kegiatan dies natalis dan alumni.",
    ],
    I: [
      "Studi kasus gratifikasi",
      "Diskusi kelompok bersama narasumber dari Itjen Kemenkeu.",
    ],
  },
  {
    M: [
      "Praktik kerja lapangan",
      "Penempatan di unit Kemenkeu dengan supervisi mentor.",
    ],
    E: [
      "Pelayanan publik",
      "Simulasi dan praktik layanan prima kepada wajib pajak atau pengguna jasa.",
    ],
    D: [
      "Etos kerja profesional",
      "Kedisiplinan selama PKL sesuai aturan jam kerja instansi.",
    ],
    A: ["Inovasi layanan", "Kompetisi ide perbaikan proses bisnis instansi."],
    L: [
      "Kepemimpinan organisasi",
      "Memimpin unit kegiatan atau kepanitiaan besar.",
    ],
    I: [
      "Kode etik ASN",
      "Pembelajaran kode etik dan perilaku pegawai Kemenkeu.",
    ],
  },
  {
    M: [
      "Rencana karier ASN",
      "Penyusunan rencana pengembangan diri lima tahun pertama.",
    ],
    E: [
      "Mentoring adik tingkat",
      "Menjadi mentor kelompok mahasiswa tahap pembentukan.",
    ],
    D: [
      "Kesiapan penempatan",
      "Pembekalan aturan kepegawaian dan disiplin PNS.",
    ],
    A: [
      "Transformasi digital Kemenkeu",
      "Pengenalan sistem informasi dan cara kerja baru di instansi.",
    ],
    L: ["Sumpah dan janji jabatan", "Refleksi makna pengabdian kepada negara."],
    I: ["Zona integritas", "Peran calon pegawai dalam membangun WBK/WBBM."],
  },
];
