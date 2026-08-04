// Update the status message
const setStatus = (text, tone) => {
    statusMessage.className = tone || '';
    statusText.textContent = text;
};
// Update the scoreboard
const renderScores = () => {
    p1ScoreEl.textContent = scores.Player1;
    p2ScoreEl.textContent = scores.Player2;
    tieScoreEl.textContent = scores.ties;
};
// Update the timer
const renderTimer = () => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${secs}`;
};
// Start the timer
const startTimer = () => {
    stopTimer();

    timerId = setInterval(() => {
        seconds++;
        renderTimer();
    }, 1000);
};
// Stop the timer
const stopTimer = () => {
    clearInterval(timerId);
    timerId = null;
};
// Pause or resume the game
const togglePause = () => {
    if (gameOver) return;
    isPaused = !isPaused;
    boardElement.classList.toggle('paused', isPaused);
    pauseButton.textContent = isPaused
        ? 'Resume'
        : 'Pause';
    if (isPaused) {
        stopTimer();
    } else {
        startTimer();
    }
};
pauseButton.addEventListener('click', togglePause);
// Apply the selected theme
const applyTheme = (isLight) => {
    document.body.classList.toggle('light', isLight);
    if (themeIconMoon) {
        themeIconMoon.style.display = isLight ? 'none' : 'block';
    }
    if (themeIconSun) {
        themeIconSun.style.display = isLight ? 'block' : 'none';
    }
};
// Theme button
themeButton.addEventListener('click', () => {
    const isLight = !document.body.classList.contains('light');
    applyTheme(isLight);
    localStorage.setItem(
        THEME_KEY,
        isLight ? 'light' : 'dark'
    );
});
// Confetti animation
const launchConfetti = () => {
    confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.4 },
        colors: [
            '#F66FB1',
            '#63E4EE',
            '#A93DFF',
            '#FFFFFF'
        ]
    });
};
// Save the current game
const saveState = () => {
    const state = {
        cells,
        currentPlayer,
        gameOver,
        scores,
        seconds,
        gameMode,
        player1Name,
        player2Name,
        statusText: statusText.textContent,
        statusTone: statusMessage.className
    };
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );
};
// Load a saved game
const loadState = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const state = JSON.parse(saved);
    cells = state.cells || Array.from({ length: rows }, () => Array(columns).fill(''));
    currentPlayer = state.currentPlayer || 'Player1';
    gameOver = state.gameOver || false;
    scores = state.scores || { Player1: 0, Player2: 0, ties: 0 };
    seconds = state.seconds || 0;
    gameMode = state.gameMode || 'pvp';
    player1Name = state.player1Name || 'Player 1';
    player2Name = state.player2Name || 'Player 2';
    setStatus(
        state.statusText || '',
        state.statusTone || ''
    );
    return true;
};
// Update player names
const updateNameLabels = () => {
    p1NameLabel.textContent = player1Name;
    p2NameLabel.textContent = player2Name;
};
// Load the leaderboard
const loadLeaderboard = () => {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    return saved ? JSON.parse(saved) : {};
};
// Record a player's win
const recordWin = (name) => {
    const board = loadLeaderboard();
    board[name] = (board[name] || 0) + 1;
    localStorage.setItem(
        LEADERBOARD_KEY,
        JSON.stringify(board)
    );
};
// Display the leaderboard
const renderLeaderboard = () => {
    const board = loadLeaderboard();
    const sorted = Object.entries(board).sort((a, b) => b[1] - a[1]);
    leaderboardList.innerHTML = '';
    if (sorted.length === 0) {
        leaderboardList.innerHTML = '<li>No wins recorded yet</li>';
        return;
    }
    sorted.forEach(([name, wins]) => {
        const li = document.createElement('li');
        li.textContent = `${name} — ${wins} win${wins === 1 ? '' : 's'}`;
        leaderboardList.appendChild(li);
    });
};
// Change game mode
modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        modeButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');
        gameMode = button.dataset.mode;
        if (gameMode === 'pvc') {
            player2Name = 'Computer';
            p2NameInput.value = 'Computer';
            p2NameInput.disabled = true;
        } else {
            player2Name = 'Player 2';
            p2NameInput.value = player2Name;
            p2NameInput.disabled = false;
        }
        updateNameLabels();
        saveState();
    });
});
// Player 1 name
// Update Player 1 name
p1NameInput.addEventListener('input', () => {
    player1Name = p1NameInput.value.trim() || 'Player 1';
    updateNameLabels();
    if (!gameOver && currentPlayer === 'Player1') {
        setStatus(`${player1Name}'s turn`, '');
    }
    saveState();
});
// Player 2 name
// Update Player 2 name
p2NameInput.addEventListener('input', () => {
    if (gameMode === 'pvc') return;
    player2Name = p2NameInput.value.trim() || 'Player 2';
    updateNameLabels();
    if (!gameOver && currentPlayer === 'Player2') {
        setStatus(`${player2Name}'s turn`, '');
    }
    saveState();
});
// Reset everything
const resetEverything = () => {
    stopTimer();
    scores = {
        Player1: 0,
        Player2: 0,
        ties: 0
    };
    gameMode = 'pvp';
    player1Name = 'Player 1';
    player2Name = 'Player 2';
    isPaused = false;
    isComputerThinking = false;
    modeButtons.forEach((button) => {
        button.classList.toggle(
            'active',
            button.dataset.mode === 'pvp'
        );
    });
    p1NameInput.value = player1Name;
    p2NameInput.value = player2Name;
    p2NameInput.disabled = false;
    updateNameLabels();
    boardElement.classList.remove('paused');
    pauseButton.textContent = 'Pause';
    init();
    render();
    renderScores();
    renderTimer();
    setStatus(`${player1Name}'s turn`, '');
    startTimer();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEADERBOARD_KEY);
    saveState();
    renderLeaderboard();
};
// Reset button
resetGameButton.addEventListener('click', resetEverything);
// Start the application
applyTheme(localStorage.getItem(THEME_KEY) === 'light');
if (!loadState()) {
    init();
}
p1NameInput.value = player1Name;
p2NameInput.value = player2Name;
updateNameLabels();
modeButtons.forEach((button) => {
    button.classList.toggle(
        'active',
        button.dataset.mode === gameMode
    );
});
if (gameMode === 'pvc') {
    p2NameInput.disabled = true;
}
const currentName =
    currentPlayer === 'Player1'
        ? player1Name
        : player2Name;

setStatus(`${currentName}'s turn`, '');
render();
renderScores();
renderTimer();
renderLeaderboard();
if (!gameOver) {
    startTimer();
}
boardElement.classList.add('ready'); //////////