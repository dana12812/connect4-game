/*========================= MVP =========================*/

/*-------------- Constants -------------*/

const rows = 6;
const columns = 7;
const boardElement = document.querySelector('#gameBoard');
const statusText = document.querySelector('#statusText');
const restartButton = document.querySelector('#restartButton');

/*---------- Variables (State) ---------*/

let cells = [];
let currentPlayer = 'Player1';
let gameOver = false;

/*-------------- Functions -------------*/

const init = () => {
  cells = Array.from({ length: rows }, () => Array(columns).fill(''));
  currentPlayer = 'Player1';
  gameOver = false;
  winningCells = [];
};

const render = () => {
  boardElement.innerHTML = '';

  cells.forEach((rowArray, row) => {
    rowArray.forEach((cell, col) => {
      const cellDiv = document.createElement('div');
      cellDiv.className = 'cell';

      if (cell) {
        cellDiv.classList.add(cell);
      }

      const isWinningCell = winningCells.some(([r, c]) => r === row && c === col);
      if (isWinningCell) {
        cellDiv.classList.add('win');
      }

      cellDiv.dataset.row = row;
      cellDiv.dataset.col = col;
      boardElement.appendChild(cellDiv);
    });
  });
};

const getAvailableRow = (col) => {
  const columnValues = cells.map(row => row[col]);
  return columnValues.lastIndexOf('');
};

const countDirection = (row, col, dr, dc, player, collected) => {
  let count = 0;

  Array.from({ length: Math.max(rows, columns) }).every((_, i) => {
    const r = row + dr * (i + 1);
    const c = col + dc * (i + 1);
    const isMatch = r >= 0 && r < rows && c >= 0 && c < columns && cells[r][c] === player;

    if (isMatch) {
      count++;
      collected.push([r, c]);
    }

    return isMatch;
  });

  return count;
};

const checkWin = (row, col) => {
  const player = cells[row][col];
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  return directions.some(([dr, dc]) => {
    const collected = [[row, col]];
    const forward = countDirection(row, col, dr, dc, player, collected);
    const backward = countDirection(row, col, -dr, -dc, player, collected);
    const total = 1 + forward + backward;

    if (total >= 4) {
      winningCells = collected;
    }

    return total >= 4;
  });
};

const isBoardFull = () => {
  return cells.every(row => row.every(cell => cell !== ''));
};

/*----------- Event Listeners ----------*/

boardElement.addEventListener('click', (e) => {
  if (gameOver || isPaused) return;

  const col = Number(e.target.dataset.col);
  if (isNaN(col)) return;

  const row = getAvailableRow(col);
  if (row === -1) return;

  cells[row][col] = currentPlayer;

  if (checkWin(row, col)) {
    scores[currentPlayer]++;
    renderScores();
    launchConfetti();
    const tone = currentPlayer === 'Player1' ? 'win-p1' : 'win-p2';
    setStatus(`${currentPlayer} wins!`, tone);
    return endGame();
  }

  if (isBoardFull()) {
    scores.ties++;
    renderScores();
    setStatus(`It's a draw!`, 'draw');
    return endGame();
  }

  currentPlayer = currentPlayer === 'Player1' ? 'Player2' : 'Player1';
  render();
  setStatus(`${currentPlayer}'s turn`, '');
  saveState();
});

restartButton.addEventListener('click', () => {
  init();
  render();
  renderTimer();
  setStatus(`${currentPlayer}'s turn`, '');
  startTimer();
  saveState();
});


/*==================== ADDITIONAL FEATURES ====================*/

/*-------------- Constants -------------*/

const statusMessage = document.querySelector('#statusMessage');
const pauseButton = document.querySelector('#pauseButton');
const p1ScoreEl = document.querySelector('#p1Score');
const p2ScoreEl = document.querySelector('#p2Score');
const tieScoreEl = document.querySelector('#tieScore');
const timerDisplay = document.querySelector('#timerDisplay');
const STORAGE_KEY = 'connectFourState';

/*---------- Variables (State) ---------*/

let isPaused = false;
let scores = { Player1: 0, Player2: 0, ties: 0 };
let winningCells = [];
let seconds = 0;
let timerId = null;

/*-------------- Functions -------------*/

const setStatus = (text, tone) => {
  statusMessage.className = tone || '';
  statusText.textContent = text;
};

const renderScores = () => {
  p1ScoreEl.textContent = scores.Player1;
  p2ScoreEl.textContent = scores.Player2;
  tieScoreEl.textContent = scores.ties;
};

const renderTimer = () => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsPart = String(seconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${secondsPart}`;
};

const startTimer = () => {
  stopTimer();
  timerId = setInterval(() => {
    seconds++;
    renderTimer();
  }, 1000);
};

const stopTimer = () => {
  clearInterval(timerId);
  timerId = null;
};

const togglePause = () => {
  if (gameOver) return;

  isPaused = !isPaused;
  boardElement.classList.toggle('paused', isPaused);
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';

  if (isPaused) {
    stopTimer();
  } else {
    startTimer();
  }
};

pauseButton.addEventListener('click', togglePause);

const launchConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 90,
    origin: { y: 0.4 },
    colors: ['#F66FB1', '#63E4EE', '#A93DFF', '#ffffff'],
  });
};

const saveState = () => {
  const state = {
    cells: cells,
    currentPlayer: currentPlayer,
    gameOver: gameOver,
    scores: scores,
    seconds: seconds,
    statusText: statusText.textContent,
    statusTone: statusMessage.className,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return false;
  }

  const state = JSON.parse(saved);

  cells = state.cells || Array.from({ length: rows }, () => Array(columns).fill(''));
  currentPlayer = state.currentPlayer || 'Player1';
  gameOver = state.gameOver || false;
  scores = state.scores || { Player1: 0, Player2: 0, ties: 0 };
  seconds = state.seconds || 0;

  setStatus(state.statusText || '', state.statusTone || '');

  return true;
};

const endGame = () => {
  gameOver = true;
  stopTimer();
  render();
  saveState();
};


/*----------------- Boot ---------------*/

if (!loadState()) {
  init();
  setStatus(`${currentPlayer}'s turn`, '');
}

render();
renderScores();
renderTimer();

if (!gameOver) {
  startTimer();
}

boardElement.classList.add('ready');