/* =============================================================================
   BACKGROUND.JS
   -----------------------------------------------------------------------------
   Semua fungsi di sini cuma memanggil drawPolygon / drawCircle / drawRect /
   drawLine dari engine.js dengan koordinat & warna yang sudah ditentukan.
   Koordinat pakai "kanvas 1000 x 650", (0,0) di KIRI-ATAS, sumbu Y ke BAWAH.
   ============================================================================= */

// ---- Warna-warna dipisah jadi konstanta di atas, supaya gampang diubah
// dan gampang dibaca (dibanding angka RGB acak ditulis langsung di tengah kode)
const SKY_COLOR = [0.63, 0.85, 0.93, 1];
const GROUND_COLOR = [0.77, 0.89, 0.70, 1];
const MOUNTAIN_COLOR = [0.53, 0.44, 0.37, 1];
const ROAD_COLOR = [0.72, 0.74, 0.72, 1];
const ROAD_LINE_COLOR = [1, 1, 1, 1];
const HOUSE_WALL_COLOR = [1, 1, 1, 1];
const HOUSE_ROOF_COLOR = [0.82, 0.22, 0.18, 1];
const HOUSE_WINDOW_COLOR = [0.98, 0.93, 0.66, 1];
const TREE_LEAF_COLOR = [0.27, 0.62, 0.24, 1];
const TREE_TRUNK_COLOR = [0.30, 0.20, 0.10, 1];
const BIRD_COLOR = [0.05, 0.05, 0.05, 1];
PADDY_COLOR = [0.05, 0.05, 0.05, 1];

// garis cakrawala: tempat langit bertemu tanah, dan alas gunung menempel di sini.
// dipakai berkali-kali di banyak fungsi, makanya dijadikan satu konstanta
// supaya kalau diubah, semua elemen ikut menyesuaikan otomatis.
const HORIZON_Y = 330;

// -----------------------------------------------------------------------------
// LANGIT: cuma persegi panjang selebar & setinggi bagian atas kanvas.
// -----------------------------------------------------------------------------
function drawSky() {
  drawRect(0, 0, canvas.width, canvas.height, SKY_COLOR);
}

// -----------------------------------------------------------------------------
// TANAH: persegi panjang dari garis cakrawala sampai bawah kanvas.
// Digambar SETELAH langit, supaya menimpa bagian bawah langit.
// -----------------------------------------------------------------------------
function drawGround() {
  drawRect(0, HORIZON_Y, canvas.width, canvas.height - HORIZON_Y, GROUND_COLOR);
}

// -----------------------------------------------------------------------------
// GUNUNG: dua segitiga sederhana (drawPolygon dengan 3 titik).
// Tiap segitiga = [titik alas kiri, titik puncak, titik alas kanan].
// Alasnya sama-sama di HORIZON_Y supaya "menempel" rata dengan tanah,
// dan kedua alas gunung saling tumpang-tindih di tengah supaya terlihat
// seperti dua gunung yang berhimpitan (seperti di gambar referensi).
// -----------------------------------------------------------------------------
function drawMountains() {
  const mountainBaseY = HORIZON_Y + 0;
  // gunung kiri: puncak di x=345, alas dari x=0 sampai x=565
  drawPolygon([[0, mountainBaseY], [345, 80], [565, mountainBaseY]], MOUNTAIN_COLOR);
  // gunung kanan: puncak di x=705, alas dari x=440 sampai x=1000
  drawPolygon([[440, mountainBaseY], [705, 90], [1000, mountainBaseY]], MOUNTAIN_COLOR);
}

// -----------------------------------------------------------------------------
// JALAN: satu trapesium (drawPolygon 3-4 titik) yang menyempit ke satu titik
// di cakrawala (efek perspektif sederhana: makin jauh makin sempit),
// ditambah garis putus-putus di tengahnya.
// -----------------------------------------------------------------------------
function drawRoad() {
  const vanishX = 500;              // titik hilang jalan, di cakrawala
  const bottomLeftX = 220, bottomRightX = 430; // lebar jalan di bagian bawah kanvas

  drawPolygon(
    [[vanishX, HORIZON_Y], [bottomRightX, canvas.height], [bottomLeftX, canvas.height]],
    ROAD_COLOR
  );

  // garis putus-putus: bikin beberapa GARIS PENDEK (bukan satu garis panjang)
  // dengan jarak kosong di antaranya, sepanjang tengah jalan.
  // t (0..1) menyatakan "seberapa jauh sepanjang jalan", lalu posisi x & y
  // dihitung interpolasi (campuran) antara titik atas dan titik bawah jalan.
  const segments = 8;
  const midBottomX = (bottomLeftX + bottomRightX) / 2;
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 0.5) / segments; // cuma separuh segmen -> jadi putus-putus
    const x0 = vanishX + (midBottomX - vanishX) * t0;
    const x1 = vanishX + (midBottomX - vanishX) * t1;
    const y0 = HORIZON_Y + (canvas.height - HORIZON_Y) * t0;
    const y1 = HORIZON_Y + (canvas.height - HORIZON_Y) * t1;
    // garis makin tebal makin ke bawah (t0 makin besar) -> kesan perspektif
    drawLine(x0, y0, x1, y1, 1 + t0 * 4, ROAD_LINE_COLOR);
  }
}

