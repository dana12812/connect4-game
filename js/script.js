/* ---------- DOM Elements ---------- */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

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
const STORAGE_KEY = 'connectFourState';
const THEME_KEY = 'connectFourTheme';
const LEADERBOARD_KEY = 'connectFourLeaderboard';
const COMPUTER_DELAY = 600;
const PLAYERS = ['Player1', 'Player2'];
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const DEFAULT_SCORES = { Player1: 0, Player2: 0, ties: 0 };
const DEFAULT_NAMES = { Player1: 'Player 1', Player2: 'Player 2' };

/* ---------- Variables ---------- */

let cells = [];
let currentPlayer = 'Player1';
let gameOver = false;
let isPaused = false;
let isComputerThinking = false;
let winningCells = [];
let seconds = 0;
let timerId = null;
let gameMode = 'pvp';
let scores = { ...DEFAULT_SCORES };
let playerNames = { ...DEFAULT_NAMES };

/* ---------- Functions ---------- */

const createBoard = () => Array.from({ length: ROWS }, () => Array(COLUMNS).fill(''));
const playerName = (player = currentPlayer) => playerNames[player];
const nextPlayer = (player = currentPlayer) => player === 'Player1' ? 'Player2' : 'Player1';
const setStatus = (text, tone = '') => {
  ui.status.className = tone;
  ui.statusText.textContent = text;
};

function getSavedData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

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

function renderScores() {
  Object.entries(scores).forEach(([player, score]) => ui.scores[player].textContent = score);
}

function renderTimer() {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  ui.timer.textContent = `${minutes}:${secs}`;
}

function renderNames() {
  PLAYERS.forEach((player) => {
    ui.labels[player].textContent = playerNames[player];
    ui.inputs[player].value = playerNames[player];
  });
}

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

function renderGame() {
  renderBoard();
  renderScores();
  renderTimer();
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    seconds += 1;
    renderTimer();
  }, 1000);
}
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
function applyTheme(isLight) {
  document.body.classList.toggle('light', isLight);
  if (ui.moon) ui.moon.style.display = isLight ? 'none' : 'block';
  if (ui.sun) ui.sun.style.display = isLight ? 'block' : 'none';
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cells, currentPlayer, gameOver, scores, seconds, gameMode, playerNames,
    statusText: ui.statusText.textContent, statusTone: ui.status.className
  }));
}
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
function saveWin(name) {
  const leaderboard = getSavedData(LEADERBOARD_KEY, {});
  leaderboard[name] = (leaderboard[name] || 0) + 1;
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}

function syncModeUI() {
  ui.modes.forEach((button) => button.classList.toggle('active', button.dataset.mode === gameMode));
  ui.inputs.Player2.disabled = gameMode === 'pvc';
}

function setMode(mode) {
  gameMode = mode;
  playerNames.Player2 = mode === 'pvc' ? 'Computer' : DEFAULT_NAMES.Player2;
  renderNames();
  syncModeUI();
  saveState();
  scheduleComputerMove();
}
function updatePlayerName(player) {
  if (player === 'Player2' && gameMode === 'pvc') return;
  playerNames[player] = ui.inputs[player].value.trim() || DEFAULT_NAMES[player];
  renderNames();
  if (!gameOver && currentPlayer === player) setStatus(`${playerName()}'s turn`);
  saveState();
}

function getAvailableRow(column) {
  return cells.map((row) => row[column]).lastIndexOf('');
}

function getLine(row, column, rowStep, columnStep, player) {
  const line = [];
  for (
    let r = row + rowStep, c = column + columnStep;
    r >= 0 && r < ROWS && c >= 0 && c < COLUMNS && cells[r][c] === player;
    r += rowStep, c += columnStep
  ) line.push([r, c]);
  return line;
}

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
  return findTacticalMove('Player2')
    ?? findTacticalMove('Player1')
    ?? valid[Math.floor(Math.random() * valid.length)];
}

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

function scheduleComputerMove() {
  if (gameMode !== 'pvc' || currentPlayer !== 'Player2' || gameOver || isComputerThinking) return;
  isComputerThinking = true;
  setTimeout(() => {
    if (!gameOver && !isPaused && currentPlayer === 'Player2') playMove(getComputerColumn());
    isComputerThinking = false;
  }, COMPUTER_DELAY);
}

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

function restartGame() {
  resetRound();
  setStatus(`${playerName()}'s turn`);
  renderGame();
  startTimer();
  saveState();
}

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

function launchConfetti() {
  if (typeof confetti !== 'function') return;
  confetti({
    particleCount: 100, spread: 90, origin: { y: 0.4 },
    colors: ['#F66FB1', '#63E4EE', '#A93DFF', '#FFFFFF']
  });
}

/* ---------- Event Listeners ---------- */

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
