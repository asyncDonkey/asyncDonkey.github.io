// js/audioManager.js

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {}; // Conterrà i buffer audio caricati
let backgroundMusicSource = null; // Riferimento alla sorgente della musica di sottofondo
let backgroundMusicBuffer = null; // Buffer per la musica di sottofondo
let isMusicPlaying = false;
const masterGainNode = audioContext.createGain(); // Nodo Gain principale per controllare il volume generale
masterGainNode.connect(audioContext.destination);
masterGainNode.gain.value = 0.7; // Volume di default (0.0 a 1.0)

const soundEffectsGainNode = audioContext.createGain(); // Nodo Gain per gli effetti sonori
soundEffectsGainNode.connect(masterGainNode);
soundEffectsGainNode.gain.value = 1.0; // Volume effetti sonori (relativo al master)

const musicGainNode = audioContext.createGain(); // Nodo Gain per la musica
musicGainNode.connect(masterGainNode);
musicGainNode.gain.value = 0.5; // Volume musica (relativo al master, spesso più basso)

/**
 * Carica un singolo file audio.
 * @param {string} name - Nome identificativo del suono.
 * @param {string} path - Percorso del file audio.
 * @returns {Promise<AudioBuffer>}
 */
async function loadSound(name, path) {
    if (!audioContext) {
        console.warn('AudioContext non supportato. Audio disabilitato.');
        return Promise.reject('AudioContext not supported');
    }
    if (sounds[name]) {
        return Promise.resolve(sounds[name]); // Già caricato
    }
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status} nel caricare ${path}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        sounds[name] = audioBuffer;
        console.log(`Audio caricato: ${name} da ${path}`);
        return audioBuffer;
    } catch (error) {
        console.error(`Errore durante il caricamento o decodifica dell'audio ${name} (${path}):`, error);
        sounds[name] = null; // Segna come fallito per non riprovare inutilmente
        return Promise.reject(error);
    }
}

/**
 * Carica la traccia di musica di sottofondo.
 * @param {string} path - Percorso del file musicale.
 */
async function loadBackgroundMusic(path) {
    if (!audioContext) return;
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status} nel caricare la musica ${path}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        backgroundMusicBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`Musica di sottofondo caricata da: ${path}`);
    } catch (error) {
        console.error('Errore caricamento musica di sottofondo:', error);
        backgroundMusicBuffer = null;
    }
}

/**
 * Riproduce un suono caricato.
 * @param {string} name - Nome del suono da riprodurre.
 * @param {boolean} [loop=false] - Se il suono deve andare in loop.
 * @param {number} [volume=1.0] - Volume specifico per questa istanza del suono (0.0 a 1.0).
 * @returns {AudioBufferSourceNode | null} La sorgente audio creata, o null se il suono non è disponibile.
 */
function playSound(name, loop = false, volume = 1.0) {
    if (!audioContext || !sounds[name]) {
        console.warn(`Suono '${name}' non trovato o AudioContext non disponibile.`);
        return null;
    }
    // Assicura che AudioContext sia 'running' (interazione utente potrebbe essere richiesta)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = sounds[name];

    // Crea un nodo Gain per questo specifico suono per controllare il volume individuale
    const individualGainNode = audioContext.createGain();
    individualGainNode.gain.value = volume;

    source.connect(individualGainNode);
    individualGainNode.connect(soundEffectsGainNode); // Connetti al gain degli effetti sonori

    source.loop = loop;
    source.start(0);
    return source;
}

/**
 * Avvia la musica di sottofondo.
 * Può essere chiamata solo dopo che l'utente ha interagito con la pagina.
 * @param {boolean} [loop=true] - Se la musica deve andare in loop.
 */
function playMusic(loop = true) {
    if (!audioContext || !backgroundMusicBuffer) {
        console.warn('Buffer musica di sottofondo non caricato o AudioContext non disponibile.');
        return;
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext ripreso, avvio musica.');
            actuallyPlayMusic(loop);
        });
    } else {
        actuallyPlayMusic(loop);
    }
}

function actuallyPlayMusic(loop) {
    if (isMusicPlaying && backgroundMusicSource) {
        backgroundMusicSource.stop(); // Ferma la musica precedente se ce n'è una
    }
    backgroundMusicSource = audioContext.createBufferSource();
    backgroundMusicSource.buffer = backgroundMusicBuffer;
    backgroundMusicSource.connect(musicGainNode); // Connetti al gain della musica
    backgroundMusicSource.loop = loop;
    backgroundMusicSource.onended = () => {
        console.log('Musica di sottofondo terminata.');
        isMusicPlaying = false;
        // Se non è in loop e vuoi che ricominci, puoi chiamare di nuovo playMusic qui,
        // ma attenzione a non creare loop infiniti se l'utente non vuole.
        // Per una traccia da 5 min non in loop che può ricominciare:
        // if (!loop) { playMusic(false); } // Ricomincia se non era in loop
    };
    backgroundMusicSource.start(0);
    isMusicPlaying = true;
    console.log('Musica di sottofondo avviata.');
}

/**
 * Ferma la musica di sottofondo.
 */
function stopMusic() {
    if (backgroundMusicSource && isMusicPlaying) {
        backgroundMusicSource.stop(0);
        isMusicPlaying = false;
        console.log('Musica di sottofondo fermata.');
    }
}

/**
 * Imposta il volume generale (master).
 * @param {number} volumeLevel - Livello del volume da 0.0 (muto) a 1.0 (massimo).
 */
function setMasterVolume(volumeLevel) {
    if (masterGainNode) {
        masterGainNode.gain.value = Math.max(0, Math.min(1, volumeLevel)); // Clamp tra 0 e 1
        console.log(`Volume master impostato a: ${masterGainNode.gain.value}`);
    }
}
/**
 * Imposta il volume degli effetti sonori.
 * @param {number} volumeLevel - Livello del volume da 0.0 a 1.0.
 */
function setSoundEffectsVolume(volumeLevel) {
    if (soundEffectsGainNode) {
        soundEffectsGainNode.gain.value = Math.max(0, Math.min(1, volumeLevel));
        console.log(`Volume effetti sonori impostato a: ${soundEffectsGainNode.gain.value}`);
    }
}

/**
 * Imposta il volume della musica.
 * @param {number} volumeLevel - Livello del volume da 0.0 a 1.0.
 */
function setMusicVolume(volumeLevel) {
    if (musicGainNode) {
        musicGainNode.gain.value = Math.max(0, Math.min(1, volumeLevel));
        console.log(`Volume musica impostato a: ${musicGainNode.gain.value}`);
    }
}

// Esporta le funzioni che vuoi rendere disponibili al gioco
export {
    loadSound,
    playSound,
    loadBackgroundMusic,
    playMusic,
    stopMusic,
    setMasterVolume,
    setSoundEffectsVolume,
    setMusicVolume,
    audioContext, // Esponi per controlli avanzati o resume su interazione utente
};
