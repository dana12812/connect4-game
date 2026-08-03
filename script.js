/*========================= MVP =========================*/

/*-------------- Constants -------------*/
const rows = 6, columns = 7;
const boardElement = document.querySelector('#gameBoard');
const statusText = document.querySelector('#statusText');
const restartButton = document.querySelector('#restartButton');

/*---------- Variables (State) ---------*/
let cells = [], currentPlayer = 'Player1', gameOver = false;

/*-------------- Functions -------------*/

// resets the board and turn to a fresh start
const init = () => {
  cells = Array.from({ length: rows }, () => Array(columns).fill(''));
  currentPlayer = 'Player1';
  gameOver = false;
};

// draws the cells array onto the page as circles
const render = () => {
  boardElement.innerHTML = '';
  cells.forEach((rowArray, row) => rowArray.forEach((cell, col) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'cell';
    if (cell) cellDiv.classList.add(cell);
    if (winningCells.some(([r, c]) => r === row && c === col)) cellDiv.classList.add('win');
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;
    boardElement.appendChild(cellDiv);
  }));
};

// finds the lowest empty row in a column (gravity)
const getAvailableRow = (col) => cells.map(row => row[col]).lastIndexOf('');

// walks outward in one direction, counting matches
const countDirection = (row, col, dr, dc, player, collected) => {
  let count = 0;
  Array.from({ length: Math.max(rows, columns) }).every((_, i) => {
    const r = row + dr * (i + 1), c = col + dc * (i + 1);
    const isMatch = r >= 0 && r < rows && c >= 0 && c < columns && cells[r][c] === player;
    if (isMatch) { count++; collected.push([r, c]); }
    return isMatch;
  });
  return count;
};

// checks whether the piece just dropped completed 4 in a row
const checkWin = (row, col) => {
  const player = cells[row][col];
  return [[0, 1], [1, 0], [1, 1], [1, -1]].some(([dr, dc]) => {
    const collected = [[row, col]];
    const total = 1 + countDirection(row, col, dr, dc, player, collected) + countDirection(row, col, -dr, -dc, player, collected);
    if (total >= 4) winningCells = collected;
    return total >= 4;
  });
};

// checks whether every cell on the board is filled
const isBoardFull = () => cells.every(row => row.every(cell => cell !== ''));

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
    setStatus(`${currentPlayer} wins!`, currentPlayer === 'Player1' ? 'win-p1' : 'win-p2');
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
const statusIcon = document.querySelector('#statusIcon');
const pauseButton = document.querySelector('#pauseButton');
const p1ScoreEl = document.querySelector('#p1Score');
const p2ScoreEl = document.querySelector('#p2Score');
const tieScoreEl = document.querySelector('#tieScore');
const timerDisplay = document.querySelector('#timerDisplay');
const confettiCanvas = document.querySelector('#confettiCanvas');
const confettiCtx = confettiCanvas.getContext('2d');
const STORAGE_KEY = 'connectFourState';
const ICONS = {
  win: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/></svg>`,
  draw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
};

/*---------- Variables (State) ---------*/
let isPaused = false, scores = { Player1: 0, Player2: 0, ties: 0 };
let winningCells = [], seconds = 0, timerId = null, confettiParticles = [];

/*-------------- Functions -------------*/

// status banner text/icon/glow
const setStatus = (text, tone) => {
  statusMessage.className = tone || '';
  statusText.textContent = text;
  statusIcon.innerHTML = tone === 'win-p1' || tone === 'win-p2' ? ICONS.win : tone === 'draw' ? ICONS.draw : '';
};

// score numbers + leader badge
const renderScores = () => {
  [[p1ScoreEl, scores.Player1], [p2ScoreEl, scores.Player2], [tieScoreEl, scores.ties]].forEach(([el, val]) => {
    if (el.textContent === String(val)) return;
    el.textContent = val;
    el.classList.add('pulse');
    setTimeout(() => el.classList.remove('pulse'), 400);
  });
  document.querySelectorAll('.score').forEach(c => c.classList.remove('leading'));
  if (scores.Player1 > scores.Player2 && scores.Player1 > 0) document.querySelector('.score.p1').classList.add('leading');
  if (scores.Player2 > scores.Player1 && scores.Player2 > 0) document.querySelector('.score.p2').classList.add('leading');
};

// timer
const renderTimer = () => timerDisplay.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const startTimer = () => { stopTimer(); timerId = setInterval(() => { seconds++; renderTimer(); }, 1000); };
const stopTimer = () => { clearInterval(timerId); timerId = null; };

// pause
const togglePause = () => {
  if (gameOver) return;
  isPaused = !isPaused;
  boardElement.classList.toggle('paused', isPaused);
  pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
  isPaused ? stopTimer() : startTimer();
};
pauseButton.addEventListener('click', togglePause);

const launchConfetti = () => {
  const colors = ['#F66FB1', '#63E4EE', '#A93DFF', '#ffffff'];
  confettiParticles = Array.from({ length: 60 }, () => ({
    x: innerWidth / 2,
    y: innerHeight * 0.3,
    vx: (Math.random() - 0.5) * 8,
    vy: Math.random() * -8 - 2,
    color: colors[Math.floor(Math.random() * 4)],
    life: 100,
  }));
  animateConfetti();
};
const animateConfetti = () => {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach(p => {
    p.vy += 0.2;
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    confettiCtx.globalAlpha = p.life / 100;
    confettiCtx.fillStyle = p.color;
    confettiCtx.beginPath();
    confettiCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    confettiCtx.fill();
  });
  confettiParticles = confettiParticles.filter(p => p.life > 0);
  if (confettiParticles.length) requestAnimationFrame(animateConfetti);
};
// persistence
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({
  cells, currentPlayer, gameOver, scores, seconds, statusText: statusText.textContent, statusTone: statusMessage.className,
}));
const loadState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;
  const s = JSON.parse(saved);
  cells = s.cells || Array.from({ length: rows }, () => Array(columns).fill(''));
  currentPlayer = s.currentPlayer || 'Player1';
  gameOver = s.gameOver || false;
  scores = s.scores || { Player1: 0, Player2: 0, ties: 0 };
  seconds = s.seconds || 0;
  setStatus(s.statusText || '', s.statusTone || '');
  return true;
};

// ends the game, redraws, saves — caller sets the message beforehand
const endGame = () => { gameOver = true; stopTimer(); render(); saveState(); };


/*----------------- Boot ---------------*/
resizeConfettiCanvas();
if (!loadState()) { init(); setStatus(`${currentPlayer}'s turn`, ''); }
render();
renderScores();
renderTimer();
if (!gameOver) startTimer();
boardElement.classList.add('ready');