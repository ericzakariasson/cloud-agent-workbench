const ROWS = 12;
const COLS = 12;
const MINES = 22;

const boardEl = document.getElementById("board");
const mineCounterEl = document.getElementById("mineCounter");
const gameStateEl = document.getElementById("gameState");
const resetBtn = document.getElementById("resetBtn");

let board = [];
let gameOver = false;
let gameWon = false;
let firstReveal = true;
let flagsUsed = 0;

function pad3(value) {
  return String(value).padStart(3, "0");
}

function setStateLabel(text) {
  gameStateEl.textContent = text;
}

function updateMineCounter() {
  mineCounterEl.textContent = pad3(Math.max(MINES - flagsUsed, 0));
}

function makeCell(row, col) {
  return {
    row,
    col,
    mine: false,
    revealed: false,
    flagged: false,
    adjacent: 0,
  };
}

function neighbors(row, col) {
  const result = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        result.push([nr, nc]);
      }
    }
  }
  return result;
}

function createBoardData() {
  board = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => makeCell(row, col)),
  );
}

function placeMinesSafe(safeRow, safeCol) {
  let placed = 0;
  while (placed < MINES) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    const cell = board[row][col];
    if (cell.mine || (row === safeRow && col === safeCol)) continue;
    cell.mine = true;
    placed += 1;
  }
}

function countAdjacentMines(row, col) {
  return neighbors(row, col).reduce((count, [nr, nc]) => {
    return count + (board[nr][nc].mine ? 1 : 0);
  }, 0);
}

function computeAdjacency() {
  board.forEach((row) => {
    row.forEach((cell) => {
      cell.adjacent = cell.mine ? 0 : countAdjacentMines(cell.row, cell.col);
    });
  });
}

function setupField(safeRow, safeCol) {
  placeMinesSafe(safeRow, safeCol);
  computeAdjacency();
}

function revealAllMines() {
  board.forEach((row) => {
    row.forEach((cell) => {
      if (cell.mine) {
        cell.revealed = true;
      }
    });
  });
}

function revealEmptyArea(startRow, startCol) {
  const stack = [[startRow, startCol]];
  while (stack.length > 0) {
    const [row, col] = stack.pop();
    const cell = board[row][col];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent !== 0) continue;
    neighbors(row, col).forEach(([nr, nc]) => {
      const neighbor = board[nr][nc];
      if (!neighbor.revealed && !neighbor.mine && !neighbor.flagged) {
        stack.push([nr, nc]);
      }
    });
  }
}

function revealCell(row, col) {
  if (gameOver || gameWon) return;

  const cell = board[row][col];
  if (cell.revealed || cell.flagged) return;

  if (firstReveal) {
    setupField(row, col);
    firstReveal = false;
    setStateLabel("PLAY");
  }

  if (cell.mine) {
    cell.revealed = true;
    gameOver = true;
    setStateLabel("LOST");
    resetBtn.textContent = "X(";
    revealAllMines();
    render();
    return;
  }

  if (cell.adjacent === 0) {
    revealEmptyArea(row, col);
  } else {
    cell.revealed = true;
  }

  checkWin();
  render();
}

function toggleFlag(row, col) {
  if (gameOver || gameWon) return;
  const cell = board[row][col];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
  flagsUsed += cell.flagged ? 1 : -1;
  updateMineCounter();
  render();
}

function checkWin() {
  const allSafeRevealed = board.every((row) =>
    row.every((cell) => cell.mine || cell.revealed),
  );
  if (allSafeRevealed) {
    gameWon = true;
    setStateLabel("WON");
    resetBtn.textContent = "B)";
  }
}

function cellText(cell) {
  if (!cell.revealed) {
    return cell.flagged ? "⚑" : "";
  }
  if (cell.mine) return "✹";
  if (cell.adjacent === 0) return "";
  return String(cell.adjacent);
}

function cellClass(cell) {
  const classes = ["cell"];
  if (cell.revealed) classes.push("revealed");
  if (cell.mine && cell.revealed) classes.push("mine");
  if (cell.flagged && !cell.revealed) classes.push("flagged");
  if (cell.revealed && !cell.mine && cell.adjacent > 0) {
    classes.push(`n${cell.adjacent}`);
  }
  return classes.join(" ");
}

function render() {
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, minmax(0, 1fr))`;
  boardEl.innerHTML = "";

  board.forEach((row) => {
    row.forEach((cell) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = cellClass(cell);
      button.dataset.row = String(cell.row);
      button.dataset.col = String(cell.col);
      button.textContent = cellText(cell);
      button.setAttribute("role", "gridcell");
      button.setAttribute(
        "aria-label",
        `Cell ${cell.row + 1}-${cell.col + 1} ${cell.revealed ? "revealed" : "hidden"}`,
      );
      boardEl.appendChild(button);
    });
  });
}

function resetGame() {
  createBoardData();
  gameOver = false;
  gameWon = false;
  firstReveal = true;
  flagsUsed = 0;
  updateMineCounter();
  setStateLabel("READY");
  resetBtn.textContent = ":)";
  render();
}

boardEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  revealCell(row, col);
});

boardEl.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  toggleFlag(row, col);
});

resetBtn.addEventListener("click", resetGame);

resetGame();
