/* =============================================================================
   SUN.JS
   Matahari (statis) dan sinar berbentuk segitiga yang mengorbit sambil berotasi.
   ============================================================================= */

// ---------- Deklarasi objek matahari ----------
const SUN_X = 510;                        // pusat matahari (x)
const SUN_Y = 210;                        // pusat matahari (y)
const SUN_RADIUS = 65;
const SUN_COLOR = [0.98, 0.80, 0.20, 1];

// ---------- Deklarasi objek sinar ----------
const RAY_COUNT = 8;                      // jumlah sinar
const RAY_DISTANCE = 95;                  // jarak orbit sinar dari pusat matahari
const RAY_SIZE = 15;                      // ukuran segitiga sinar

// Fungsi gambar: piringan matahari (tidak bergerak)
function drawSun(time) {
  drawCircle(SUN_X, SUN_Y, SUN_RADIUS, SUN_COLOR);
}

// Fungsi animasi: tiap sinar mengorbit matahari dan ikut berotasi.
// time = waktu dalam detik dari render loop; sudut bertambah seiring waktu.
function drawSunRays(time) {
  for (let i = 0; i < RAY_COUNT; i++) {
    // sudut orbit: tiap sinar diberi jarak sudut yang sama rata (360 derajat / jumlah sinar)
    const angle = time + (i / RAY_COUNT) * Math.PI * 2;

    // posisi sinar pada lingkaran orbit
    const x = SUN_X + Math.cos(angle) * RAY_DISTANCE;
    const y = SUN_Y + Math.sin(angle) * RAY_DISTANCE;

    // bentuk segitiga dengan pusat di (0, 0) supaya rotasi terjadi di tempat
    const triangle = [
      [0, -RAY_SIZE],
      [-RAY_SIZE, RAY_SIZE],
      [RAY_SIZE, RAY_SIZE]
    ];

    // transformasi: rotasi dulu (puncak segitiga menghadap keluar), lalu translasi ke posisi orbit
    const rotation = m3.rotation(angle + Math.PI / 2);
    const translation = m3.translation(x, y);
    const transform = m3.multiply(translation, rotation);

    drawPolygon(triangle, SUN_COLOR, transform);
  }
}