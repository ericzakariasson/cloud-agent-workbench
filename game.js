const canvas = document.getElementById("pinball");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");
const overlayEl = document.getElementById("overlay");
const restartBtn = document.getElementById("restart");

const bounds = {
  left: 24,
  right: canvas.width - 24,
  top: 24,
  drainLine: canvas.height - 8,
};

const gravity = 1020;
const damping = 0.995;
const maxBallSpeed = 1080;

const keys = {
  left: false,
  right: false,
};

const state = {
  score: 0,
  lives: 3,
  best: Number.parseInt(localStorage.getItem("pinball-best") || "0", 10),
  gameOver: false,
};

const ball = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 9,
  inPlay: false,
};

const bumpers = [
  { x: 145, y: 200, r: 28, points: 110, pulse: 0, color: "#4fd1ff" },
  { x: 240, y: 148, r: 25, points: 130, pulse: 0, color: "#7cf59d" },
  { x: 335, y: 215, r: 28, points: 110, pulse: 0, color: "#f59f68" },
  { x: 192, y: 296, r: 22, points: 90, pulse: 0, color: "#e38bff" },
  { x: 288, y: 302, r: 22, points: 90, pulse: 0, color: "#fff275" },
];

const flippers = [
  {
    side: "left",
    pivotX: 178,
    pivotY: 632,
    length: 82,
    thickness: 12,
    restAngle: 0.24,
    activeAngle: -0.74,
    angle: 0.24,
    angularSpeed: 12,
    angularVelocity: 0,
  },
  {
    side: "right",
    pivotX: 302,
    pivotY: 632,
    length: 82,
    thickness: 12,
    restAngle: Math.PI - 0.24,
    activeAngle: Math.PI + 0.74,
    angle: Math.PI - 0.24,
    angularSpeed: 12,
    angularVelocity: 0,
  },
];

const laneTargets = [
  { x: 104, y: 108, w: 56, h: 16, lit: false },
  { x: 212, y: 82, w: 56, h: 16, lit: false },
  { x: 320, y: 108, w: 56, h: 16, lit: false },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateHud() {
  scoreEl.textContent = state.score.toString();
  bestEl.textContent = state.best.toString();
  livesEl.textContent = state.lives.toString();
}

function setOverlay(text, hidden = false) {
  overlayEl.textContent = text;
  overlayEl.classList.toggle("hidden", hidden);
}

function addScore(points) {
  state.score += points;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem("pinball-best", String(state.best));
  }
  updateHud();
}

function resetBall() {
  ball.x = canvas.width - 68;
  ball.y = canvas.height - 72;
  ball.vx = 0;
  ball.vy = 0;
  ball.inPlay = false;
}

function newGame() {
  state.score = 0;
  state.lives = 3;
  state.gameOver = false;
  laneTargets.forEach((t) => {
    t.lit = false;
  });
  resetBall();
  updateHud();
  setOverlay("Press Space to launch");
}

function launchBall() {
  if (ball.inPlay || state.gameOver) {
    return;
  }
  ball.inPlay = true;
  ball.vx = -170;
  ball.vy = -920;
  setOverlay("", true);
}

function loseLife() {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.lives = 0;
    state.gameOver = true;
    setOverlay("Game over - press Restart");
  } else {
    setOverlay("Ball drained - press Space");
  }
  updateHud();
  resetBall();
}

function updateFlippers(dt) {
  for (const flipper of flippers) {
    const isPressed = flipper.side === "left" ? keys.left : keys.right;
    const target = isPressed ? flipper.activeAngle : flipper.restAngle;
    const maxStep = flipper.angularSpeed * dt;
    const prev = flipper.angle;

    if (target > flipper.angle) {
      flipper.angle = Math.min(flipper.angle + maxStep, target);
    } else {
      flipper.angle = Math.max(flipper.angle - maxStep, target);
    }

    flipper.angularVelocity = (flipper.angle - prev) / dt;
  }
}

function resolveWallCollisions() {
  if (ball.x - ball.radius < bounds.left) {
    ball.x = bounds.left + ball.radius;
    ball.vx = Math.abs(ball.vx) * 0.9;
  } else if (ball.x + ball.radius > bounds.right) {
    ball.x = bounds.right - ball.radius;
    ball.vx = -Math.abs(ball.vx) * 0.9;
  }

  if (ball.y - ball.radius < bounds.top) {
    ball.y = bounds.top + ball.radius;
    ball.vy = Math.abs(ball.vy) * 0.86;
  }
}

function resolveBumperCollisions(dt) {
  for (const bumper of bumpers) {
    const dx = ball.x - bumper.x;
    const dy = ball.y - bumper.y;
    const distSq = dx * dx + dy * dy;
    const minDist = ball.radius + bumper.r;

    bumper.pulse = Math.max(0, bumper.pulse - dt * 3);

    if (distSq >= minDist * minDist) {
      continue;
    }

    const dist = Math.sqrt(distSq) || 0.0001;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;

    ball.x += nx * overlap;
    ball.y += ny * overlap;

    const speedAlongNormal = ball.vx * nx + ball.vy * ny;
    if (speedAlongNormal < 0) {
      ball.vx -= 2.05 * speedAlongNormal * nx;
      ball.vy -= 2.05 * speedAlongNormal * ny;
    }

    ball.vx += nx * 110;
    ball.vy += ny * 110;
    bumper.pulse = 1;
    addScore(bumper.points);
  }
}

