// Pendaftaran bidan belum ada di dokumen arsitektur v2.0 (keputusan terbuka nomor 5).
// Set REGISTRATION_ENABLED=false untuk menyembunyikan seluruh tombol dan halaman Daftar.
export const registrationEnabled = () => process.env.REGISTRATION_ENABLED !== "false";
