/* ---------- DOM Elements ---------- */

/* Tiny query-selector shorthands used everywhere below */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* Cache every DOM element the game touches, keyed by purpose, so the rest
   of the file never has to call document.querySelector again */
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
  leaderboard: $('#leaderboardList')
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

/* Rebuilds all 42 .cell divs from the `cells` array and swaps them into the DOM
   in one go (via a DocumentFragment) to avoid layout thrashing */
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
/* Pause/Resume button handler: freezes the clock and blocks moves (board.paused
   in CSS dims it and disables pointer events); resuming also lets a pending
   computer move proceed */
function togglePause() {
  if (gameOver) return;
  isPaused = !isPaused;
  ui.board.classList.toggle('paused', isPaused);
  ui.pause.textContent = isPaused ? 'Resume' : 'Pause';
  if (isPaused) stopTimer();
  else {
    startTimer();
    scheduleComputerMove();
  }
}
/* Toggles the light/dark theme by adding/removing body.light (see style.css)
   and swapping which sun/moon icon is visible */
function applyTheme(isLight) {
  document.body.classList.toggle('light', isLight);
  if (ui.moon) ui.moon.style.display = isLight ? 'none' : 'block';
  if (ui.sun) ui.sun.style.display = isLight ? 'block' : 'none';
}

/* Persists the current round (board, scores, names, status text) to localStorage
   so a page refresh resumes where the player left off */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cells, currentPlayer, gameOver, scores, seconds, gameMode, playerNames,
    statusText: ui.statusText.textContent, statusTone: ui.status.className
  }));
}
/* Restores a previously saved round from localStorage. Returns false if there
   was nothing to restore, so callers know to start a fresh round instead */
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

/* Reflects `gameMode` in the UI: highlights the active mode button and
   disables the Player 2 name input when playing against the computer */
function syncModeUI() {
  ui.modes.forEach((button) => button.classList.toggle('active', button.dataset.mode === gameMode));
  ui.inputs.Player2.disabled = gameMode === 'pvc';
}

/* Switches between 2-player and vs-computer mode; renames Player 2 to
   "Computer" (or restores the default name) and lets the computer move
   immediately if it's already its turn */
function setMode(mode) {
  gameMode = mode;
  playerNames.Player2 = mode === 'pvc' ? 'Computer' : DEFAULT_NAMES.Player2;
  renderNames();
  syncModeUI();
  saveState();
  scheduleComputerMove();
}
/* Handles typing in a name input: ignores Player 2 while it's locked to
   "Computer" in vs-computer mode, falls back to the default name if blank */
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

/* Walks outward from (row, column) one step at a time in direction
   (rowStep, columnStep), collecting consecutive cells owned by `player`.
   Used by findWinningCells to look both ways along a line (e.g. left+right). */
function getLine(row, column, rowStep, columnStep, player) {
  const line = [];
  for (
    let r = row + rowStep, c = column + columnStep;
    r >= 0 && r < ROWS && c >= 0 && c < COLUMNS && cells[r][c] === player;
    r += rowStep, c += columnStep
  ) line.push([r, c]);
  return line;
}

/* Checks all 4 line directions (horizontal, vertical, both diagonals) through
   the just-played cell; returns the connected cells (including the played one)
   if any direction has 4+ in a row, otherwise an empty array */
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

/* Simple AI for the "vs Computer" mode: take a winning move if one exists,
   otherwise block the opponent's winning move, otherwise play a random
   valid column. Tactical checks work by temporarily placing a piece,
   testing for a win, then undoing it. */
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

/* Ends the current round: stops the clock, updates scores (win or tie),
   records the win to the leaderboard + fires confetti, then re-renders and saves */
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

/* Drops the current player's piece into `column`. Returns false if the
   column is full (no move made). Otherwise places the piece, checks for a
   win or a full-board draw, and either ends the game or hands off to the
   next player. */
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

/* If it's the computer's turn in vs-computer mode, waits COMPUTER_DELAY ms
   (so the move doesn't feel instant) then plays it. Guards against firing
   again while a move is already pending via isComputerThinking. */
function scheduleComputerMove() {
  if (gameMode !== 'pvc' || currentPlayer !== 'Player2' || gameOver || isComputerThinking) return;
  isComputerThinking = true;
  setTimeout(() => {
    if (!gameOver && !isPaused && currentPlayer === 'Player2') playMove(getComputerColumn());
    isComputerThinking = false;
  }, COMPUTER_DELAY);
}

/* Clears the board and round-specific state (but not scores/names) —
   shared by both "New Game" and "Reset Game" */
function resetRound() {
  stopTimer();
  cells = createBoard();
  currentPlayer = 'Player1';
  gameOver = false;
  isPaused = false;
  isComputerThinking = false;
  winningCells = [];
  seconds = 0;
  ui.board.classList.remove('paused');
  ui.pause.textContent = 'Pause';
}

/* "New Game" button: starts a fresh round, keeping scores and player names */
function restartGame() {
  resetRound();
  setStatus(`${playerName()}'s turn`);
  renderGame();
  startTimer();
  saveState();
}

/* "Reset Game" button: wipes scores, mode, names, and saved storage,
   returning the whole app to its first-load state */
function resetEverything() {
  scores = { ...DEFAULT_SCORES };
  gameMode = 'pvp';
  playerNames = { ...DEFAULT_NAMES };
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEADERBOARD_KEY);
  resetRound();
  renderNames();
  syncModeUI();
  setStatus(`${playerName()}'s turn`);
  renderGame();
  renderLeaderboard();
  startTimer();
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

/* Single listener on the board (event delegation) instead of one per cell,
   since renderBoard() recreates all the cell elements on every move */
ui.board.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');
  if (!cell || gameOver || isPaused || isComputerThinking) return;
  if (playMove(Number(cell.dataset.col))) scheduleComputerMove();
});

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

/* Runs once on page load: restore theme, restore (or start) a round, sync
   all UI to that state, and kick off the timer / computer move if the
   restored game wasn't already over */
applyTheme(localStorage.getItem(THEME_KEY) === 'light');
if (!loadState()) resetRound();
renderNames();
syncModeUI();
if (!gameOver) setStatus(`${playerName()}'s turn`);
renderGame();
renderLeaderboard();
if (!gameOver) {
  startTimer();
  scheduleComputerMove();
}
ui.board.classList.add('ready');
