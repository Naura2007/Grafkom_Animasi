/* =============================================================================
   BACKGROUND.JS
   Semua elemen latar: langit, tanah, gunung, jalan, rumah, pohon, burung, sawah.
   Koordinat memakai kanvas 1000 x 650, titik (0,0) di kiri-atas, sumbu Y ke bawah.
   ============================================================================= */

// ---------- Deklarasi warna (format [r, g, b, alpha], tiap nilai 0..1) ----------
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
const PADDY_COLOR = [0.05, 0.05, 0.05, 1];

// Garis cakrawala: batas langit-tanah sekaligus alas gunung dan titik hilang jalan.
// Dijadikan satu konstanta supaya semua elemen ikut menyesuaikan jika diubah.
const HORIZON_Y = 330;

// ---------- Fungsi gambar ----------

// Langit: persegi panjang penuh (nanti ditimpa tanah di bagian bawah)
function drawSky() {
  drawRect(0, 0, canvas.width, canvas.height, SKY_COLOR);
}

// Tanah: persegi panjang dari cakrawala sampai bawah kanvas
function drawGround() {
  drawRect(0, HORIZON_Y, canvas.width, canvas.height - HORIZON_Y, GROUND_COLOR);
}

// Gunung: dua segitiga [alas kiri, puncak, alas kanan] yang saling tumpang-tindih
function drawMountains() {
  const mountainBaseY = HORIZON_Y + 0; // posisi alas gunung (bisa diturunkan dengan menambah nilai)
  // gunung kiri: puncak di x=345, alas dari x=0 sampai x=565
  drawPolygon([[0, mountainBaseY], [345, 80], [565, mountainBaseY]], MOUNTAIN_COLOR);
  // gunung kanan: puncak di x=705, alas dari x=440 sampai x=1000
  drawPolygon([[440, mountainBaseY], [705, 90], [1000, mountainBaseY]], MOUNTAIN_COLOR);
}

// Jalan: segitiga yang menyempit ke titik hilang di cakrawala + marka putus-putus
function drawRoad() {
  const vanishX = 500;                          // titik hilang jalan (x)
  const bottomLeftX = 220, bottomRightX = 430;  // lebar jalan di bawah kanvas

  drawPolygon(
    [[vanishX, HORIZON_Y], [bottomRightX, canvas.height], [bottomLeftX, canvas.height]],
    ROAD_COLOR
  );

  // Marka: t (0..1) = seberapa jauh sepanjang jalan; x & y diinterpolasi dari
  // titik hilang ke tengah bagian bawah jalan. Segmen hanya separuh (i + 0.5)
  // sehingga tercipta jeda kosong (putus-putus).
  const segments = 8;
  const midBottomX = (bottomLeftX + bottomRightX) / 2;
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 0.5) / segments;
    const x0 = vanishX + (midBottomX - vanishX) * t0;
    const x1 = vanishX + (midBottomX - vanishX) * t1;
    const y0 = HORIZON_Y + (canvas.height - HORIZON_Y) * t0;
    const y1 = HORIZON_Y + (canvas.height - HORIZON_Y) * t1;
    // makin dekat (t0 besar) garis makin tebal -> kesan perspektif
    drawLine(x0, y0, x1, y1, 1 + t0 * 4, ROAD_LINE_COLOR);
  }
}

// Rumah: dinding (persegi) + atap (segitiga) + jendela (persegi kecil, diulang)
function drawHouse() {
  const x = 545, y = 455, w = 230, h = 100; // posisi & ukuran dinding

  drawRect(x, y, w, h, HOUSE_WALL_COLOR);

  // atap: alasnya sedikit lebih lebar dari dinding, puncak di tengah
  drawPolygon([[x - 15, y], [x + w / 2, y - 100], [x + w + 15, y]], HOUSE_ROOF_COLOR);

  // jendela: 2 persegi berjajar, posisinya dihitung otomatis dari lebar & jarak
  const winW = 35, winH = 55, gap = 5;
  for (let i = 0; i < 2; i++) {
    drawRect(x + 20 + i * (winW + gap), y + h - winH - 15, winW, winH, HOUSE_WINDOW_COLOR);
  }
}

// Pohon: batang (persegi) + tajuk dari 5 lingkaran yang saling tumpang-tindih
function drawTree() {
  const trunkX = 855, trunkTopY = 400, trunkBotY = 560;
  drawRect(trunkX, trunkTopY, 20, trunkBotY - trunkTopY, TREE_TRUNK_COLOR);

  const cx = trunkX + 10, cy = 385; // titik acuan tajuk di atas batang
  drawCircle(cx - 50, cy + 15, 45, TREE_LEAF_COLOR);
  drawCircle(cx + 50, cy + 15, 45, TREE_LEAF_COLOR);
  drawCircle(cx, cy - 25, 50, TREE_LEAF_COLOR);
  drawCircle(cx - 30, cy + 50, 40, TREE_LEAF_COLOR);
  drawCircle(cx + 30, cy + 50, 40, TREE_LEAF_COLOR);
}

// Satu burung berbentuk "V" dari dua garis; (cx, cy) = titik tengah, size = lebar sayap
function drawBird(cx, cy, size) {
  drawLine(cx - size, cy + size * 0.25, cx, cy, 4, BIRD_COLOR);
  drawLine(cx, cy, cx + size, cy + size * 0.5, 4, BIRD_COLOR);
}

// Kumpulan burung di langit kiri-atas (posisi & ukuran berbeda-beda)
function drawBirds() {
  drawBird(120, 90, 18);
  drawBird(165, 70, 14);
  drawBird(90, 130, 12);
}

// Satu tanda rumpun padi berbentuk "V" (mirip centang) dari dua garis
function drawPaddy(cx, cy, size) {
  // garis kiri (turun ke titik bawah)
  drawLine(cx - size, cy - size * 0.4, cx, cy + size, 2.5, PADDY_COLOR);
  // garis kanan (naik dari titik bawah)
  drawLine(cx, cy + size, cx + size, cy - size * 0.4, 2.5, PADDY_COLOR);
}

// Sawah di kiri jalan: 4 baris, makin ke bawah (dekat) tanda makin besar
function drawPaddyField() {
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