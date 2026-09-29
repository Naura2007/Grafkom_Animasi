/* =============================================================================
   CAR.JS
   Mobil yang digerakkan dengan tombol panah. Semakin dekat ke cakrawala
   (jauh) mobil semakin kecil dan lambat; semakin ke bawah (dekat) semakin besar.
   ============================================================================= */

// ---------- Deklarasi objek mobil ----------
let carX = 500;                 // posisi dasar mobil (x) - titik tengah roda menyentuh jalan
let carY = 550;                 // posisi dasar mobil (y)
const CAR_SPEED = 100;          // kecepatan dasar (piksel/detik, pada skala 1)
let speed = 100;                // kecepatan saat ini (mengikuti skala)

// ---------- Input keyboard ----------
const keys = {};                // menyimpan status tombol yang sedang ditekan

window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

// ---------- Warna mobil ----------
const CAR_BODY_COLOR = [0.82, 0.16, 0.16, 1];
const CAR_WINDOW_COLOR = [0.75, 0.90, 0.95, 1];
const CAR_WHEEL_COLOR = [0.10, 0.10, 0.10, 1];

// Bentuk mobil sederhana dalam OBJECT SPACE: titik (0,0) = tengah bawah
// mobil (garis roda menyentuh jalan). Dipakai lewat modelMatrix supaya
// translasi (posisi) & skala (ukuran) tinggal digabung lewat m3, tidak perlu
// hitung ulang tiap titik secara manual.
function drawCarShape(modelMatrix) {
  // badan bawah mobil
  drawRect(-30, -22, 60, 22, CAR_BODY_COLOR, modelMatrix);
  // kabin/atap (trapesium supaya mengecil ke atas, kesan mobil bukan kotak)
  drawPolygon([[-18, -22], [-12, -38], [12, -38], [18, -22]], CAR_BODY_COLOR, modelMatrix);
  // kaca jendela di kabin
  drawPolygon([[-14, -24], [-9, -34], [9, -34], [14, -24]], CAR_WINDOW_COLOR, modelMatrix);
  // roda kiri & kanan, pusatnya digeser ke atas sejauh radius supaya bagian
  // bawah roda pas menyentuh y=0 (garis jalan)
  drawCircle(-18, -9, 9, CAR_WHEEL_COLOR, modelMatrix);
  drawCircle(18, -9, 9, CAR_WHEEL_COLOR, modelMatrix);
}

// Fungsi gambar: ukuran mobil bergantung pada jarak dari cakrawala
function drawCar() {
  const minScale = 0.1;           // skala di cakrawala (paling jauh)
  const maxScale = 2.0;           // skala di dasar kanvas (paling dekat)

  // interpolasi linear: posisi Y (HORIZON_Y..tinggi kanvas) -> skala (minScale..maxScale)
  const scale = minScale +
    ((carY - HORIZON_Y) / (canvas.height - HORIZON_Y)) *
    (maxScale - minScale);

  speed = CAR_SPEED * scale;      // makin jauh makin lambat (kesan perspektif)

  // gabung translasi (posisi mobil) + skala (ukuran mobil) jadi satu matriks
  const modelMatrix = m3.multiply(m3.translation(carX, carY), m3.scaling(scale, scale));
  drawCarShape(modelMatrix);
}

// Fungsi animasi: geser posisi mobil sesuai tombol panah.
// dt = selisih waktu antar frame (detik), supaya kecepatan konsisten di semua perangkat.
function updateCarTranslation(dt) {
  if (keys["arrowleft"]) {
    carX -= speed * dt;
  }
  if (keys["arrowup"]) {
    carY -= speed * dt;           // Y mengecil = naik (menuju cakrawala)
  }
  if (keys["arrowdown"]) {
    carY += speed * dt;
  }
  if (keys["arrowright"]) {
    carX += speed * dt;
  }

  // batasi gerak: tidak boleh lewat cakrawala ke atas atau keluar kanvas
  carY = Math.max(HORIZON_Y, carY);
  carX = Math.max(0, Math.min(canvas.width, carX));
  carY = Math.min(canvas.height, carY);
}