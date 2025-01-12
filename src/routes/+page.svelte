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

    // Delete note
    async function deleteNote(note: Note) {
        if (confirm('Are you sure you want to delete this note?')) {
            // Remove from local storage
            localStorage.removeItem(note.localStorageKey);
            
            // Update notes array
            notes = notes.filter(n => n.localStorageKey !== note.localStorageKey);
            localStorage.setItem('voice-notes', JSON.stringify(notes));
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

<style>
    :global(body) {
        background-color: white;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
    }

    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
    }

    .controls-section {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        text-align: center;
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
        font-size: 14px;
    }

    .notes-list {
        display: grid;
        gap: 20px;
        grid-template-columns: 1fr;
    }

    .note {
        background-color: #F0F8FF; /* Light Steel Blue */
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .note:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .note-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .note-metadata {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin-bottom: 15px;
    }

    .metadata-item {
        display: flex;
        flex-direction: column;
    }

    .metadata-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
    }

    .metadata-value {
        font-size: 14px;
        color: #333;
    }

    .transcription {
        margin-top: 10px;
        white-space: pre-wrap;
        color: #333;
        line-height: 1.5;
        font-size: 16px;
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.5);
        border-radius: 4px;
    }

    .microphone-level {
        width: 300px;
        height: 20px;
        background-color: #ddd;
        border-radius: 10px;
        overflow: hidden;
        margin: 10px auto;
    }

    .level-bar {
        height: 100%;
        background-color: #4CAF50;
        transition: width 0.1s ease;
    }

    .delete-button {
        background: none;
        border: none;
        color: #666;
        font-size: 24px;
        cursor: pointer;
        padding: 8px;
        line-height: 1;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        touch-action: manipulation;
    }

    .delete-button:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: #f44336;
    }

    @media (hover: none) {
        .delete-button {
            opacity: 1;
        }
    }

    @media (min-width: 768px) {
        .notes-list {
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
    }
</style>

<div class="container">
    <div class="controls-section">
        <h1>Voice Notes</h1>
        <button 
            class="record-button" 
            class:recording={isRecording} 
            on:click={toggleRecording}
        >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        
        {#if isRecording}
            <div class="microphone-level">
                <div class="level-bar" style="width: {microphoneLevel * 100}%"></div>
            </div>
        {/if}
        
        {#if status}
            <div class="status">{status}</div>
        {/if}
    </div>

    <div class="notes-list">
        {#each notes as note}
            <div class="note">
                <div class="note-header">
                    <div class="metadata-item">
                        <span class="metadata-label">Time</span>
                        <span class="metadata-value">{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                    <button 
                        class="delete-button"
                        on:click={() => deleteNote(note)}
                        aria-label="Delete note"
                    >
                        ×
                    </button>
                </div>
                
                <div class="note-metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">Category</span>
                        <span class="metadata-value">{note.category || 'N/A'}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Priority</span>
                        <span class="metadata-value">{note.priority || 'N/A'}</span>
                    </div>
                    {#if note.dueDate}
                        <div class="metadata-item">
                            <span class="metadata-label">Due Date</span>
                            <span class="metadata-value">{new Date(note.dueDate).toLocaleDateString()}</span>
                        </div>
                    {/if}
                </div>
                
                <div class="transcription">
                    {note.transcription}
                </div>
            </div>
        {/each}
    </div>
</div>
