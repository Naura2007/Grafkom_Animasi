/* =============================================================================
   MAIN.JS
   Render loop utama: dipanggil browser tiap frame (requestAnimationFrame).
   Urutan gambar = urutan layer, yang dipanggil belakangan menimpa yang lebih dulu.
   ============================================================================= */

let lastTime = 0; // waktu frame sebelumnya (ms), untuk menghitung dt

function render(timeMs) {
  const time = timeMs * 0.001;                    // ms -> detik, dipakai animasi matahari
  const dt = (timeMs - lastTime) * 0.001 || 0;    // selisih waktu antar frame (detik)
  lastTime = timeMs;

  // bersihkan kanvas
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // layer dari belakang ke depan
  drawSky();
  drawGround();
  drawSun(time);
  drawSunRays(time);
  drawMountains();
  drawRoad();
  drawHouse();
  drawTree();
  drawBirds();
  drawPaddyField();

  // update posisi mobil berdasarkan input, lalu gambar (paling depan)
  updateCarTranslation(dt);
  drawCar();

  requestAnimationFrame(render); // jadwalkan frame berikutnya
}

requestAnimationFrame(render); // mulai loop