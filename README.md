# Connect Four

A browser-based implementation of the classic **Connect Four** game built with **HTML, CSS, and JavaScript**. The game features both Player vs Player and Player vs Computer modes, a timer, leaderboard, dark/light themes, local storage, and a responsive interface.

---

## Live Demo

Play the game here:

**https://dana12812.github.io/connect4-game/**

---

## Game Preview

### Home Screen

> Save as `screenshots/home.png`

![Home Screen](screenshots/home.png)

### Gameplay

> Save as `screenshots/gameplay.png`

![Gameplay](screenshots/gameplay.png)

### Winning Screen

> Save as `screenshots/winner.png`

![Winning Screen](screenshots/winner.png)

### Light Theme

> Save as `screenshots/light-theme.png`

![Light Theme](screenshots/light-theme.png)

### Mobile Layout

> Save as `screenshots/mobile.png`

![Mobile Layout](screenshots/mobile.png)

---

## Features

- Player vs Player mode
- Player vs Computer mode
- Custom player names
- Scoreboard
- Leaderboard
- Timer
- Pause and Resume
- New Game
- Reset Game
- Local Storage
- Dark Theme
- Light Theme
- Winning animations using Canvas Confetti
- Responsive design for desktop, tablet, and mobile devices

---

## Built With

- HTML5
- CSS3
- JavaScript (ES6)
- CSS Grid
- Flexbox
- Local Storage API

---

## Folder Structure

```text
connect4-game
│
├── README.md
├── index.html
│
├── css
│   ├── style.css
│   ├── responsive.css
│   └── lightTheme.css
│
└── js
    ├── data.js
    ├── game.js
    └── ui.js
```

---

## How to Play

1. Enter player names.
2. Select either **Two Players** or **Vs Computer**.
3. Click on a column to drop your disc.
4. Players alternate turns.
5. Connect four discs horizontally, vertically, or diagonally to win.
6. Use **Pause** to stop the timer.
7. **New Game** starts another round while keeping scores.
8. **Reset Game** clears all scores, names, and saved data.

---

## Technologies

### Frontend

- HTML5
- CSS3
- JavaScript (ES6)

### Design

- CSS Grid
- Flexbox
- Media Queries
- Glassmorphism UI

## Installation

Clone the repository.

```bash
git clone https://github.com/dana12812/connect4-game.git
```

Navigate into the project.

```bash
cd connect4-game
```

Open `index.html` in your preferred web browser.

---

## Future Enhancements

- Multiple AI difficulty levels
- Sound effects
- Disc drop animations
- Online multiplayer
- Player statistics
- Undo move
- Match history
- Best-of-three game mode

---

## Attributions

The following external resources were used during the development of this project.

### Google Fonts

- Poppins
- Cinzel

https://fonts.google.com/

### Canvas Confetti

Used to display the winning celebration animation.

https://www.npmjs.com/package/canvas-confetti

Loaded via jsDelivr CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"></script>
```

https://www.jsdelivr.com/

### MDN Web Docs

Used as a reference for:

- HTML
- CSS
- JavaScript
- DOM Manipulation
- Local Storage
- Event Listeners

https://developer.mozilla.org/

### General Assembly

Project requirements and course materials.

---

## Author

**Dana Alsaleh**

GitHub

https://github.com/dana12812

---

## License

This project was created for educational purposes as part of the General Assembly Software Engineering Bootcamp.