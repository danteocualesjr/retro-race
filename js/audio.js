// Audio system for game sounds

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.masterVolume = 0.5;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    // Create a simple beep sound
    createBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Engine sound (continuous)
    createEngineSound() {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gainNode.gain.value = 0;

        oscillator.start();

        return {
            oscillator,
            gainNode,
            filter,
            setSpeed: (speed) => {
                const normalizedSpeed = Math.min(speed / 200, 1);
                oscillator.frequency.value = 100 + normalizedSpeed * 200;
                filter.frequency.value = 500 + normalizedSpeed * 1500;
                gainNode.gain.value = normalizedSpeed * this.masterVolume * 0.2;
            },
            stop: () => {
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                setTimeout(() => oscillator.stop(), 100);
            }
        };
    }

    // Play collision sound
    playCollision() {
        this.createBeep(150, 0.1, 'square');
        setTimeout(() => this.createBeep(100, 0.1, 'square'), 50);
    }

    // Play power-up collection sound
    playPowerUp() {
        this.createBeep(400, 0.1);
        setTimeout(() => this.createBeep(600, 0.1), 50);
        setTimeout(() => this.createBeep(800, 0.1), 100);
    }

    // Play lap complete sound
    playLapComplete() {
        this.createBeep(523, 0.15);
        setTimeout(() => this.createBeep(659, 0.15), 150);
        setTimeout(() => this.createBeep(784, 0.3), 300);
    }

    // Play countdown beep
    playCountdown() {
        this.createBeep(440, 0.2);
    }

    // Play race start sound
    playRaceStart() {
        this.createBeep(523, 0.1);
        setTimeout(() => this.createBeep(659, 0.1), 100);
        setTimeout(() => this.createBeep(784, 0.2), 200);
    }
}
