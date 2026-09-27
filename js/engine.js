/* =============================================================================
   ENGINE.JS
   Ini "mesin" dasar WebGL yang dipakai bersama (kamu & temanmu).
   Isinya: compile shader, matriks 2D, dan fungsi gambar primitif.
   Kamu TIDAK perlu mengubah file ini — cukup pahami konsepnya, karena nanti
   pas demo kemungkinan besar ditanya "kenapa gambar bisa muncul di layar?"
   ============================================================================= */

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');
if (!gl) alert('WebGL tidak didukung di browser ini.');

/* -----------------------------------------------------------------------------
   KONSEP: WebGL itu cuma bisa gambar TITIK, GARIS, dan SEGITIGA — tidak ada
   fungsi "gambar kotak" atau "gambar lingkaran" bawaan seperti Canvas 2D biasa.
   Makanya kita harus:
     1. Kirim "resep" cara menggambar titik (vertex shader) ke GPU
     2. Kirim "resep" cara mewarnai tiap piksel (fragment shader) ke GPU
     3. Kirim data titik-titik (koordinat) dari JS ke GPU lewat buffer
   Dua "resep" di atas ditulis pakai bahasa GLSL (mirip C), bukan JavaScript.
   ----------------------------------------------------------------------------- */

// VERTEX SHADER: dijalankan GPU untuk SETIAP titik yang kita kirim.
// Tugasnya cuma satu: tentukan titik itu ada di posisi mana di layar.
const vertexShaderSrc = `
  attribute vec2 a_position;   // satu titik (x, y) yang kita kirim dari JS
  uniform mat3 u_matrix;       // "resep transformasi" (geser/putar/skala/proyeksi)
  void main() {
    // kalikan posisi asli dengan matriks -> posisi akhir di layar
    vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
    // WebGL butuh 4 angka (x,y,z,w); z=0 (2D saja), w=1 (wajib)
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// FRAGMENT SHADER: dijalankan GPU untuk SETIAP piksel di dalam bentuk.
// Tugasnya cuma satu: tentukan piksel itu warnanya apa.
const fragmentShaderSrc = `
  precision mediump float;
  uniform vec4 u_color;        // warna (r, g, b, alpha), tiap nilai 0..1
  void main() {
    gl_FragColor = u_color;
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

const program = createProgram(gl, vertexShaderSrc, fragmentShaderSrc);
gl.useProgram(program);

// "alamat" variabel di dalam shader, supaya JS bisa isi nilainya
const locs = {
  position: gl.getAttribLocation(program, 'a_position'),
  matrix: gl.getUniformLocation(program, 'u_matrix'),
  color: gl.getUniformLocation(program, 'u_color'),
};

const positionBuffer = gl.createBuffer();
gl.enableVertexAttribArray(locs.position);

// aktifkan transparansi (dipakai kalau nanti ada warna dengan alpha < 1)
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

/* =============================================================================
   MATRIKS 2D (m3)
   -----------------------------------------------------------------------------
   KONSEP PENTING: kita menggambar semua bentuk dalam koordinat PIKSEL biasa
   (misal kanvas 1000x650, (0,0) di kiri-atas) — BUKAN langsung di "clip space"
   WebGL yang rentangnya -1..1. Supaya itu bisa dipakai, kita perlu matriks
   PROYEKSI yang mengubah koordinat piksel -> clip space.

   Selain proyeksi, matriks juga dipakai untuk transformasi geometri yang
   diajarkan di kelas: TRANSLASI (geser), ROTASI (putar), SKALA (perbesar/kecil).
   Semua transformasi ini bisa "digabung" jadi satu matriks lewat perkalian
   matriks (m3.multiply), lalu dikirim SEKALI ke shader lewat u_matrix.
   ============================================================================= */

const m3 = {
  identity() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1]; // tidak mengubah apa-apa
  },
  translation(tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1]; // geser sejauh (tx, ty)
  },
  rotation(angleInRadians) {
    const c = Math.cos(angleInRadians), s = Math.sin(angleInRadians);
    return [c, s, 0, -s, c, 0, 0, 0, 1]; // putar sejauh angleInRadians (radian!)
  },
  scaling(sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1]; // perbesar/perkecil sumbu x & y
  },
  // ubah koordinat PIKSEL (0..width, 0..height, sumbu Y ke BAWAH seperti gambar
  // biasa) menjadi CLIP SPACE WebGL (-1..1, sumbu Y ke ATAS)
  projection(width, height) {
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  },
  // gabungkan dua matriks jadi satu. URUTAN PENTING:
  // multiply(A, B) artinya "terapkan B dulu, baru A" ke titik.
  // Contoh dipakai di scene.js: multiply(projection, multiply(translate, rotate))
  //   -> artinya: putar dulu di sekitar titik asal (0,0), baru geser ke posisi
  //      yang diinginkan, baru diproyeksikan ke layar.
  multiply(a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2];
    const a10 = a[3], a11 = a[4], a12 = a[5];
    const a20 = a[6], a21 = a[7], a22 = a[8];
    const b00 = b[0], b01 = b[1], b02 = b[2];
    const b10 = b[3], b11 = b[4], b12 = b[5];
    const b20 = b[6], b21 = b[7], b22 = b[8];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },
};

