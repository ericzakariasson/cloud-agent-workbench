const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const overlay = document.getElementById("overlay");

const state = {
  mode: "ready",
  score: 0,
  lives: 3,
  level: 1,
  bricksLeft: 0,
};

const keys = {
  left: false,
  right: false,
};

const paddle = {
  w: 132,
  h: 16,
  speed: 580,
  x: (canvas.width - 132) / 2,
  y: canvas.height - 42,
};

const ball = {
  r: 9,
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 0,
  vy: 0,
  speed: 410,
  stuck: true,
  launchTimer: 0.8,
};

const brickGrid = {
  rows: 7,
  cols: 12,
  gap: 8,
  top: 84,
  sidePadding: 24,
  bricks: [],
};

const BRICK_COLORS = [
  "#ff6b6b",
  "#ff9f43",
  "#ffd166",
  "#90ee90",
  "#4ecdc4",
  "#5dade2",
  "#a29bfe",
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setOverlay(message) {
  if (!message) {
    overlay.textContent = "";
    overlay.classList.remove("show");
    return;
  }

  overlay.textContent = message;
  overlay.classList.add("show");
}

function updateStartButtonLabel() {
  if (state.mode === "running") {
    startBtn.textContent = "Pause";
  } else if (state.mode === "paused") {
    startBtn.textContent = "Resume";
  } else {
    startBtn.textContent = "Start";
  }
}

function createBricks() {
  const totalGap = brickGrid.gap * (brickGrid.cols - 1);
  const availableWidth = canvas.width - brickGrid.sidePadding * 2 - totalGap;
  const brickW = Math.floor(availableWidth / brickGrid.cols);
  const brickH = 25;

  brickGrid.bricks = [];
  state.bricksLeft = 0;

  for (let row = 0; row < brickGrid.rows; row += 1) {
    for (let col = 0; col < brickGrid.cols; col += 1) {
      const x = brickGrid.sidePadding + col * (brickW + brickGrid.gap);
      const y = brickGrid.top + row * (brickH + brickGrid.gap);
      brickGrid.bricks.push({
        x,
        y,
        w: brickW,
        h: brickH,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        alive: true,
      });
      state.bricksLeft += 1;
    }
  }
}

function resetBallOnPaddle(withDelay = true) {
  ball.stuck = true;
  ball.launchTimer = withDelay ? 0.85 : 0;
  ball.x = paddle.x + paddle.w / 2;
  ball.y = paddle.y - ball.r - 1;
  ball.vx = 0;
  ball.vy = 0;
}

function launchBall() {
  const direction = Math.random() < 0.5 ? -1 : 1;
  const angle = ((50 + Math.random() * 20) * Math.PI) / 180;
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = -Math.sin(angle) * ball.speed;
  ball.stuck = false;
}

function resetRound() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  paddle.x = (canvas.width - paddle.w) / 2;
  createBricks();
  resetBallOnPaddle(false);
  state.mode = "ready";
  setOverlay("Press Start");
  updateStartButtonLabel();
}

function collideBallWithPaddle() {
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.h;
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.w;

  if (
    ball.y + ball.r < paddleTop ||
    ball.y - ball.r > paddleBottom ||
    ball.x + ball.r < paddleLeft ||
    ball.x - ball.r > paddleRight ||
    ball.vy <= 0
  ) {
    return;
  }

  const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
  const boundedHit = clamp(hit, -1, 1);
  const maxAngle = (72 * Math.PI) / 180;
  const angle = boundedHit * maxAngle;
  const speed = clamp(Math.hypot(ball.vx, ball.vy) * 1.02, 340, 720);

  ball.vx = speed * Math.sin(angle);
  ball.vy = -Math.abs(speed * Math.cos(angle));
  ball.y = paddle.y - ball.r - 0.1;
}

