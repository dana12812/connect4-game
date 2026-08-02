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
            if (cells[row][col]) cell.classList.add(cells[row][col]);
            cell.dataset.row = row;
            cell.dataset.col = col;
            boardElement.appendChild(cell);
        }
    }
}

function getAvailableRow(col) {
    return cells.map(row => row[col]).lastIndexOf('');
}

const countDirection = (row, col, dr, dc, player) => {
    let r = row + dr, c = col + dc, count = 0;
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
    return directions.some(([dr, dc]) =>
        1 + countDirection(row, col, dr, dc, player) + countDirection(row, col, -dr, -dc, player) >= 4
    );
};

const isBoardFull = () => cells.every(row => row.every(cell => cell !== ''));

// ends the game and shows a message — used by both win and draw
function endGame(message) {
    gameOver = true;
    render();
    statusMessage.textContent = message;
}

/*----------- Event Listeners ----------*/

boardElement.addEventListener('click', (e) => {
    if (gameOver) return;

    const col = Number(e.target.dataset.col);
    if (isNaN(col)) return;

    const row = getAvailableRow(col);
    if (row === -1) return;

    cells[row][col] = currentPlayer;

    if (checkWin(row, col)) return endGame(`${currentPlayer} wins!`);
    if (isBoardFull()) return endGame(`It's a draw!`);

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