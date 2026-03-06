const ROWS = 9;
const COLS = 9;
const MINES = 10;

const boardEl = document.getElementById("board");
const mineCounterEl = document.getElementById("mine-counter");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const resetButton = document.getElementById("reset-button");
const hintButton = document.getElementById("hint-button");

let board = [];
let gameOver = false;
let firstClick = true;
let flagsPlaced = 0;
let timer = 0;
let timerHandle = null;

function pad3(value) {
  return String(value).padStart(3, "0");
}

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function getNeighbors(row, col) {
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (inBounds(nr, nc)) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startTimer() {
  if (timerHandle) return;
  timerHandle = setInterval(() => {
    timer = Math.min(999, timer + 1);
    timerEl.textContent = pad3(timer);
  }, 1000);
}

function updateMineCounter() {
  mineCounterEl.textContent = pad3(Math.max(0, MINES - flagsPlaced));
}

function placeMines(excludedRow, excludedCol) {
  let placed = 0;
  while (placed < MINES) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    if ((row === excludedRow && col === excludedCol) || board[row][col].mine) {
      continue;
    }
    board[row][col].mine = true;
    placed += 1;
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].mine) continue;
      const neighbors = getNeighbors(row, col);
      board[row][col].adjacentMines = neighbors.filter(([nr, nc]) => board[nr][nc].mine).length;
    }
  }
}

function renderCell(row, col) {
  const cell = board[row][col];
  const button = boardEl.children[row * COLS + col];
  button.className = "cell";
  button.textContent = "";

  if (cell.revealed) {
    button.classList.add("revealed");
    button.disabled = true;
    if (cell.mine) {
      button.classList.add("mine");
      button.textContent = "*";
    } else if (cell.adjacentMines > 0) {
      button.textContent = String(cell.adjacentMines);
      button.classList.add(`n${cell.adjacentMines}`);
    }
    return;
  }

  button.disabled = gameOver;
  if (cell.flagged) {
    button.classList.add("flagged");
    button.textContent = "F";
  }
}

function renderBoard() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      renderCell(row, col);
    }
  }
}

function revealCell(row, col) {
  const start = board[row][col];
  if (start.revealed || start.flagged) return;

  const stack = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop();
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;

    if (cell.adjacentMines === 0 && !cell.mine) {
      const neighbors = getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        if (!board[nr][nc].revealed && !board[nr][nc].mine) {
          stack.push([nr, nc]);
        }
      }
    }
  }
}

function revealAllMines() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
      }
    }
  }
}

function checkWin() {
  let revealedSafe = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col].revealed && !board[row][col].mine) {
        revealedSafe += 1;
      }
    }
  }
  if (revealedSafe === ROWS * COLS - MINES) {
    gameOver = true;
    statusEl.textContent = "You cleared the minefield!";
    resetButton.textContent = "8)";
    stopTimer();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (board[row][col].mine && !board[row][col].flagged) {
          board[row][col].flagged = true;
          flagsPlaced += 1;
        }
      }
    }
    updateMineCounter();
    renderBoard();
  }
}

function handleReveal(row, col) {
  if (gameOver) return;
  const cell = board[row][col];
  if (cell.flagged || cell.revealed) return;

  if (firstClick) {
    placeMines(row, col);
    firstClick = false;
    startTimer();
  }

  if (cell.mine) {
    cell.revealed = true;
    revealAllMines();
    gameOver = true;
    statusEl.textContent = "Boom! You hit a mine.";
    resetButton.textContent = ":(";
    stopTimer();
    renderBoard();
    return;
  }

  revealCell(row, col);
  renderBoard();
  checkWin();
}

function handleFlag(row, col) {
  if (gameOver) return;
  const cell = board[row][col];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsPlaced += cell.flagged ? 1 : -1;
  updateMineCounter();
  renderCell(row, col);
}

function handleHint() {
  if (gameOver) return;

  if (firstClick) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    handleReveal(row, col);
    return;
  }

  const candidates = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = board[row][col];
      if (!cell.mine && !cell.revealed && !cell.flagged) {
        candidates.push([row, col]);
      }
    }
  }

  if (candidates.length === 0) return;
  const [row, col] = candidates[Math.floor(Math.random() * candidates.length)];
  handleReveal(row, col);
}

function createBoard() {
  board = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
    })),
  );
}

function buildBoardUI() {
  boardEl.innerHTML = "";
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", `Cell ${row + 1}, ${col + 1}`);
      button.addEventListener("click", () => handleReveal(row, col));
      button.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        handleFlag(row, col);
      });
      boardEl.appendChild(button);
    }
  }
}

function initGame() {
  stopTimer();
  timer = 0;
  timerEl.textContent = "000";
  firstClick = true;
  gameOver = false;
  flagsPlaced = 0;
  updateMineCounter();
  statusEl.textContent = "Clear all safe cells to win.";
  resetButton.textContent = ":)";

  createBoard();
  buildBoardUI();
}

resetButton.addEventListener("click", initGame);
hintButton.addEventListener("click", handleHint);

initGame();
