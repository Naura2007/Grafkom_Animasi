function drawSun(time) {
  drawCircle(510, 210, 65, [0.98, 0.80, 0.20, 1]);
}

function drawSunRays(time) {
  const sunX = 510;
  const sunY = 210;

  const rayCount = 8;
  const distance = 95;
  const size = 15;

  for (let i = 0; i < rayCount; i++) {
    // Position around the sun
    const angle = time + (i / rayCount) * Math.PI * 2;

    const x = sunX + Math.cos(angle) * distance;
    const y = sunY + Math.sin(angle) * distance;

    // Triangle shape, centered around (0, 0)
    const triangle = [
      [0, -size],
      [-size, size],
      [size, size]
    ];

    // Rotate triangle while it orbits
    const rotation = m3.rotation(angle + Math.PI / 2);

    // Move triangle to its orbit position
    const translation = m3.translation(x, y);

    // Translation + rotation
    const transform = m3.multiply(translation, rotation);

    drawPolygon(
      triangle,
      [0.98, 0.80, 0.20, 1],
      transform
    );
  }
}

let personX = 500;
let personY = 550;

const PERSON_SIZE = 40;
const PERSON_SPEED = 50;

function drawPerson() {
  // Scale berdasarkan jarak dari horizon
  const minScale = 0.1;
  const maxScale = 2.0;

  const scale = minScale +
    ((personY - HORIZON_Y) / (canvas.height - HORIZON_Y)) *
    (maxScale - minScale);

  const size = PERSON_SIZE * scale;

  drawRect(
    personX - size / 2,
    personY - size,
    size,
    size,
    [0.96, 0.96, 0.86, 1]
  );
}

// 1. Initialize keys object
const keys = {};

// 2. Add event listeners
window.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function updatePersonTranslation(dt) {
  // Use optional chaining or fallback to prevent errors if keys is empty
  if (keys["arrowleft"]) {
    personX -= PERSON_SPEED * dt;
  }
  if (keys["arrowup"]) {
    personY -= PERSON_SPEED * dt; // Note: -dt moves UP toward 0 in WebGL 2D/Canvas screen space
  }
  if (keys["arrowdown"]) {
    personY += PERSON_SPEED * dt; // Note: +dt moves DOWN
  }
  if (keys["arrowright"]) {
    personX += PERSON_SPEED * dt;
  }

  // Clamping boundaries
  if (typeof HORIZON_Y !== "undefined") {
    personY = Math.max(HORIZON_Y, personY);
  }
  personX = Math.max(0, Math.min(canvas.width, personX));
  personY = Math.min(canvas.height, personY);
}

let lastTime = 0;

function render(timeMs) {
  const time = timeMs * 0.001; // ms -> detik, dipakai animasi berbasis waktu
  const dt = (timeMs - lastTime) * 0.001 || 0; 
  lastTime = timeMs;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawSky();
  drawGround();
  drawSun(time);
  drawSunRays(time);
  drawMountains();
  drawRoad();
  drawHouse();
  drawTree();
  drawBirds();
  drawPaddyField()

  updatePersonTranslation(dt);
  drawPerson();

  requestAnimationFrame(render); // minta browser panggil render() lagi di frame berikutnya
}

requestAnimationFrame(render); // mulai loop render pertama kali