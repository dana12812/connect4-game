/*-------------- Cached DOM Elements -------------*/

const boardElement = document.querySelector('#gameBoard');
const statusMessage = document.querySelector('#statusMessage');
const statusText = document.querySelector('#statusText');
const pauseButton = document.querySelector('#pauseButton');
const restartButton = document.querySelector('#restartButton');
const resetGameButton = document.querySelector('#resetGameButton');
const p1ScoreEl = document.querySelector('#p1Score');
const p2ScoreEl = document.querySelector('#p2Score');
const tieScoreEl = document.querySelector('#tieScore');
const timerDisplay = document.querySelector('#timerDisplay');
const themeButton = document.querySelector('#themeButton');
const themeIconMoon = document.querySelector('#themeIconMoon');
const themeIconSun = document.querySelector('#themeIconSun');
const modeButtons = document.querySelectorAll('.modeBtn');
const p1NameInput = document.querySelector('#p1NameInput');
const p2NameInput = document.querySelector('#p2NameInput');
const p1NameLabel = document.querySelector('#p1NameLabel');
const p2NameLabel = document.querySelector('#p2NameLabel');
const leaderboardList = document.querySelector('#leaderboardList');

/*-------------- Constants -------------*/

const rows = 6;
const columns = 7;
const STORAGE_KEY = 'connectFourState';
const THEME_KEY = 'connectFourTheme';
const LEADERBOARD_KEY = 'connectFourLeaderboard';
const COMPUTER_DELAY = 600;

/*---------- Variables (State) ---------*/

let cells = [];
let currentPlayer = 'Player1';
let gameOver = false;
let isPaused = false;
let scores = { Player1: 0, Player2: 0, ties: 0 };
let winningCells = [];
let seconds = 0;
let timerId = null;
let gameMode = 'pvp';
let player1Name = 'Player 1';
let player2Name = 'Player 2';
let isComputerThinking = false;