/* ---------- DOM Elements ---------- */

/* Tiny query-selector shorthands used everywhere below */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* Cache every DOM element the game touches, keyed by purpose */
const ui = {
  board: $('#gameBoard'),
  status: $('#statusMessage'),
  statusText: $('#statusText'),
  pause: $('#pauseButton'),
  restart: $('#restartButton'),
  reset: $('#resetGameButton'),
  scores: { Player1: $('#p1Score'),
            Player2: $('#p2Score'),
            ties: $('#tieScore') },
  timer: $('#timerDisplay'),
  theme: $('#themeButton'),
  moon: $('#themeIconMoon'),
  sun: $('#themeIconSun'),
  modes: $$('.modeBtn'),
  inputs: { Player1: $('#p1NameInput'),
            Player2: $('#p2NameInput') },
  labels: { Player1: $('#p1NameLabel'),
            Player2: $('#p2NameLabel') },
  leaderboard: $('#leaderboardList'),
  startOverlay: $('#startOverlay'),
  start: $('#startButton')
};
/* ---------- Constants ---------- */

const ROWS = 6;
const COLUMNS = 7;
/* localStorage keys: current game state, theme choice, and all-time win totals */
const STORAGE_KEY = 'connectFourState';
const THEME_KEY = 'connectFourTheme';
const LEADERBOARD_KEY = 'connectFourLeaderboard';
const COMPUTER_DELAY = 600;
const PLAYERS = ['Player1', 'Player2'];
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // right, down, diagonal ↘, diagonal ↗
const DEFAULT_SCORES = { Player1: 0, Player2: 0, ties: 0 };
const DEFAULT_NAMES = { Player1: 'Player 1', Player2: 'Player 2' };

/* ---------- Variables ---------- */

/* cells: 2D board array, ROWS x COLUMNS, each slot '' | 'Player1' | 'Player2' */
let cells = [];
let currentPlayer = 'Player1';
let gameOver = false;
let isPaused = false;
/* prevents double-moves while the computer's delayed move is pending */
let isComputerThinking = false;
/* False until Start Game is pressed; locks the board/clock until then, reset each new round */
let hasStarted = false;
/* the 4 (or more) [row, col] cells that formed the winning line, for highlighting */
let winningCells = [];
let seconds = 0;
let timerId = null;
/* 'pvp' (two human players) or 'pvc' (vs. computer) */
let gameMode = 'pvp';
let scores = { ...DEFAULT_SCORES };
let playerNames = { ...DEFAULT_NAMES };

/* ---------- Functions ---------- */

/* Build a fresh empty board: ROWS arrays of COLUMNS empty strings */
const createBoard = () => Array.from({ length: ROWS }, () => Array(COLUMNS).fill(''));
const playerName = (player = currentPlayer) => playerNames[player];
const nextPlayer = (player = currentPlayer) => player === 'Player1' ? 'Player2' : 'Player1';
/* Updates the status pill's text and color (tone class, e.g. 'win-p1', 'draw') */
const setStatus = (text, tone = '') => {
  ui.status.className = tone;
  ui.statusText.textContent = text;
};

/* Reads and JSON-parses a localStorage key, falling back safely if missing/corrupt */
function getSavedData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

/* Rebuilds all 42 .cell divs from `cells` and swaps them in via a DocumentFragment */
function renderBoard() {
  const fragment = document.createDocumentFragment();
  cells.forEach((row, rowIndex) => row.forEach((player, columnIndex) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = rowIndex;
    cell.dataset.col = columnIndex;
    if (player) cell.classList.add(player);
    if (winningCells.some(([row, col]) => row === rowIndex && col === columnIndex)) cell.classList.add('win');
    fragment.appendChild(cell);
  }));
  ui.board.replaceChildren(fragment);
}

/* Pushes the `scores` object values into the score card DOM elements */
function renderScores() {
  Object.entries(scores).forEach(([player, score]) => ui.scores[player].textContent = score);
}

/* Formats `seconds` as MM:SS and writes it into the timer display */
function renderTimer() {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  ui.timer.textContent = `${minutes}:${secs}`;
}

/* Syncs both the score-card labels and the (editable) name input values with playerNames */
function renderNames() {
  PLAYERS.forEach((player) => {
    ui.labels[player].textContent = playerNames[player];
    ui.inputs[player].value = playerNames[player];
  });
}

/* Rebuilds the leaderboard list from saved win counts, sorted highest wins first */
function renderLeaderboard() {
  const entries = Object.entries(getSavedData(LEADERBOARD_KEY, {})).sort(([, a], [, b]) => b - a);
  ui.leaderboard.replaceChildren();
  const rows = entries.length ? entries : [['No wins recorded yet', null]];
  rows.forEach(([name, wins]) => {
    const item = document.createElement('li');
    item.textContent = wins === null ? name : `${name} — ${wins} win${wins === 1 ? '' : 's'}`;
    ui.leaderboard.appendChild(item);
  });
}

