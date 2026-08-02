/*-------------- Constants -------------*/

const rows = 6;
const columns = 7;
const boardElement = document.querySelector('#gameBoard');
const statusMessage = document.querySelector('#statusMessage');
const restartButton = document.querySelector('#restartButton');

/*---------- Variables (State) ---------*/

let cells = [];
let currentPlayer = 'Player1';
let gameOver = false;

/*------------- Functions --------------*/

function init() {
    cells = Array.from({ length: rows }, () => Array(columns).fill(''));
    currentPlayer = 'Player1';
    gameOver = false;
}

function render() {
    boardElement.innerHTML = '';
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (cells[row][col]) {
                cell.classList.add(cells[row][col]);
            }
            cell.dataset.row = row;
            cell.dataset.col = col;
            boardElement.appendChild(cell);
        }
    }
}

function getAvailableRow(col) {
    const colValues = cells.map(row => row[col]);
    return colValues.lastIndexOf('');
}

const countDirection = (row, col, dr, dc, player) => {
  let r = row + dr;
  let c = col + dc;
  let count = 0;

  while (r >= 0 && r < rows && c >= 0 && c < columns && cells[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }

  return count;
};

const checkWin = (row, col) => {
    const player = cells[row][col];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of directions) {
        const total = 1 + countDirection(row, col, dr, dc, player) + countDirection(row, col, -dr, -dc, player);
        if (total >= 4) return true;
    }

    return false;
};

const isBoardFull = () => {
  return cells.every(row => row.every(cell => cell !== ''));
};

/*----------- Event Listeners ----------*/

boardElement.addEventListener('click', (e) => {
    if (gameOver) return;

    const col = Number(e.target.dataset.col);
    if (isNaN(col)) return;

    const row = getAvailableRow(col);
    if (row === -1) return;

    cells[row][col] = currentPlayer;

    if (checkWin(row, col)) {
        gameOver = true;
        render();
        statusMessage.textContent = `${currentPlayer} wins!`;
        return;
    }

    if (isBoardFull()) {
        gameOver = true;
        render();
        statusMessage.textContent = `It's a draw!`;
        return;
    }

    currentPlayer = currentPlayer === 'Player1' ? 'Player2' : 'Player1';

    render();

    statusMessage.textContent = `${currentPlayer}'s turn`;
});

restartButton.addEventListener('click', () => {
    init();
    render();
    statusMessage.textContent = `${currentPlayer}'s turn`;
});

/*----------------- Boot ---------------*/

init();
render();