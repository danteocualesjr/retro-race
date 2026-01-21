// Main entry point

window.addEventListener('DOMContentLoaded', () => {
    // Initialize UI
    UI.init();
    
    // Get canvas
    const canvas = document.getElementById('gameCanvas');
    
    // Create game instance
    window.game = new Game(canvas);
    
    // Handle game state changes
    const gameStateObserver = {
        observe: (game) => {
            if (game.state === GameState.PAUSED) {
                UI.showPause();
            } else if (game.state === GameState.PLAYING) {
                UI.hidePause();
            }
        }
    };
    
    // Monitor game state (simple polling for now)
    setInterval(() => {
        if (window.game) {
            gameStateObserver.observe(window.game);
        }
    }, 100);
});
