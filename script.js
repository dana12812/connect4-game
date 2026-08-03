/*-------------- Constants -------------*/

const rows = 6;
const columns = 7;
const boardElement = document.querySelector('#gameBoard');
const statusMessage = document.querySelector('#statusMessage');
const restartButton = document.querySelector('#restartButton');
const STORAGE_KEY = 'connectFourState';



/*---------- Variables (State) ---------*/

let cells = [];
let currentPlayer = 'Player1';
let gameOver = false;
/*------------- Functions --------------*/

/* ---- Setup ---- */

// resets the board and game state to a fresh start
const init = () => {
    cells = Array.from({ length: rows }, () => Array(columns).fill(''));
    currentPlayer = 'Player1';
    gameOver = false;
};


/* ---- Persistence (saving/loading across page reloads) ---- */

// saves the current game state so it survives a page reload
const saveState = () => {
    const state = {
        cells,
        currentPlayer,
        gameOver,
        statusText: statusMessage.textContent,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// loads a saved game if one exists — returns true if it found one
const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const state = JSON.parse(saved);
    cells = state.cells;
    currentPlayer = state.currentPlayer;
    gameOver = state.gameOver;
    statusMessage.textContent = state.statusText;
    return true;
};

/* ---- Rendering ---- */

// draws the cells array onto the page as circles
const render = () => {
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
};

/* ---- Game Logic ---- */

// finds the lowest empty row in a column (gravity)
const getAvailableRow = (col) => cells.map(row => row[col]).lastIndexOf('');

// walks outward in one direction, counting matching pieces
const countDirection = (row, col, dr, dc, player) => {
    let count = 0;

    Array.from({ length: Math.max(rows, columns) }).every((_, i) => {
        const r = row + dr * (i + 1);
        const c = col + dc * (i + 1);
        const isMatch = r >= 0 && r < rows && c >= 0 && c < columns && cells[r][c] === player;

        if (isMatch) count++;
        return isMatch; // false stops .every() immediately
    });

    return count;
};

// checks whether the piece just dropped completed 4 in a row
const checkWin = (row, col) => {
    const player = cells[row][col];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    return directions.some(([dr, dc]) =>
        1 + countDirection(row, col, dr, dc, player) + countDirection(row, col, -dr, -dc, player) >= 4
    );
};

// checks whether every cell on the board is filled
const isBoardFull = () => cells.every(row => row.every(cell => cell !== ''));


/* ---- Ending the game ---- */

// stops the game, redraws the board, shows a message, and saves
const endGame = (message) => {
    gameOver = true;
    render();
    statusMessage.textContent = message;
    saveState();
};

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
    saveState();
});

restartButton.addEventListener('click', () => {
    init();
    render();
    statusMessage.textContent = `${currentPlayer}'s turn`;
    saveState();
});

/*----------------- Boot ---------------*/

if (!loadState()) {
    init();
    statusMessage.textContent = `${currentPlayer}'s turn`;
}
render();

boardElement.classList.add('ready');
statusMessage.classList.add('ready');