function drawSunPlaceholder(time) {
  drawCircle(510, 210, 65, [0.98, 0.80, 0.20, 1]);
}

function drawPersonPlaceholder() {
  // TODO: ganti dengan drawPerson() (ikut kursor + skala jarak)
}

function render(timeMs) {
  const time = timeMs * 0.001; // ms -> detik, dipakai animasi berbasis waktu

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawSky();
  drawGround();
  drawSunPlaceholder(time);   // <- nanti diganti bagian teman
  drawMountains();
  drawRoad();
  drawHouse();
  drawTree();
  drawBirds();
  drawPersonPlaceholder();    // <- nanti diganti bagian teman

  requestAnimationFrame(render); // minta browser panggil render() lagi di frame berikutnya
}

requestAnimationFrame(render); // mulai loop render pertama kali