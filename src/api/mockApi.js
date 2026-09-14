// mockApi.js
// Simulasi pemanggilan data API asinkron (menggantikan backend sungguhan).
// Menggunakan pola async/await + Promise + delay, sesuai poin rubrik
// "Simulasi Asinkronis Data API" pada modul praktikum Bab 5.

const DELAY_MS = 900;

// --- Dummy "database" di memori ---
const PATIENTS = [
  { id: 'B', name: 'Ibu B', age: 29, week: 32, sistolik: 142, diastolik: 92, status: 'tinggi', complaint: 'sakit kepala hebat, pandangan kabur', riskScore: 78 },
  { id: 'C', name: 'Ibu C', age: 27, week: 28, sistolik: 132, diastolik: 86, status: 'sedang', complaint: 'tren naik 3 hari berturut', riskScore: 54 },
  { id: 'D', name: 'Ibu D', age: 24, week: 20, sistolik: 118, diastolik: 78, status: 'rendah', complaint: '-', riskScore: 18 },
  { id: 'E', name: 'Ibu E', age: 31, week: 24, sistolik: 124, diastolik: 80, status: 'rendah', complaint: '-', riskScore: 22 },
  { id: 'F', name: 'Ibu F', age: 26, week: 30, sistolik: 136, diastolik: 88, status: 'sedang', complaint: '-', riskScore: 47 },
];

const HISTORY = {
  B: [
    { date: '14 Agu', sistolik: 118, diastolik: 76, complaint: 'Tidak ada', severity: 'none' },
    { date: '15 Agu', sistolik: 120, diastolik: 77, complaint: 'Tidak ada', severity: 'none' },
    { date: '16 Agu', sistolik: 122, diastolik: 78, complaint: 'Tidak ada', severity: 'none' },
    { date: '17 Agu', sistolik: 126, diastolik: 80, complaint: 'Sedikit pusing', severity: 'mild' },
    { date: '18 Agu', sistolik: 131, diastolik: 84, complaint: 'Pusing, kaki sedikit bengkak', severity: 'mild' },
    { date: '19 Agu', sistolik: 136, diastolik: 88, complaint: 'Sakit kepala, kaki bengkak', severity: 'severe' },
    { date: '20 Agu', sistolik: 142, diastolik: 92, complaint: 'Sakit kepala hebat, pandangan kabur', severity: 'severe' },
  ],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ambil daftar seluruh pasien binaan.
 * @param {{ simulateError?: boolean }} options
 */
export async function fetchPatients({ simulateError = false } = {}) {
  await delay(DELAY_MS);
  if (simulateError) {
    throw new Error('Gagal memuat data pasien. Periksa koneksi ke server dan coba lagi.');
  }
  return PATIENTS;
}

/**
 * Ambil detail + riwayat tren tekanan darah seorang pasien.
 */
export async function fetchPatientDetail(patientId, { simulateError = false } = {}) {
  await delay(DELAY_MS);
  if (simulateError) {
    throw new Error('Gagal memuat riwayat pasien. Coba lagi beberapa saat.');
  }
  const patient = PATIENTS.find((p) => p.id === patientId);
  if (!patient) {
    throw new Error(`Data pasien dengan id "${patientId}" tidak ditemukan.`);
  }
  return {
    patient,
    history: HISTORY[patientId] ?? [],
  };
}

/**
 * Kirim (simulasi) hasil pemeriksaan baru ke server.
 */
export async function submitExamResult(payload, { simulateError = false } = {}) {
  await delay(DELAY_MS);
  if (simulateError) {
    throw new Error('Gagal menyimpan catatan periksa. Data belum tersimpan di server.');
  }
  // Di dunia nyata: POST ke backend, di sini hanya divalidasi & dikembalikan.
  return { ok: true, savedAt: new Date().toISOString(), data: payload };
}