/* Convenience bundle: re-renders board, scores, and timer together */
function renderGame() {
  renderBoard();
  renderScores();
  renderTimer();
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

/* Restarts the 1-second interval that increments `seconds` and re-renders the timer */
function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    seconds += 1;
    renderTimer();
  }, 1000);
}
/* Syncs the board's locked look and the Start overlay with isPaused/hasStarted */
function updateBoardLockState() {
  ui.board.classList.toggle('paused', isPaused || !hasStarted);
  ui.pause.disabled = !hasStarted;
  ui.startOverlay.classList.toggle('hidden', hasStarted);
}

/* Pause/Resume handler: freezes the clock and blocks moves; resuming lets a pending computer move proceed */
function togglePause() {
  if (gameOver || !hasStarted) return;
  isPaused = !isPaused;
  ui.pause.textContent = isPaused ? 'Resume' : 'Pause';
  updateBoardLockState();
  if (isPaused) stopTimer();
  else {
    startTimer();
    scheduleComputerMove();
  }
}

/* Start Game handler: unlocks the board, starts the clock, lets the computer move if it's its turn */
function beginRound() {
  if (hasStarted || gameOver) return;
  hasStarted = true;
  updateBoardLockState();
  setStatus(`${playerName()}'s turn`);
  startTimer();
  scheduleComputerMove();
  saveState();
}
/* Toggles light/dark theme via body.light and swaps the sun/moon icon */
function applyTheme(isLight) {
  document.body.classList.toggle('light', isLight);
  if (ui.moon) ui.moon.style.display = isLight ? 'none' : 'block';
  if (ui.sun) ui.sun.style.display = isLight ? 'block' : 'none';
}

/* Persists the current round to localStorage so a refresh resumes where you left off */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cells, currentPlayer, gameOver, scores, seconds, gameMode, playerNames,
    statusText: ui.statusText.textContent, statusTone: ui.status.className
  }));
}
/* Restores a saved round from localStorage; returns false if there's nothing to restore */
function loadState() {
  const saved = getSavedData(STORAGE_KEY, null);
  if (!saved) return false;
  cells = saved.cells || createBoard();
  currentPlayer = saved.currentPlayer || 'Player1';
  gameOver = Boolean(saved.gameOver);
  scores = { ...DEFAULT_SCORES, ...saved.scores };
  seconds = saved.seconds || 0;
  gameMode = saved.gameMode || 'pvp';
  playerNames = {
    ...DEFAULT_NAMES,
    Player1: saved.player1Name || DEFAULT_NAMES.Player1,
    Player2: saved.player2Name || DEFAULT_NAMES.Player2,
    ...(saved.playerNames || {})
  };
  setStatus(saved.statusText || '', saved.statusTone || '');
  return true;
}
/* Increments the given name's all-time win count in the leaderboard's localStorage entry */
function saveWin(name) {
  const leaderboard = getSavedData(LEADERBOARD_KEY, {});
  leaderboard[name] = (leaderboard[name] || 0) + 1;
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

/* Reflects gameMode in the UI: highlights the active mode button, disables P2 input in pvc */
function syncModeUI() {
  ui.modes.forEach((button) => button.classList.toggle('active', button.dataset.mode === gameMode));
  ui.inputs.Player2.disabled = gameMode === 'pvc';
}

/* Switches modes, renames Player 2 to "Computer" in pvc, and lets the computer move if it's its turn */
function setMode(mode) {
  gameMode = mode;
  playerNames.Player2 = mode === 'pvc' ? 'Computer' : DEFAULT_NAMES.Player2;
  renderNames();
  syncModeUI();
  saveState();
  scheduleComputerMove();
}
/* Handles name input typing; ignores Player 2 while locked to "Computer", falls back if blank */
function updatePlayerName(player) {
  if (player === 'Player2' && gameMode === 'pvc') return;
  playerNames[player] = ui.inputs[player].value.trim() || DEFAULT_NAMES[player];
  renderNames();
  if (!gameOver && currentPlayer === player) setStatus(`${playerName()}'s turn`);
  saveState();
}

function getAvailableRow(column) {
  // last empty cell in the column = the row the disc will land on
  return cells.map((row) => row[column]).lastIndexOf('');
}

/* Walks outward from (row, column) collecting consecutive cells owned by player */
function getLine(row, column, rowStep, columnStep, player) {
  const line = [];
  for (
    let r = row + rowStep, c = column + columnStep;
    r >= 0 && r < ROWS && c >= 0 && c < COLUMNS && cells[r][c] === player;
    r += rowStep, c += columnStep
  ) line.push([r, c]);
  return line;
}

/* Checks all 4 directions through the played cell; returns the connected cells if 4+ in a row */
function findWinningCells(row, column, player) {
  for (const [rowStep, columnStep] of DIRECTIONS) {
    const line = [[row, column],
      ...getLine(row, column, rowStep, columnStep, player),
      ...getLine(row, column, -rowStep, -columnStep, player)];
    if (line.length >= 4) return line;
  }
  return [];
}

function boardIsFull() {
  return cells.every((row) => row.every(Boolean));
}

/* Simple AI: win if possible, else block the opponent, else play randomly (tests moves by placing then undoing) */
function getComputerColumn() {
  const valid = Array.from({ length: COLUMNS }, (_, column) => column)
    .filter((column) => getAvailableRow(column) !== -1);
  const findTacticalMove = (player) => valid.find((column) => {
    const row = getAvailableRow(column);
    cells[row][column] = player;
    const wins = findWinningCells(row, column, player).length > 0;
    cells[row][column] = '';
    return wins;
  });
  // take a winning move if there is one, otherwise block the opponent's, otherwise play randomly
  return findTacticalMove('Player2')
    ?? findTacticalMove('Player1')
    ?? valid[Math.floor(Math.random() * valid.length)];
}

/* Ends the round: updates scores, records a win to the leaderboard + confetti, then re-renders and saves */
function endGame(message, tone, winner) {
  gameOver = true;
  stopTimer();
  if (winner) {
    scores[winner] += 1;
    saveWin(playerName(winner));
    launchConfetti();
    renderLeaderboard();
  } else scores.ties += 1;
  setStatus(message, tone);
  renderGame();
  saveState();
}

/* Drops the current player's piece into column; returns false if the column is full */
function playMove(column) {
  const row = getAvailableRow(column);
  if (row === -1) return false;
  cells[row][column] = currentPlayer;
  winningCells = findWinningCells(row, column, currentPlayer);
  if (winningCells.length) {
    endGame(`${playerName()} wins!`, currentPlayer === 'Player1' ? 'win-p1' : 'win-p2', currentPlayer);
  } else if (boardIsFull()) {
    endGame("It's a draw!", 'draw');
  } else {
    currentPlayer = nextPlayer();
    renderBoard();
    setStatus(`${playerName()}'s turn`);
    saveState();
  }
  return true;
}

/* Waits COMPUTER_DELAY ms then plays the computer's move, guarded by isComputerThinking */
function scheduleComputerMove() {
  if (gameMode !== 'pvc' || currentPlayer !== 'Player2' || gameOver || isComputerThinking || !hasStarted) return;
  isComputerThinking = true;
  setTimeout(() => {
    if (!gameOver && !isPaused && currentPlayer === 'Player2') playMove(getComputerColumn());
    isComputerThinking = false;
  }, COMPUTER_DELAY);
}

/* Clears round state (not scores/names) and re-locks the board behind Start; shared by New Game & Reset Game */
function resetRound() {
  stopTimer();
  cells = createBoard();
  currentPlayer = 'Player1';
  gameOver = false;
  isPaused = false;
  isComputerThinking = false;
  winningCells = [];
  seconds = 0;
  hasStarted = false;
  ui.pause.textContent = 'Pause';
  updateBoardLockState();
}

/* New Game: starts a fresh round, keeping scores and names, waiting for Start Game */
function restartGame() {
  resetRound();
  setStatus('Press Start to begin');
  renderGame();
  saveState();
}

/* Reset Game: wipes scores, mode, names, and storage back to first-load state */
function resetEverything() {
  scores = { ...DEFAULT_SCORES };
  gameMode = 'pvp';
  playerNames = { ...DEFAULT_NAMES };
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEADERBOARD_KEY);
  resetRound();
  renderNames();
  syncModeUI();
  setStatus('Press Start to begin');
  renderGame();
  renderLeaderboard();
  saveState();
}

