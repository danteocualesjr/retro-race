// UI system for menus and HUD

const UI = {
    // Screen elements
    menuScreen: null,
    instructionsScreen: null,
    highScoresScreen: null,
    hud: null,
    gameOverScreen: null,
    pauseScreen: null,
    
    // HUD elements
    speedDisplay: null,
    lapDisplay: null,
    positionDisplay: null,
    timeDisplay: null,
    scoreDisplay: null,
    powerupIndicator: null,
    
    // Buttons
    startBtn: null,
    highScoresBtn: null,
    instructionsBtn: null,
    backBtn: null,
    backFromScoresBtn: null,
    retryBtn: null,
    menuBtn: null,
    
    // High scores
    highScoresList: null,
    
    init() {
        // Get screen elements
        this.menuScreen = document.getElementById('menu-screen');
        this.instructionsScreen = document.getElementById('instructions-screen');
        this.highScoresScreen = document.getElementById('high-scores-screen');
        this.hud = document.getElementById('hud');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        
        // Get HUD elements
        this.speedDisplay = document.getElementById('speed-display');
        this.lapDisplay = document.getElementById('lap-display');
        this.positionDisplay = document.getElementById('position-display');
        this.timeDisplay = document.getElementById('time-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.powerupIndicator = document.getElementById('powerup-indicator');
        
        // Get buttons
        this.startBtn = document.getElementById('start-btn');
        this.highScoresBtn = document.getElementById('high-scores-btn');
        this.instructionsBtn = document.getElementById('instructions-btn');
        this.backBtn = document.getElementById('back-btn');
        this.backFromScoresBtn = document.getElementById('back-from-scores-btn');
        this.retryBtn = document.getElementById('retry-btn');
        this.menuBtn = document.getElementById('menu-btn');
        
        // Get high scores list
        this.highScoresList = document.getElementById('high-scores-list');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show menu initially
        this.showMenu();
    },

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => {
            this.hideAllScreens();
            if (window.game) {
                window.game.start();
            }
        });
        
        this.highScoresBtn.addEventListener('click', () => {
            this.showHighScores();
        });
        
        this.instructionsBtn.addEventListener('click', () => {
            this.showInstructions();
        });
        
        this.backBtn.addEventListener('click', () => {
            this.showMenu();
        });
        
        this.backFromScoresBtn.addEventListener('click', () => {
            this.showMenu();
        });
        
        this.retryBtn.addEventListener('click', () => {
            this.hideAllScreens();
            if (window.game) {
                window.game.start();
            }
        });
        
        this.menuBtn.addEventListener('click', () => {
            if (window.game) {
                window.game.stop();
            }
            this.showMenu();
        });
    },

    hideAllScreens() {
        this.menuScreen.classList.add('hidden');
        this.instructionsScreen.classList.add('hidden');
        this.highScoresScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
    },

    showMenu() {
        this.hideAllScreens();
        this.menuScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
    },

    showInstructions() {
        this.hideAllScreens();
        this.instructionsScreen.classList.remove('hidden');
    },

    showHighScores() {
        this.hideAllScreens();
        this.highScoresScreen.classList.remove('hidden');
        this.loadHighScores();
    },

    showGameOver(score, time, position) {
        this.hideAllScreens();
        this.gameOverScreen.classList.remove('hidden');
        
        document.getElementById('final-score').textContent = score.toLocaleString();
        document.getElementById('final-time').textContent = Utils.formatTime(time);
        document.getElementById('final-position').textContent = position;
    },

    showPause() {
        this.pauseScreen.classList.remove('hidden');
    },

    hidePause() {
        this.pauseScreen.classList.add('hidden');
    },

    updateHUD(speed, lap, maxLaps, position, time, score, hasPowerUp) {
        if (this.speedDisplay) this.speedDisplay.textContent = speed;
        if (this.lapDisplay) this.lapDisplay.textContent = `${lap}/${maxLaps}`;
        if (this.positionDisplay) this.positionDisplay.textContent = position;
        if (this.timeDisplay) this.timeDisplay.textContent = Utils.formatTime(time);
        if (this.scoreDisplay) this.scoreDisplay.textContent = score.toLocaleString();
        
        if (hasPowerUp) {
            this.powerupIndicator.classList.remove('hidden');
        } else {
            this.powerupIndicator.classList.add('hidden');
        }
    },

    loadHighScores() {
        const scores = this.getHighScores();
        this.highScoresList.innerHTML = '';
        
        if (scores.length === 0) {
            this.highScoresList.innerHTML = '<p>No high scores yet!</p>';
            return;
        }
        
        scores.forEach((score, index) => {
            const item = document.createElement('div');
            item.className = 'score-item';
            item.innerHTML = `
                <span>${index + 1}. ${score.name || 'Player'}</span>
                <span>${score.score.toLocaleString()} pts</span>
            `;
            this.highScoresList.appendChild(item);
        });
    },

    getHighScores() {
        const scoresJson = localStorage.getItem('retroRaceHighScores');
        if (!scoresJson) return [];
        
        try {
            return JSON.parse(scoresJson);
        } catch (e) {
            return [];
        }
    },

    saveHighScore(score, time, position) {
        const scores = this.getHighScores();
        
        // Add new score
        scores.push({
            score: score,
            time: time,
            position: position,
            date: new Date().toISOString(),
            name: 'Player'
        });
        
        // Sort by score (descending)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        const topScores = scores.slice(0, 10);
        
        // Save to localStorage
        localStorage.setItem('retroRaceHighScores', JSON.stringify(topScores));
    }
};
