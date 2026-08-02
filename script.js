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

//function 1
function init() {
    cells = Array.from({ length: rows }, () => Array(columns).fill(''));
    currentPlayer = 'Player1';
    gameOver = false;
}

//function 2
function render() {
    boardElement.innerHTML = '';
    cells.forEach((rowArray, row) => {
        rowArray.forEach((cell, col) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            if (cell) cellDiv.classList.add(cell);
            cellDiv.dataset.row = row;
            cellDiv.dataset.col = col;
            boardElement.appendChild(cellDiv);
        });
    });
}

//function 3
function getAvailableRow(col) {
    return cells.map(row => row[col]).lastIndexOf('');
}

//function 4
const countDirection = (row, col, dr, dc, player) => {
    const maxSteps = Math.max(rows, columns);
    let count = 0;

    Array.from({ length: maxSteps }).every((_, i) => {
        const step = i + 1;
        const r = row + dr * step;
        const c = col + dc * step;
        const isMatch = r >= 0 && r < rows && c >= 0 && c < columns && cells[r][c] === player;

        if (isMatch) count++;
        return isMatch;
    });

    return count;
};

//function 5
const checkWin = (row, col) => {
    const player = cells[row][col];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    return directions.some(([dr, dc]) =>
        1 + countDirection(row, col, dr, dc, player) + countDirection(row, col, -dr, -dc, player) >= 4
    );
};

//function 6
const isBoardFull = () => cells.every(row => row.every(cell => cell !== ''));

//function 7
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