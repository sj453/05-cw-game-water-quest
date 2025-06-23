// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;          // Holds the interval for spawning items
let timer = 30;
let timerInterval;
let currentLevel = 1;
let difficulty = 'normal'; // 'easy', 'normal', 'hard'

const CANS_PER_LEVEL = 20;

const DIFFICULTY_SETTINGS = {
  easy:   { cansPerLevel: 15, spawnBase: 1200, spawnStep: 90, minSpawn: 400, timeFirst: 80, timeOther: 40 },
  normal: { cansPerLevel: 20, spawnBase: 1000, spawnStep: 80, minSpawn: 300, timeFirst: 60, timeOther: 30 },
  hard:   { cansPerLevel: 25, spawnBase: 800,  spawnStep: 100, minSpawn: 200, timeFirst: 40, timeOther: 20 }
};

let freebieAvailable = false;
let gemCount = 0;

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  // Clear all cells before spawning a new item
  cells.forEach(cell => (cell.innerHTML = ''));
  // Select a random cell from the grid to place the water can or jug
  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  const isRedJug = Math.random() < 0.25; // 25% chance for red jug
  if (isRedJug) {
    randomCell.innerHTML = `
      <div class="jug-wrapper">
        <img src="img/image.png" class="red-jug" alt="Red Jug" />
      </div>
    `;
    const jug = randomCell.querySelector('.red-jug');
    if (jug) {
      jug.addEventListener('click', function(e) {
        if (!gameActive) return;
        if (freebieAvailable) {
          freebieAvailable = false;
          // Optionally show a message for using the freebie
          const msg = document.getElementById('level-message');
          msg.textContent = 'Freebie used! No penalty.';
          msg.style.display = 'block';
          setTimeout(() => { msg.style.display = 'none'; }, 1800);
        } else {
          currentCans = Math.max(0, currentCans - 1);
          document.getElementById('current-cans').textContent = currentCans;
        }
        randomCell.innerHTML = '';
        e.stopPropagation();
      });
    }
  } else {
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <div class="water-can"></div>
      </div>
    `;
    const can = randomCell.querySelector('.water-can');
    if (can) {
      can.addEventListener('click', function(e) {
        if (!gameActive) return;
        currentCans++;
        document.getElementById('current-cans').textContent = currentCans;
        if (currentCans === getCansPerLevel()) {
          showConfetti();
          showLevelMessages(currentLevel + 1);
          // Pause the game at level completion
          gameActive = false;
          clearInterval(spawnInterval);
          pauseTimer();
          document.getElementById('pause-game').textContent = 'Resume';
          updateLevelDisplay();
          resetTimer(); // Reset timer for next level
        }
        randomCell.innerHTML = '';
        e.stopPropagation();
      });
    }
  }
}

function setGridActive(active) {
  const cells = document.querySelectorAll('.grid-cell');
  cells.forEach(cell => {
    if (active) {
      cell.classList.add('active');
    } else {
      cell.classList.remove('active');
    }
  });
}

// Timer functions
function updateTimerDisplay() {
  document.getElementById('timer').textContent = timer;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      clearInterval(timerInterval);
      endGame();
      showGameOver(); // Show game over message
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  timer = getLevelTime(currentLevel);
  updateTimerDisplay();
  clearInterval(timerInterval);
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  // Hide welcome message if visible
  const welcome = document.getElementById('welcome-message');
  if (welcome) welcome.style.display = 'none';
  // Hide game over message if visible
  const msg = document.getElementById('level-message');
  msg.style.display = 'none';
  msg.classList.remove('game-over');
  // If the player finished a level, reset score for next level
  if (currentCans === getCansPerLevel()) {
    currentCans = 0;
    document.getElementById('current-cans').textContent = currentCans;
    currentLevel++;
    updateLevelDisplay();
    checkFreebie();
    gemCount++;
    updateGemDisplay();
    spawnWaterCan.halfwayQuoteShown = false;
  } else {
    spawnWaterCan.halfwayQuoteShown = false;
  }
  timer = getLevelTime(currentLevel); // Set timer based on level
  updateTimerDisplay();
  gameActive = true;
  createGrid(); // Set up the game grid
  setGridActive(true); // Make boxes blue
  spawnInterval = setInterval(spawnWaterCan, getSpawnIntervalForLevel(currentLevel)); // Spawn items faster each level
  startTimer(); // Start the timer
}

function endGame() {
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  setGridActive(false); // Remove blue from boxes
}

function showGameOver() {
  const msg = document.getElementById('level-message');
  msg.textContent = 'Game Over!';
  msg.classList.add('game-over');
  msg.style.display = 'block';
}

// Set active class for selected difficulty button
function updateDifficultyButtons() {
  document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(difficulty + '-btn').classList.add('active');
}

function updateGoalText() {
  const goalText = document.getElementById('goal-text');
  if (goalText) {
    goalText.textContent = `Collect ${getCansPerLevel()} items to complete the level!`;
  }
}

function updateGemDisplay() {
  const gemBox = document.getElementById('gem-count-center') || document.getElementById('gem-count-top');
  if (gemBox) {
    gemBox.innerHTML = '';
    // Use the diamond emoji instead of an image
    const gemIcon = document.createElement('span');
    gemIcon.textContent = '💎';
    gemIcon.className = 'gem';
    gemBox.appendChild(gemIcon);
    // Add the gem count
    const label = document.createElement('span');
    label.textContent = ` x${gemCount}`;
    label.style.marginLeft = '8px';
    label.style.fontSize = '1.3rem';
    label.style.color = '#333';
    gemBox.appendChild(label);
  }
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);

// Pause button functionality
document.getElementById('pause-game').addEventListener('click', function() {
  if (gameActive) {
    gameActive = false;
    clearInterval(spawnInterval);
    pauseTimer();
    this.textContent = 'Resume';
  } else {
    gameActive = true;
    spawnInterval = setInterval(spawnWaterCan, getSpawnIntervalForLevel(currentLevel));
    startTimer();
    this.textContent = 'Pause';
  }
});

// Restart button functionality
document.getElementById('restart-game').addEventListener('click', function() {
  endGame();
  currentCans = 0;
  currentLevel = 1;
  freebieAvailable = false;
  gemCount = 0;
  document.getElementById('current-cans').textContent = currentCans;
  updateLevelDisplay();
  updateGemDisplay();
  resetTimer();
  createGrid();
  document.getElementById('pause-game').textContent = 'Pause';
});

document.getElementById('easy-btn').addEventListener('click', () => setDifficulty('easy'));
document.getElementById('normal-btn').addEventListener('click', () => setDifficulty('normal'));
document.getElementById('hard-btn').addEventListener('click', () => setDifficulty('hard'));

function setDifficulty(mode) {
  difficulty = mode;
  currentLevel = 1;
  currentCans = 0;
  freebieAvailable = false;
  gemCount = 0;
  updateLevelDisplay();
  document.getElementById('current-cans').textContent = currentCans;
  resetTimer();
  createGrid();
  document.getElementById('pause-game').textContent = 'Pause';
  updateDifficultyButtons();
  updateGoalText();
  updateGemDisplay();
}

function showConfetti() {
  const confettiContainer = document.getElementById('confetti-container');
  confettiContainer.innerHTML = '';
  for (let i = 0; i < 120; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = [
      '#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#FF902A', '#F5402C', '#159A48', '#F16061'
    ][Math.floor(Math.random() * 8)];
    confetti.style.animationDelay = (Math.random() * 2) + 's';
    confettiContainer.appendChild(confetti);
  }
  confettiContainer.style.display = 'block';
  setTimeout(() => {
    confettiContainer.innerHTML = '';
    confettiContainer.style.display = 'none';
  }, 3500);
}

function showLevelMessages(level) {
  const msg = document.getElementById('level-message');
  msg.textContent = `Level ${level - 1} Completed!`;
  msg.style.display = 'block';
  setTimeout(() => {
    msg.textContent = `Level ${level}: Hit Start to Start`;
    msg.style.display = 'block';
  }, 2500);
  setTimeout(() => {
    msg.style.display = 'none';
  }, 6000);
}

function updateLevelDisplay() {
  document.getElementById('current-level').textContent = currentLevel;
}

function getCansPerLevel() {
  return DIFFICULTY_SETTINGS[difficulty].cansPerLevel;
}

function getSpawnIntervalForLevel(level) {
  const s = DIFFICULTY_SETTINGS[difficulty];
  return Math.max(s.spawnBase - (level - 1) * s.spawnStep, s.minSpawn);
}

function getLevelTime(level) {
  const s = DIFFICULTY_SETTINGS[difficulty];
  return level <= 5 ? s.timeFirst : s.timeOther;
}

window.addEventListener('DOMContentLoaded', function() {
  const welcome = document.getElementById('welcome-message');
  if (welcome) {
    welcome.style.display = 'block';
  }
  updateDifficultyButtons();
  updateGoalText();
  updateGemDisplay();
});

function checkFreebie() {
  // Grant a freebie after every 5 levels completed (on level 6, 11, 16, ...)
  if ((currentLevel - 1) > 0 && (currentLevel - 1) % 5 === 0) {
    freebieAvailable = true;
    showFreebieMessage();
  }
}

function showFreebieMessage() {
  const msg = document.getElementById('level-message');
  msg.textContent = 'Freebie Unlocked! Next red jug is safe!';
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.display = 'none';
  }, 3000);
}