// matriks proyeksi cukup dibuat SEKALI di awal (ukuran kanvas tidak berubah)
const projectionMatrix = m3.projection(canvas.width, canvas.height);

/* =============================================================================
   FUNGSI PRIMITIF GAMBAR
   -----------------------------------------------------------------------------
   Ini fungsi-fungsi "siap pakai" yang akan kamu panggil terus-menerus di
   background.js. Kamu tidak perlu paham detail WebGL di dalamnya — anggap
   saja seperti fungsi gambar di Canvas 2D biasa.
   ============================================================================= */

// Fungsi paling dasar: kirim titik-titik ke GPU & suruh gambar sebagai
// "kipas segitiga" (TRIANGLE_FAN) — cocok untuk bentuk cembung sederhana
// seperti segitiga, segiempat, dan lingkaran (poligon banyak sisi).
function drawTriangleFan(points, color, matrix) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(locs.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix3fv(locs.matrix, false, matrix);
  gl.uniform4fv(locs.color, color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length / 2);
}

// Gambar POLIGON cembung sembarang.
// points  : array titik [[x,y], [x,y], ...] urut searah/berlawanan jarum jam
// color   : [r,g,b,a] masing-masing 0..1, contoh merah = [1,0,0,1]
// modelMatrix : opsional, transformasi tambahan (geser/putar/skala) SEBELUM
//               diproyeksikan. Kalau tidak diisi, titik dianggap sudah dalam
//               koordinat piksel absolut di kanvas (paling sering dipakai
//               untuk background yang statis/tidak dianimasikan).
function drawPolygon(points, color, modelMatrix = m3.identity()) {
  const flat = [];
  points.forEach(p => flat.push(p[0], p[1]));
  const matrix = m3.multiply(projectionMatrix, modelMatrix);
  drawTriangleFan(flat, color, matrix);
}

// Gambar LINGKARAN. (cx, cy) = titik pusat, r = radius, segments = jumlah
// "potongan kue" (makin banyak makin halus, 40 sudah cukup mulus).
function drawCircle(cx, cy, r, color, modelMatrix = m3.identity(), segments = 40) {
  const points = [[cx, cy]]; // titik pusat dulu (dibutuhkan TRIANGLE_FAN)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  drawPolygon(points, color, modelMatrix);
}

// Gambar GARIS dengan ketebalan tertentu. WebGL sebenarnya tidak punya garis
// tebal, jadi triknya: bikin persegi panjang TIPIS di sepanjang garis
// (dihitung pakai vektor normal/tegak lurus arah garis).
function drawLine(x1, y1, x2, y2, thickness, color, modelMatrix = m3.identity()) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 0.0001;
  const nx = (-dy / len) * (thickness / 2); // arah tegak lurus garis
  const ny = (dx / len) * (thickness / 2);
  const points = [
    [x1 + nx, y1 + ny],
    [x1 - nx, y1 - ny],
    [x2 - nx, y2 - ny],
    [x2 + nx, y2 + ny],
  ];
  drawPolygon(points, color, modelMatrix);
}

// Gambar PERSEGI PANJANG dari sudut kiri-atas (x,y), lebar w, tinggi h.
// Ini cuma "pembungkus" drawPolygon supaya kamu tidak perlu hitung 4 titik
// sudut manual setiap kali butuh kotak (dinding rumah, badan pohon, dsb).
function drawRect(x, y, w, h, color, modelMatrix = m3.identity()) {
  drawPolygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, modelMatrix);
}