function resolveLaneTargetHits() {
  for (const target of laneTargets) {
    if (
      ball.x + ball.radius > target.x &&
      ball.x - ball.radius < target.x + target.w &&
      ball.y + ball.radius > target.y &&
      ball.y - ball.radius < target.y + target.h
    ) {
      if (!target.lit) {
        target.lit = true;
        addScore(250);
      }
      ball.vy = Math.abs(ball.vy) + 70;
      ball.y = target.y + target.h + ball.radius;
    }
  }

  if (laneTargets.every((target) => target.lit)) {
    laneTargets.forEach((target) => {
      target.lit = false;
    });
    addScore(1000);
  }
}

function resolveFlipperCollision(flipper) {
  const tipX = flipper.pivotX + Math.cos(flipper.angle) * flipper.length;
  const tipY = flipper.pivotY + Math.sin(flipper.angle) * flipper.length;
  const segX = tipX - flipper.pivotX;
  const segY = tipY - flipper.pivotY;
  const segLenSq = segX * segX + segY * segY;

  const toBallX = ball.x - flipper.pivotX;
  const toBallY = ball.y - flipper.pivotY;
  const t = clamp((toBallX * segX + toBallY * segY) / segLenSq, 0, 1);

  const closestX = flipper.pivotX + segX * t;
  const closestY = flipper.pivotY + segY * t;

  const diffX = ball.x - closestX;
  const diffY = ball.y - closestY;
  const distSq = diffX * diffX + diffY * diffY;
  const minDist = ball.radius + flipper.thickness;

  if (distSq >= minDist * minDist) {
    return;
  }

  const dist = Math.sqrt(distSq) || 0.0001;
  const nx = diffX / dist;
  const ny = diffY / dist;
  const overlap = minDist - dist;

  ball.x += nx * overlap;
  ball.y += ny * overlap;

  const rx = closestX - flipper.pivotX;
  const ry = closestY - flipper.pivotY;
  const flipperVelX = -flipper.angularVelocity * ry;
  const flipperVelY = flipper.angularVelocity * rx;

  const relVx = ball.vx - flipperVelX;
  const relVy = ball.vy - flipperVelY;
  const closing = relVx * nx + relVy * ny;

  if (closing < 0) {
    const bounce = 2.1;
    ball.vx -= bounce * closing * nx;
    ball.vy -= bounce * closing * ny;
  }

  const impulse = 220 + Math.abs(flipper.angularVelocity) * 18;
  ball.vx += nx * impulse;
  ball.vy += ny * impulse - 30;
}

function updateBall(dt) {
  if (!ball.inPlay || state.gameOver) {
    return;
  }

  ball.vy += gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  ball.vx *= damping;
  ball.vy *= damping;

  resolveWallCollisions();
  resolveBumperCollisions(dt);
  resolveLaneTargetHits();

  for (const flipper of flippers) {
    resolveFlipperCollision(flipper);
  }

  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > maxBallSpeed) {
    const scale = maxBallSpeed / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }

  if (ball.y - ball.radius > bounds.drainLine) {
    loseLife();
  }
}

function drawPlayfield() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#131a38");
  gradient.addColorStop(1, "#0b1025");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(176, 196, 255, 0.7)";
  ctx.lineWidth = 3;
  ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, canvas.height - bounds.top - 14);

  ctx.fillStyle = "rgba(151, 170, 235, 0.25)";
  ctx.fillRect(canvas.width - 94, 88, 60, canvas.height - 200);
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
  ctx.font = "12px Segoe UI";
  ctx.fillText("Shooter", canvas.width - 90, 82);

  for (const target of laneTargets) {
    ctx.fillStyle = target.lit ? "#8cffad" : "#2f447f";
    ctx.fillRect(target.x, target.y, target.w, target.h);
    ctx.strokeStyle = "rgba(190, 210, 255, 0.8)";
    ctx.strokeRect(target.x, target.y, target.w, target.h);
  }
}

function drawBumpers() {
  for (const bumper of bumpers) {
    const pulse = 1 + bumper.pulse * 0.2;
    const radius = bumper.r * pulse;

    ctx.beginPath();
    ctx.fillStyle = bumper.color;
    ctx.globalAlpha = 0.18;
    ctx.arc(bumper.x, bumper.y, radius + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.fillStyle = bumper.color;
    ctx.arc(bumper.x, bumper.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.arc(bumper.x - 6, bumper.y - 8, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlipper(flipper) {
  const tipX = flipper.pivotX + Math.cos(flipper.angle) * flipper.length;
  const tipY = flipper.pivotY + Math.sin(flipper.angle) * flipper.length;

  ctx.lineCap = "round";
  ctx.strokeStyle = "#9dc0ff";
  ctx.lineWidth = flipper.thickness * 2;
  ctx.beginPath();
  ctx.moveTo(flipper.pivotX, flipper.pivotY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.fillStyle = "#d6e5ff";
  ctx.beginPath();
  ctx.arc(flipper.pivotX, flipper.pivotY, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = "#f7fbff";
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(120, 160, 255, 0.55)";
  ctx.arc(ball.x - 3, ball.y - 3, ball.radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  drawPlayfield();
  drawBumpers();
  for (const flipper of flippers) {
    drawFlipper(flipper);
  }
  drawBall();
}

let lastTime = performance.now();

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 1 / 30);
  lastTime = timestamp;

  updateFlippers(dt);
  updateBall(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function handleKeyDown(event) {
  if (event.repeat) {
    return;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = true;
    event.preventDefault();
  } else if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = true;
    event.preventDefault();
  } else if (event.code === "Space") {
    launchBall();
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  if (event.code === "ArrowLeft" || event.code === "KeyA") {
    keys.left = false;
  } else if (event.code === "ArrowRight" || event.code === "KeyD") {
    keys.right = false;
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
restartBtn.addEventListener("click", newGame);

newGame();
requestAnimationFrame(gameLoop);