/* Fires a confetti burst on a win, if the canvas-confetti library loaded */
function launchConfetti() {
  if (typeof confetti !== 'function') return;
  confetti({
    particleCount: 100, spread: 90, origin: { y: 0.4 },
    colors: ['#F66FB1', '#63E4EE', '#A93DFF', '#FFFFFF']
  });
}

/* ---------- Event Listeners ---------- */

/* Event delegation on the board instead of one listener per cell, since renderBoard() recreates cells */
ui.board.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');
  if (!cell || gameOver || isPaused || isComputerThinking || !hasStarted) return;
  if (playMove(Number(cell.dataset.col))) scheduleComputerMove();
});

ui.start.addEventListener('click', beginRound);
ui.pause.addEventListener('click', togglePause);
ui.restart.addEventListener('click', restartGame);
ui.reset.addEventListener('click', resetEverything);
ui.theme.addEventListener('click', () => {
  const isLight = !document.body.classList.contains('light');
  applyTheme(isLight);
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
});
ui.modes.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
ui.inputs.Player1.addEventListener('input', () => updatePlayerName('Player1'));
ui.inputs.Player2.addEventListener('input', () => updatePlayerName('Player2'));

/* ---------- Boot ---------- */

/* Boot: restore theme/round, sync UI, and wait behind Start overlay unless the restored game already ended */
applyTheme(localStorage.getItem(THEME_KEY) === 'light');
if (!loadState()) resetRound();
renderNames();
syncModeUI();
hasStarted = gameOver;
if (!gameOver) setStatus('Press Start to begin');
renderGame();
renderLeaderboard();
updateBoardLockState();
ui.board.classList.add('ready');
