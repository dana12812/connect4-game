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

const countDirection = (row, col, dr, dc, player) => {
  // Step 1: move one step away from the starting piece in the given direction
  // (we don't want to count the piece itself, only what's around it)
  let r = row + dr;
  let c = col + dc;

  // Step 2: start the tally at zero, since we haven't found any matches yet
  let count = 0;

  // Step 3: keep repeating as long as ALL of these are true —
  // still a valid row, still a valid column, and the piece here matches
  while (r >= 0 && r < rows && c >= 0 && c < columns && cells[r][c] === player) {

    // Step 4: it matched — add one to the tally
    count++;

    // Step 5: move one more step further in the same direction,
    // so the next loop check looks at the next cell over
    r += dr;
    c += dc;

    // Step 6: loop back up to Step 3 and check again from this new position
  }

  // Step 7: the loop stopped (off the board, empty cell, or wrong player) —
  // hand back however many matches were found before that happened
  return count;
};

























/*----------------- Boot ---------------*/

// Set up a new game
init();

// Draw the game board on the webpage
render();



