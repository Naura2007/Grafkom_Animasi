/* =============================================================================
   ENGINE.JS
   Mesin dasar WebGL yang dipakai bersama (background.js, sun.js, mobil.js).
   Isinya: setup shader, matriks 2D untuk transformasi, dan fungsi gambar dasar.
   ============================================================================= */

// ---------- SETUP CANVAS & SHADER ----------
// Shader = "resep" yang dijalankan GPU: vertex shader menentukan POSISI tiap
// titik, fragment shader menentukan WARNA tiap piksel. WebGL wajib punya
// keduanya sebelum bisa menggambar apapun.

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');
if (!gl) alert('WebGL tidak didukung di browser ini.');

// vertex shader: hitung posisi akhir tiap titik di layar (posisi asli x matriks transformasi)
const vertexShaderSrc = `
  attribute vec2 a_position;
  uniform mat3 u_matrix;
  void main() {
    vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// fragment shader: tentukan warna tiap piksel di dalam bentuk
const fragmentShaderSrc = `
  precision mediump float;
  uniform vec4 u_color;
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

// gabungkan vertex + fragment shader jadi satu program siap pakai
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

// alamat variabel di dalam shader, dipakai JS untuk kirim data ke GPU
const locs = {
  position: gl.getAttribLocation(program, 'a_position'),
  matrix: gl.getUniformLocation(program, 'u_matrix'),
  color: gl.getUniformLocation(program, 'u_color'),
};

const positionBuffer = gl.createBuffer();
gl.enableVertexAttribArray(locs.position);

gl.enable(gl.BLEND); // aktifkan transparansi (dipakai kalau ada warna alpha < 1)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


// ---------- MATRIKS 2D (m3) ----------
// Dipakai untuk transformasi geometri: translasi (geser), rotasi (putar),
// skala (perbesar/perkecil), dan proyeksi (ubah koordinat piksel -> layar).
// m3.multiply bisa menggabung beberapa transformasi jadi satu matriks.

const m3 = {
  identity() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },
  translation(tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },
  rotation(angleInRadians) {
    const c = Math.cos(angleInRadians), s = Math.sin(angleInRadians);
    return [c, s, 0, -s, c, 0, 0, 0, 1];
  },
  scaling(sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },
  // ubah koordinat piksel (0..width, 0..height) jadi clip space WebGL (-1..1)
  projection(width, height) {
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  },
  // gabung dua matriks; multiply(A, B) = terapkan B dulu, baru A
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

const projectionMatrix = m3.projection(canvas.width, canvas.height);


// ---------- FUNGSI PRIMITIF GAMBAR ----------
// Fungsi siap pakai untuk menggambar bentuk dasar, dipanggil dari
// background.js, sun.js, dan mobil.js.

// kirim titik-titik ke GPU dan gambar sebagai kipas segitiga (dasar dari semua fungsi di bawah)
function drawTriangleFan(points, color, matrix) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(locs.position, 2, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix3fv(locs.matrix, false, matrix);
  gl.uniform4fv(locs.color, color);
  gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length / 2);
}

// gambar poligon cembung dari titik-titik sembarang (segitiga gunung, atap, dst)
function drawPolygon(points, color, modelMatrix = m3.identity()) {
  const flat = [];
  points.forEach(p => flat.push(p[0], p[1]));
  const matrix = m3.multiply(projectionMatrix, modelMatrix);
  drawTriangleFan(flat, color, matrix);
}

// gambar lingkaran (didekati dengan poligon bersisi banyak)
function drawCircle(cx, cy, r, color, modelMatrix = m3.identity(), segments = 40) {
  const points = [[cx, cy]];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  drawPolygon(points, color, modelMatrix);
}

// gambar garis dengan ketebalan (dibuat dari persegi panjang tipis)
function drawLine(x1, y1, x2, y2, thickness, color, modelMatrix = m3.identity()) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 0.0001;
  const nx = (-dy / len) * (thickness / 2);
  const ny = (dx / len) * (thickness / 2);
  const points = [
    [x1 + nx, y1 + ny],
    [x1 - nx, y1 - ny],
    [x2 - nx, y2 - ny],
    [x2 + nx, y2 + ny],
  ];
  drawPolygon(points, color, modelMatrix);
}

// gambar persegi panjang dari sudut kiri-atas (x,y), lebar w, tinggi h
function drawRect(x, y, w, h, color, modelMatrix = m3.identity()) {
  drawPolygon([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, modelMatrix);
}