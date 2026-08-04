// Create a new game
const init = () => {
    cells = Array.from({ length: rows }, () => Array(columns).fill(''));
    currentPlayer = 'Player1';
    gameOver = false;
    winningCells = [];
    seconds = 0;
};
// Draw the game board
const render = () => {
    boardElement.innerHTML = '';
    cells.forEach((rowArray, row) => {
        rowArray.forEach((cell, col) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            if (cell) cellDiv.classList.add(cell);
            if (winningCells.some(([r, c]) => r === row && c === col)) {
                cellDiv.classList.add('win');
            }
            cellDiv.dataset.row = row;
            cellDiv.dataset.col = col;
            boardElement.appendChild(cellDiv);
        });
    });
};
// Find the next empty row
const getAvailableRow = (col) => {
    const columnValues = cells.map(row => row[col]);
    return columnValues.lastIndexOf('');
};
// Count connected pieces
const countDirection = (row, col, dr, dc, player, collected) => {
    let count = 0;
    for (let i = 1; i < Math.max(rows, columns); i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (
            r >= 0 &&
            r < rows &&
            c >= 0 &&
            c < columns &&
            cells[r][c] === player
        ) {
            count++;
            collected.push([r, c]);
        } else {
            break;
        }
    }
    return count;
};
// Check for a winner
const checkWin = (row, col) => {
    const player = cells[row][col];
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];
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
// Check if the board is full
const isBoardFull = () => {
    return cells.every(row => row.every(cell => cell !== ''));
};
// Check if a move would win
const isWinningMove = (row, col, player) => {
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];
    return directions.some(([dr, dc]) => {
        const collected = [[row, col]];
        const forward = countDirection(row, col, dr, dc, player, collected);
        const backward = countDirection(row, col, -dr, -dc, player, collected);
        return 1 + forward + backward >= 4;
    });
};
// Choose the best computer move
const getComputerColumn = () => {
    const validColumns = [];
    for (let col = 0; col < columns; col++) {
        if (getAvailableRow(col) !== -1) {
            validColumns.push(col);
        }
    }
    // Try to win
    for (const col of validColumns) {
        const row = getAvailableRow(col);
        cells[row][col] = 'Player2';
        const win = isWinningMove(row, col, 'Player2');
        cells[row][col] = '';
        if (win) return col;
    }
    // Block the player
    for (const col of validColumns) {
        const row = getAvailableRow(col);
        cells[row][col] = 'Player1';
        const block = isWinningMove(row, col, 'Player1');
        cells[row][col] = '';
        if (block) return col;
    }
    // Pick a random valid column
    return validColumns[Math.floor(Math.random() * validColumns.length)];
};

// Computer turn
const computerPlay = () => {
    if (gameOver || isPaused) return;
    const col = getComputerColumn();
    const row = getAvailableRow(col);
    cells[row][col] = currentPlayer;
    if (checkWin(row, col)) {
        scores[currentPlayer]++;
        recordWin(player2Name);
        renderScores();
        renderLeaderboard();
        launchConfetti();
        setStatus(`${player2Name} wins!`, 'win-p2');
        endGame();
        return;
    }
    if (isBoardFull()) {
        scores.ties++;
        renderScores();
        setStatus(`It's a draw!`, 'draw');
        endGame();
        return;
    }
    currentPlayer = 'Player1';
    render();
    setStatus(`${player1Name}'s turn`, '');
    saveState();
};
// Finish the game
const endGame = () => {
    gameOver = true;
    stopTimer();
    render();
    saveState();
};
// Handle board clicks
boardElement.addEventListener('click', (event) => {
    if (gameOver || isPaused || isComputerThinking) return;
    const col = Number(event.target.dataset.col);
    if (isNaN(col)) return;
    const row = getAvailableRow(col);
    if (row === -1) return;
    cells[row][col] = currentPlayer;
    const currentName = currentPlayer === 'Player1'
        ? player1Name
        : player2Name;
    if (checkWin(row, col)) {
        scores[currentPlayer]++;
        recordWin(currentName);
        renderScores();
        renderLeaderboard();
        launchConfetti();
        const tone = currentPlayer === 'Player1'
            ? 'win-p1'
            : 'win-p2';
        setStatus(`${currentName} wins!`, tone);
        endGame();
        return;
    }
    if (isBoardFull()) {
        scores.ties++;
        renderScores();
        setStatus(`It's a draw!`, 'draw');
        endGame();
        return;
    }
    currentPlayer = currentPlayer === 'Player1'
        ? 'Player2'
        : 'Player1';
    const nextName = currentPlayer === 'Player1'
        ? player1Name
        : player2Name;
    render();
    setStatus(`${nextName}'s turn`, '');
    saveState();
    if (
        gameMode === 'pvc' &&
        currentPlayer === 'Player2' &&
        !gameOver
    ) {
        isComputerThinking = true;
        setTimeout(() => {
            computerPlay();
            isComputerThinking = false;
        }, COMPUTER_DELAY);
    }
});
// Restart the current game
restartButton.addEventListener('click', () => {
    init();
    render();
    renderTimer();
    setStatus(`${player1Name}'s turn`, '');
    startTimer();
    saveState();
});