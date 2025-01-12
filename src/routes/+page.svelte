<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    interface Note {
        id: string;
        timestamp: string;
        transcription: string;
        localStorageKey: string;
        category?: string;
        priority?: 'low' | 'medium' | 'high';
        dueDate?: string;
        summary?: string;
    }

    let notes: Note[] = [];
    let audioRecorder: MediaRecorder;
    let audioChunks: BlobPart[] = [];
    let isRecording = false;
    let status = '';
    let transcription = '';
    let currentTranscript = '';
    let microphoneLevel = 0;
    let animationFrameId: number;
    let isMobile = false;

    // Load notes from localStorage on mount
    onMount(() => {
        // Detect mobile device
        isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('Device type:', isMobile ? 'mobile' : 'desktop');

        const savedNotes = localStorage.getItem('voice-notes');
        if (savedNotes) {
            notes = JSON.parse(savedNotes);
        }
        initializeRecorder();
    });

    // Initialize recorder
    async function initializeRecorder() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Get supported MIME types
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            console.log('Using MIME type:', mimeType);
            
            audioRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            audioRecorder.ondataavailable = (event: BlobEvent) => {
                audioChunks.push(event.data);
            };

            audioRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { 
                    type: audioRecorder.mimeType 
                });
                audioChunks.length = 0;
                
                status = 'Processing audio...';
                console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
                
                await saveNote(audioBlob, transcription);
            };

            audioRecorder.startRecording = () => {
                audioChunks.length = 0;
                transcription = '';
                currentTranscript = '';
                status = 'Recording...';
                
                audioRecorder.start(1000); // Record in 1-second chunks
                updateMicrophoneLevel();
            };

            audioRecorder.stopRecording = () => {
                audioRecorder.stop();
                cancelAnimationFrame(animationFrameId);
                status = '';
                microphoneLevel = 0;
            };

            console.log('Successfully initialized recorder');
            return true;
        } catch (error) {
            console.error('Error initializing recorder:', error);
            status = `Error: ${error.message}`;
            return false;
        }
    }

    // Handle recording state
    async function toggleRecording() {
        if (!audioRecorder && !await initializeRecorder()) {
            return;
        }

        isRecording = !isRecording;
        
        if (isRecording) {
            audioRecorder.startRecording();
        } else {
            audioRecorder.stopRecording();
        }
    }

    // Update microphone level visualization
    function updateMicrophoneLevel() {
        if (!isRecording) return;

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(audioRecorder.stream);
        microphone.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function updateLevel() {
            if (!isRecording) return;
            
            analyser.getByteFrequencyData(dataArray);
            const sum = dataArray.reduce((a, b) => a + b);
            microphoneLevel = sum / dataArray.length / 255;
            
            animationFrameId = requestAnimationFrame(updateLevel);
        }
        
        updateLevel();
    }

    // Save note with transcription
    async function saveNote(audioBlob: Blob, text: string) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to transcribe audio');
            }

            const data = await response.json();
            console.log('Transcription result:', data);

            // Create note with transcribed text
            const timestamp = new Date().toISOString();
            const localStorageKey = `note_${timestamp}`;

            const note = {
                timestamp,
                transcription: data.text,
                localStorageKey
            };

            // Analyze the transcription
            const analysisResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transcription: data.text })
            });

            if (!analysisResponse.ok) {
                throw new Error('Failed to analyze note');
            }

            const analysis = await analysisResponse.json();
            const updatedNote = { ...note, ...analysis };

            // Save to local storage
            localStorage.setItem(localStorageKey, JSON.stringify(updatedNote));

            // Save to Notion
            const notionResponse = await fetch('/api/notion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedNote)
            });

            if (!notionResponse.ok) {
                const error = await notionResponse.json();
                throw new Error(error.error || 'Failed to save to Notion');
            }

            // Update the notes array with the completed note
            notes = [updatedNote, ...notes];
            localStorage.setItem('voice-notes', JSON.stringify(notes));
            status = '';
            transcription = '';
        } catch (error) {
            console.error('Error saving note:', error);
            status = `Error: ${error.message}`;
            throw error;
        }
    }

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });
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
                style="opacity: {isRecording ? 0.5 + microphoneLevel/2 : 1}"
            >
                {#if isRecording}
                    ⏹️
                {:else}
                    🎤
                {/if}
            </button>
            
            {#if status}
                <div class="status">{status}</div>
            {/if}
            
            {#if transcription}
                <div class="transcription">{transcription}</div>
            {/if}
        </div>

        <div class="notes-list">
            {#each notes as note}
                <div class="note">
                    <div><strong>Time:</strong> {new Date(note.timestamp).toLocaleString()}</div>
                    <div><strong>Category:</strong> {note.category || 'N/A'}</div>
                    <div><strong>Priority:</strong> {note.priority || 'N/A'}</div>
                    {#if note.dueDate}
                        <div><strong>Due:</strong> {new Date(note.dueDate).toLocaleDateString()}</div>
                    {/if}
                    <div><strong>Summary:</strong> {note.summary || note.transcription}</div>
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
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .record-button {
        background-color: #4CAF50;
        border: none;
        color: white;
        padding: 15px 32px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.3s;
    }

    .record-button:hover {
        background-color: #45a049;
    }

    .record-button.recording {
        background-color: #f44336;
    }

    .record-button.recording:hover {
        background-color: #da190b;
    }

    .status {
        margin-top: 10px;
        color: #666;
    }

    .notes-list {
        margin-top: 20px;
    }

    .note {
        background-color: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 10px;
    }

    .transcription {
        margin-top: 10px;
        white-space: pre-wrap;
    }

    .microphone-level {
        width: 300px;
        height: 20px;
        background-color: #ddd;
        border-radius: 10px;
        overflow: hidden;
        margin: 10px 0;
    }

    .level-bar {
        height: 100%;
        background-color: #4CAF50;
        transition: width 0.1s ease;
    }
</style>
