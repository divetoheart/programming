const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const overlayTitle = document.querySelector('#overlay-title');
const overlayText = document.querySelector('#overlay-text');
const startButton = document.querySelector('#start-button');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = new Set();

let running = false;
let score = 0;
let best = Number(localStorage.getItem('jaydon-game-best') || 0);
let lastTime = 0;
let enemyTimer = 0;
let stars = [];
let enemies = [];
let particles = [];
let pointerTarget = null;

bestEl.textContent = best;

const player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 18,
  speed: 330,
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function makeStar() {
  return {
    x: randomBetween(50, WIDTH - 50),
    y: randomBetween(50, HEIGHT - 50),
    radius: 12,
    pulse: Math.random() * Math.PI * 2,
  };
}

function makeEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x;
  let y;

  if (side === 0) {
    x = randomBetween(0, WIDTH);
    y = -30;
  } else if (side === 1) {
    x = WIDTH + 30;
    y = randomBetween(0, HEIGHT);
  } else if (side === 2) {
    x = randomBetween(0, WIDTH);
    y = HEIGHT + 30;
  } else {
    x = -30;
    y = randomBetween(0, HEIGHT);
  }

  return {
    x,
    y,
    radius: randomBetween(13, 24),
    speed: randomBetween(90, 145) + score * 2.2,
  };
}

function resetGame() {
  score = 0;
  scoreEl.textContent = score;
  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
  stars = [makeStar()];
  enemies = [];
  particles = [];
  enemyTimer = 0;
  pointerTarget = null;
  lastTime = performance.now();
}

function startGame() {
  resetGame();
  running = true;
  overlay.classList.add('hidden');
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;

  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem('jaydon-game-best', String(best));
  }

  overlayTitle.textContent = 'Game Over';
  overlayText.textContent = `You collected ${score} star${score === 1 ? '' : 's'}.`;
  startButton.textContent = 'Play Again';
  overlay.classList.remove('hidden');
}

function circlesTouch(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
}

function burst(x, y) {
  for (let i = 0; i < 14; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(70, 220);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.65,
      radius: randomBetween(2, 5),
    });
  }
}

function update(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;

  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    player.x += (dx / length) * player.speed * dt;
    player.y += (dy / length) * player.speed * dt;
    pointerTarget = null;
  } else if (pointerTarget) {
    const tx = pointerTarget.x - player.x;
    const ty = pointerTarget.y - player.y;
    const distance = Math.hypot(tx, ty);

    if (distance > 5) {
      const step = Math.min(player.speed * dt, distance);
      player.x += (tx / distance) * step;
      player.y += (ty / distance) * step;
    }
  }

  player.x = Math.max(player.radius, Math.min(WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(HEIGHT - player.radius, player.y));

  enemyTimer += dt;
  const spawnDelay = Math.max(0.38, 1.05 - score * 0.025);
  if (enemyTimer >= spawnDelay) {
    enemyTimer = 0;
    enemies.push(makeEnemy());
  }

  for (const enemy of enemies) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    enemy.x += Math.cos(angle) * enemy.speed * dt;
    enemy.y += Math.sin(angle) * enemy.speed * dt;

    if (circlesTouch(player, enemy)) {
      endGame();
      return;
    }
  }

  for (const star of stars) {
    star.pulse += dt * 4;
    if (circlesTouch(player, star)) {
      score += 1;
      scoreEl.textContent = score;
      burst(star.x, star.y);
      Object.assign(star, makeStar());
    }
  }

  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.97;
    particle.vy *= 0.97;
    particle.life -= dt;
  }
  particles = particles.filter((particle) => particle.life > 0);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, '#111827');
  gradient.addColorStop(1, '#172554');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = 0; x < WIDTH; x += 48) {
    for (let y = 0; y < HEIGHT; y += 48) {
      ctx.beginPath();
      ctx.arc(x + 12, y + 12, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStar(star) {
  const radius = star.radius + Math.sin(star.pulse) * 2;
  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.fillStyle = '#facc15';
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 20;
  ctx.beginPath();

  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  drawBackground();

  for (const star of stars) drawStar(star);

  for (const enemy of enemies) {
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 0.65);
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#60a5fa';
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(player.x - 6, player.y - 4, 3, 0, Math.PI * 2);
  ctx.arc(player.x + 6, player.y - 4, 3, 0, Math.PI * 2);
  ctx.fill();
}

function loop(time) {
  if (!running) return;
  const dt = Math.min((time - lastTime) / 1000, 0.033);
  lastTime = time;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}

function setPointerTarget(event) {
  const rect = canvas.getBoundingClientRect();
  pointerTarget = {
    x: ((event.clientX - rect.left) / rect.width) * WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
  };
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd'].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
});

window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener('pointerdown', setPointerTarget);
canvas.addEventListener('pointermove', (event) => {
  if (event.buttons || event.pointerType === 'touch') setPointerTarget(event);
});
startButton.addEventListener('click', startGame);

draw();
