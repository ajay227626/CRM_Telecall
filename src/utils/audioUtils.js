// DTMF Frequencies (Dual Tone Multi-Frequency)
const dtmfFrequencies = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

let audioContext = null;

const initAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
};

export const playDtmfTone = (key) => {
    try {
        initAudioContext();
        if (!audioContext) return;

        // Resume context if suspended (browser policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const freqs = dtmfFrequencies[key];
        if (!freqs) return;

        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator1.frequency.value = freqs[0];
        oscillator2.frequency.value = freqs[1];

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.value = 0.1; // Volume

        oscillator1.start();
        oscillator2.start();

        // Stop after duration
        setTimeout(() => {
            oscillator1.stop();
            oscillator2.stop();
        }, 150); // 150ms tone
    } catch (error) {
        console.warn("Audio play failed", error);
    }
};
