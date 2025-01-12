<script lang="ts">
import { onMount } from 'svelte';

interface Note {
    timestamp: string;
    audio: string;
    transcription: string;
}

interface AudioRecorderType {
    mediaRecorder: MediaRecorder | null;
    audioChunks: Blob[];
    recognition: any; // WebkitSpeechRecognition type isn't available in standard TypeScript
    stream: MediaStream | null;
}

let isRecording = false;
let isListening = false;
let audioRecorder: AudioRecorderType;
let transcription = '';
let notes: Note[] = [];
let microphoneLevel = 0;
let status: 'idle' | 'recording' | 'processing' = 'idle';

class AudioRecorder implements AudioRecorderType {
    mediaRecorder: MediaRecorder | null;
    audioChunks: Blob[];
    recognition: any;
    stream: MediaStream | null;

    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recognition = null;
        this.stream = null;
    }

    async initialize(): Promise<boolean> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.mediaRecorder = new MediaRecorder(this.stream);
            this.setupRecognition();
            this.setupAudioAnalyser();

            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            return false;
        }
    }

    setupRecognition(): void {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            // @ts-ignore: Webkit Speech Recognition isn't in standard TypeScript types
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
        }
    }

    setupAudioAnalyser(): void {
        if (!this.stream) return;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(this.stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            microphoneLevel = average / 128; // Normalize to 0-1
            if (isListening || isRecording) {
                requestAnimationFrame(updateLevel);
            }
        };
        
        updateLevel();
    }

    startRecording(): void {
        if (!this.mediaRecorder) return;
        
        this.audioChunks = [];
        this.mediaRecorder.start(1000);
        
        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
            this.audioChunks.push(event.data);
        };
    }

    stopRecording(): Promise<Blob> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder) {
                resolve(new Blob([]));
                return;
            }

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                resolve(audioBlob);
            };
            this.mediaRecorder.stop();
        });
    }
}

onMount(async () => {
    audioRecorder = new AudioRecorder();
    const initialized = await audioRecorder.initialize();
    if (initialized) {
        isListening = true;
    }
});

async function toggleRecording(): Promise<void> {
    if (!isRecording) {
        isRecording = true;
        status = 'recording';
        audioRecorder.startRecording();
    } else {
        isRecording = false;
        status = 'processing';
        const audioBlob = await audioRecorder.stopRecording();
        const timestamp = new Date().toLocaleTimeString();
        notes = [...notes, { 
            timestamp, 
            audio: URL.createObjectURL(audioBlob),
            transcription: transcription || 'Processing...'
        }];
        transcription = '';
        status = 'idle';
    }
}
</script>

<svelte:head>
    <title>Personal Assistant</title>
    <meta name="theme-color" content="#1a1a1a"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</svelte:head>

<main>
    <div class="container">
        <h1>Personal Assistant</h1>
        
        <div class="record-section">
            <button 
                class="record-button {isRecording ? 'recording' : ''}"
                on:click={toggleRecording}
                style="--level: {microphoneLevel}"
            >
                <div class="mic-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" y1="19" x2="12" y2="23"/>
                        <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                </div>
                {#if isRecording}
                    <span class="pulse"></span>
                {/if}
            </button>
            <p class="status">{status}</p>
        </div>

        <div class="notes-section">
            {#each notes as note}
                <div class="note-card">
                    <div class="note-header">
                        <span class="timestamp">{note.timestamp}</span>
                        <audio controls src={note.audio}></audio>
                    </div>
                    <p class="transcription">{note.transcription}</p>
                </div>
            {/each}
        </div>
    </div>
</main>

<style>
    :global(body) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
        background: #1a1a1a;
        color: #ffffff;
    }

    .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    h1 {
        text-align: center;
        font-size: 2rem;
        margin-bottom: 2rem;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .record-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 2rem;
    }

    .record-button {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: none;
        background: #2d2d2d;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .record-button:hover {
        transform: scale(1.05);
    }

    .record-button.recording {
        background: #ff6b6b;
    }

    .mic-icon {
        width: 40px;
        height: 40px;
        color: white;
    }

    .pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 107, 107, 0.4);
        animation: pulse 1.5s ease-out infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        100% {
            transform: scale(1.5);
            opacity: 0;
        }
    }

    .status {
        margin-top: 1rem;
        text-transform: capitalize;
        color: #888;
    }

    .notes-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .note-card {
        background: #2d2d2d;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .note-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .timestamp {
        color: #888;
        font-size: 0.9rem;
    }

    audio {
        height: 32px;
    }

    .transcription {
        margin: 0;
        color: #ddd;
        font-size: 0.95rem;
        line-height: 1.4;
    }

    @media (max-width: 480px) {
        .container {
            padding: 1rem;
        }

        h1 {
            font-size: 1.75rem;
        }

        .record-button {
            width: 70px;
            height: 70px;
        }

        .mic-icon {
            width: 35px;
            height: 35px;
        }

        .note-header {
            flex-direction: column;
            gap: 0.5rem;
        }

        audio {
            width: 100%;
        }
    }
</style>