function collideBallWithBricks() {
  for (const brick of brickGrid.bricks) {
    if (!brick.alive) {
      continue;
    }

    const nearestX = clamp(ball.x, brick.x, brick.x + brick.w);
    const nearestY = clamp(ball.y, brick.y, brick.y + brick.h);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq > ball.r * ball.r) {
      continue;
    }

    brick.alive = false;
    state.bricksLeft -= 1;
    state.score += 120;

    const overlapLeft = ball.x + ball.r - brick.x;
    const overlapRight = brick.x + brick.w - (ball.x - ball.r);
    const overlapTop = ball.y + ball.r - brick.y;
    const overlapBottom = brick.y + brick.h - (ball.y - ball.r);
    const minOverlap = Math.min(
      overlapLeft,
      overlapRight,
      overlapTop,
      overlapBottom,
    );

    if (minOverlap === overlapLeft) {
      ball.x -= overlapLeft;
      ball.vx = -Math.abs(ball.vx);
    } else if (minOverlap === overlapRight) {
      ball.x += overlapRight;
      ball.vx = Math.abs(ball.vx);
    } else if (minOverlap === overlapTop) {
      ball.y -= overlapTop;
      ball.vy = -Math.abs(ball.vy);
    } else {
      ball.y += overlapBottom;
      ball.vy = Math.abs(ball.vy);
    }

    // Prevent multi-hit tunneling by handling one brick per frame.
    return;
  }
}

function update(dt) {
  const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  paddle.x += direction * paddle.speed * dt;
  paddle.x = clamp(paddle.x, 0, canvas.width - paddle.w);

  if (state.mode !== "running") {
    return;
  }

  if (ball.stuck) {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 1;
    ball.launchTimer -= dt;

    if (ball.launchTimer <= 0) {
      launchBall();
    }
    return;
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.r <= 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r >= canvas.width) {
    ball.x = canvas.width - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }

  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }

  collideBallWithPaddle();
  collideBallWithBricks();

  if (state.bricksLeft <= 0) {
    state.mode = "won";
    setOverlay("You Win! Press Reset to play again.");
    updateStartButtonLabel();
    return;
  }

  if (ball.y - ball.r > canvas.height) {
    state.lives -= 1;

    if (state.lives <= 0) {
      state.mode = "lost";
      setOverlay("Game Over. Press Reset to retry.");
      updateStartButtonLabel();
      return;
    }

    resetBallOnPaddle(true);
  }
}

function drawBackground() {
  ctx.fillStyle = "#111936";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 140; i += 1) {
    const x = (i * 73) % canvas.width;
    const y = (i * 41) % canvas.height;
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawHud() {
  ctx.fillStyle = "#d8e0ff";
  ctx.font = "600 21px Inter, system-ui, sans-serif";
  ctx.fillText(`Score: ${state.score}`, 24, 38);
  ctx.fillText(`Lives: ${state.lives}`, 240, 38);
  ctx.fillText(`Bricks: ${state.bricksLeft}`, 410, 38);
}

function drawPaddle() {
  ctx.fillStyle = "#5f88ff";
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = "#fdfdfd";
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function drawBricks() {
  for (const brick of brickGrid.bricks) {
    if (!brick.alive) {
      continue;
    }
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
  }
}

function draw() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  drawHud();
}

function toggleStartPause() {
  if (state.mode === "ready") {
    state.mode = "running";
    setOverlay("");
  } else if (state.mode === "running") {
    state.mode = "paused";
    setOverlay("Paused");
  } else if (state.mode === "paused") {
    state.mode = "running";
    setOverlay("");
  }
  updateStartButtonLabel();
}

function bindEvents() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = true;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = true;
    }
    if (event.key === " ") {
      if (state.mode === "running" && ball.stuck) {
        launchBall();
      } else {
        toggleStartPause();
      }
      event.preventDefault();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      keys.left = false;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      keys.right = false;
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / rect.width;
    const canvasX = (event.clientX - rect.left) * ratio;
    paddle.x = clamp(canvasX - paddle.w / 2, 0, canvas.width - paddle.w);
  });

  startBtn.addEventListener("click", toggleStartPause);
  resetBtn.addEventListener("click", resetRound);
}

function startLoop() {
  let lastTime = performance.now();

  const frame = (time) => {
    const dt = Math.min((time - lastTime) / 1000, 0.033);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

bindEvents();
resetRound();
startLoop();