// -----------------------------------------------------------------------------
// RUMAH: gabungan 3 bentuk dasar -> dinding (kotak) + atap (segitiga) +
// jendela (beberapa kotak kecil, dibuat dengan for-loop biar tidak menulis
// drawRect() berulang-ulang manual).
// -----------------------------------------------------------------------------
function drawHouse() {
  const x = 545, y = 455, w = 230, h = 100; // posisi & ukuran dinding

  drawRect(x, y, w, h, HOUSE_WALL_COLOR);

  // atap: segitiga yang alasnya sedikit lebih lebar dari dinding (overhang)
  // dan puncaknya di tengah, di atas dinding
  drawPolygon([[x - 15, y], [x + w / 2, y - 100], [x + w + 15, y]], HOUSE_ROOF_COLOR);

  // jendela: 3 kotak sama besar berjajar, jaraknya dihitung otomatis
  const winW = 35, winH = 55, gap = 5; //ukuran setiap kotak jendelanya
  for (let i = 0; i < 2; i++) { //banyak kotak jendelanya
    drawRect(x + 20 + i * (winW + gap), y + h - winH - 15, winW, winH, HOUSE_WINDOW_COLOR);
  }
}

// -----------------------------------------------------------------------------
// POHON: batang (kotak tipis) + tajuk daun dari BEBERAPA lingkaran yang
// sengaja saling tumpang-tindih, supaya bentuknya seperti gumpalan awan,
// bukan satu lingkaran bulat sempurna yang terlihat kaku.
// -----------------------------------------------------------------------------
function drawTree() {
  const trunkX = 855, trunkTopY = 400, trunkBotY = 560;
  drawRect(trunkX, trunkTopY, 20, trunkBotY - trunkTopY, TREE_TRUNK_COLOR);

  // titik acuan tajuk = di atas batang
  const cx = trunkX + 10, cy = 385;
  // 5 lingkaran diposisikan menyebar (kiri, kanan, atas, kiri-bawah, kanan-bawah)
  // supaya siluetnya menggerombol, bukan cuma satu lingkaran polos
  drawCircle(cx - 50, cy + 15, 45, TREE_LEAF_COLOR);
  drawCircle(cx + 50, cy + 15, 45, TREE_LEAF_COLOR);
  drawCircle(cx, cy - 25, 50, TREE_LEAF_COLOR);
  drawCircle(cx - 30, cy + 50, 40, TREE_LEAF_COLOR); 
  drawCircle(cx + 30, cy + 50, 40, TREE_LEAF_COLOR);
}

// -----------------------------------------------------------------------------
// BURUNG: bentuk "V" sederhana dari 2 garis. Dibuat sebagai SATU fungsi
// drawBird(cx, cy, size) yang bisa dipanggil berkali-kali dengan posisi &
// ukuran berbeda-beda dari drawBirds() — supaya tidak perlu menulis ulang
// kode yang sama untuk tiap burung.
// -----------------------------------------------------------------------------
function drawBird(cx, cy, size) {
  drawLine(cx - size, cy + size * 0.25, cx, cy, 4, BIRD_COLOR);
  drawLine(cx, cy, cx + size, cy + size * 0.5, 4, BIRD_COLOR);
}

function drawBirds() {
  // panggil drawBird() beberapa kali dengan posisi & ukuran berbeda.
  // tambah/kurangi/geser sesuai jumlah & posisi burung di referensimu.
  drawBird(120, 90, 18);
  drawBird(165, 70, 14);
  drawBird(90, 130, 12);
}

function drawPaddy(cx, cy, size) {

  // garis kiri
  drawLine(
    cx - size,
    cy - size * 0.4,
    cx,
    cy + size,
    2.5,
    PADDY_COLOR
  );

  // garis kanan
  drawLine(
    cx,
    cy + size,
    cx + size,
    cy - size * 0.4,
    2.5,
    PADDY_COLOR
  );
}

function drawPaddyField() {

  // const startX = 80;
  // const startY = 370;

  // Baris paling dekat horizon
  drawPaddy(145, 370, 8);
  drawPaddy(205, 385, 10);
  drawPaddy(270, 375, 8);
  drawPaddy(335, 395, 10);

  // Baris kedua
  drawPaddy(110, 420, 11);
  drawPaddy(175, 435, 13);
  drawPaddy(245, 425, 11);
  drawPaddy(315, 445, 13);

  // Baris ketiga
  drawPaddy(85, 480, 14);
  drawPaddy(155, 495, 16);
  drawPaddy(225, 485, 15);
  drawPaddy(295, 510, 17);

  // Baris paling dekat
  drawPaddy(105, 550, 18);
  drawPaddy(185, 565, 20);
  drawPaddy(270, 550, 19);
}