<script lang="ts">
import { onMount } from 'svelte';

interface Note {
    id: string;
    timestamp: string;
    audio: string;
    transcription: string;
    notionId?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    summary?: string;
}

let notes: Note[] = [];
let audioRecorder: any;
let recognition: any;
let isRecording = false;
let transcription = '';
let currentTranscript = ''; // Add this declaration
let status = '';
let microphoneLevel = 0;

// Load notes from localStorage on mount
onMount(() => {
    const savedNotes = localStorage.getItem('voice-notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
    initializeRecorder();
});

async function saveToNotion(note: Note) {
    try {
        // First get AI analysis
        const analysisResponse = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transcription: note.transcription
            })
        });
        
        if (!analysisResponse.ok) {
            throw new Error('Failed to analyze note');
        }
        
        const analysis = await analysisResponse.json();
        
        const response = await fetch('/api/notion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: note.timestamp,
                transcription: note.transcription,
                localStorageKey: note.id,
                ...analysis // Include AI analysis results
            })
        });
        
        if (!response.ok) throw new Error('Failed to save to Notion');
        
        const { notionId } = await response.json();
        return notionId;
    } catch (error) {
        console.error('Error saving to Notion:', error);
        throw error;
    }
}

// Modified save note function
async function saveNote(audioBlob: Blob, transcription: string) {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const noteId = crypto.randomUUID();
        
        const newNote: Note = {
            id: noteId,
            timestamp: new Date().toISOString(),
            audio: base64Audio,
            transcription: transcription || 'Processing...'
        };
        
        try {
            // Save to Notion and get analysis
            const notionId = await saveToNotion(newNote);
            
            // Update the note with the analysis results
            const updatedNote = {
                ...newNote,
                notionId,
                transcription: transcription // Replace 'Processing...' with actual transcription
            };
            
            // Update the notes array with the completed note
            notes = notes.map(n => n.id === noteId ? updatedNote : n);
            localStorage.setItem('voice-notes', JSON.stringify(notes));
        } catch (error) {
            console.error('Error saving note:', error);
            // Still save to localStorage even if Notion fails
            notes = [...notes, newNote];
            localStorage.setItem('voice-notes', JSON.stringify(notes));
        }
    };
}

// Initialize recorder and speech recognition
async function initializeRecorder() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        // Initialize speech recognition with better mobile support
        const SpeechRecognition = (window as any).SpeechRecognition || 
                                (window as any).webkitSpeechRecognition;
                                
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            // Change these settings for better mobile support
            recognition.continuous = false; // Changed to false for mobile
            recognition.interimResults = false; // Changed to false for mobile
            recognition.lang = 'en-US'; // Explicitly set language
            
            let currentTranscript = ''; // Keep track of accumulated transcript
            
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                currentTranscript += transcript + ' ';
                transcription = currentTranscript.trim();
                console.log('Got transcription:', transcription);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    status = 'No speech detected';
                }
            };

            recognition.onend = () => {
                console.log('Recognition ended, current transcript:', transcription);
                if (isRecording) {
                    // Wait a bit before restarting
                    setTimeout(() => {
                        try {
                            recognition.start();
                            console.log('Restarted recognition');
                        } catch (error) {
                            console.error('Failed to restart recognition:', error);
                        }
                    }, 100);
                }
            };
        } else {
            console.warn('Speech recognition not available');
            status = 'Speech recognition not supported';
        }

        audioRecorder.ondataavailable = (event: BlobEvent) => {
            audioChunks.push(event.data);
        };

        audioRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            audioChunks.length = 0; // Clear chunks after creating blob
            await saveNote(audioBlob, transcription);
        };

        audioRecorder.startRecording = () => {
            audioChunks.length = 0; // Clear any previous chunks
            transcription = ''; // Reset transcription
            currentTranscript = ''; // Reset accumulated transcript
            audioRecorder.start();
            if (recognition) {
                try {
                    recognition.start();
                    console.log('Started recognition');
                } catch (error) {
                    console.error('Failed to start recognition:', error);
                }
            }
            updateMicrophoneLevel();
        };

        audioRecorder.stopRecording = () => {
            return new Promise<Blob>((resolve) => {
                if (recognition) {
                    recognition.stop();
                }
                audioRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    audioChunks.length = 0; // Clear chunks after creating blob
                    resolve(audioBlob);
                };
                audioRecorder.stop();
            });
        };

        // Set up audio visualization
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);

        function updateMicrophoneLevel() {
            if (isRecording) {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                microphoneLevel = average / 128; // Normalize to 0-1
                requestAnimationFrame(updateMicrophoneLevel);
            }
        }

    } catch (error) {
        console.error('Error initializing recorder:', error);
        status = 'error';
    }
}

async function toggleRecording() {
    if (!isRecording) {
        isRecording = true;
        status = 'recording';
        audioRecorder.startRecording();
    } else {
        isRecording = false;
        status = 'processing';
        const audioBlob = await audioRecorder.stopRecording();
        await saveNote(audioBlob, transcription);
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
