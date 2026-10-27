// Konfigurasi Lokasi Resmi Kantor PTPN IV Regional 3
// Alamat: Jl. Rambutan No. 43, Sidomulyo Timur, Kec. Marpoyan Damai, Kota Pekanbaru, Riau 28284

export const PTPN_LOCATION = {
  name: 'Kantor Direksi PTPN IV Regional 3',
  shortName: 'PTPN IV Regional 3',
  company: 'PT Perkebunan Nusantara IV (Regional 3)',
  address: 'Jl. Rambutan No. 43, Sidomulyo Timur, Kec. Marpoyan Damai, Pekanbaru, Riau 28284',
  latitude: 0.4701423,
  longitude: 101.4262207,
  defaultRadiusMeters: 250, // Radius toleransi kehadiran dalam meter (misal 250 meter)
};

// Preset lokasi untuk simulasi pengujian (Demo & Development Mode)
export const SIMULATION_PRESETS = [
  {
    id: 'real',
    label: '🌐 GPS Riil Perangkat Anda',
    description: 'Menggunakan sensor GPS asli dari browser / smartphone Anda',
    isSimulation: false,
  },
  {
    id: 'lobi_utama',
    label: '📍 Lobi Utama & Gedung Direksi PTPN IV Reg 3',
    description: 'Berada tepat di dalam gedung utama (Jarak: ~15m)',
    latitude: 0.470195,
    longitude: 101.426280,
    isSimulation: true,
  },
  {
    id: 'gerbang_rambutan',
    label: '📍 Pos Satpam / Gerbang Depan Jl. Rambutan',
    description: 'Berada di area gerbang masuk utama (Jarak: ~85m)',
    latitude: 0.470720,
    longitude: 101.426510,
    isSimulation: true,
  },
  {
    id: 'divisi_ti',
    label: '📍 Divisi TI & Transformasi Digital (Gedung B)',
    description: 'Berada di area kantor TI & Akuntansi (Jarak: ~130m)',
    latitude: 0.469510,
    longitude: 101.425890,
    isSimulation: true,
  },
  {
    id: 'bandara_ssq',
    label: '⚠️ Luar Area: Bandara Sultan Syarif Kasim II',
    description: 'Terlalu jauh dari kantor (~3.4 km) - Menolak Absensi',
    latitude: 0.461140,
    longitude: 101.446850,
    isSimulation: true,
  },
  {
    id: 'unri_panam',
    label: '⚠️ Luar Area: Kampus Universitas Riau (UNRI Panam)',
    description: 'Terlalu jauh dari kantor (~9.5 km) - Menolak Absensi',
    latitude: 0.478950,
    longitude: 101.378900,
    isSimulation: true,
  },
];

export const DEFAULT_INTERN_PROFILE = {
  nama: 'Rini Anggraini',
  nim: '220401045',
  instansi: 'Universitas Riau (UNRI)',
  jurusan: 'Sistem Informasi',
  divisi: 'Divisi TI & Transformasi Digital',
  pembimbing: 'Bpk. Hendra Saputra, S.T., M.Kom',
  periode: 'Juli - Oktober 2026',
};
