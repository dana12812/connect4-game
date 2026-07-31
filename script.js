/*-------------- Constants -------------*/

// These values never change
const rows = 6;
const columns = 7;
const boardElement = document.querySelector('#gameBoard');
const statusMessage = document.querySelector('#statusMessage');
const restartButton = document.querySelector('#restartButton');
/*---------- Variables (State) ---------*/

// These values change while the game is running
let cells = []; 
let currentPlayer = 'Player1'; 
let gameOver = false; // turn true when someone wins

/*------------- Functions --------------*/

function init() { // To set up or reset the game.

    // Create a 6 × 7 game board filled with empty cells
    cells = Array.from({ length: rows }, () => Array(columns).fill(''));

    // Player 1 always starts the game
    currentPlayer = 'Player1';

    // The game starts as "not finished"
    gameOver = false;
}

// Start the game
init();

function render() {

    boardElement.innerHTML = ''; // Clear the old board before drawing a new one
    // Go through every row
    for (let row = 0; row < rows; row++) {
        // Go through every column in the current row
        for (let col = 0; col < columns; col++) {

            // Create one HTML cell (<div>)
            const cell = document.createElement('div');
            // Give the cell its basic CSS style
            cell.className = 'cell';

            // If this position contains a player's piece...
            if (cells[row][col]) {

                // Add the player's class (player1 or player2)
                cell.classList.add(cells[row][col]);
            }
            // Save the row number
            cell.dataset.row = row;
            // Save the column number
            cell.dataset.col = col;
            // Add the cell to the game board
            boardElement.appendChild(cell);
        }
    }
}

// Find the lowest empty row in the selected column
function getAvailableRow(col) {

    // Get all values from the selected column
    const colValues = cells.map(row => row[col]);

    // Return the index of the last empty cell
    return colValues.lastIndexOf('');
}

// Listen for clicks on the game board
boardElement.addEventListener('click', (e) => {
    if (gameOver) return;

    const col = Number(e.target.dataset.col);
    if (isNaN(col)) return;

    const row = getAvailableRow(col);
    if (row === -1) return;

    cells[row][col] = currentPlayer;

    currentPlayer = currentPlayer === 'Player1'
        ? 'Player2'
        : 'Player1';

    render();

    statusMessage.textContent = `${currentPlayer}'s turn`; // ← add this line
});



/*----------------- Boot ---------------*/

// Set up a new game
init();

// Draw the game board on the webpage
render();



