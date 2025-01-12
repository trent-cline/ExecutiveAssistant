<script lang="ts">
    import { onMount } from 'svelte';

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
    let audioRecorder: any;
    let recognition: any;
    let isRecording = false;
    let transcription = '';
    let currentTranscript = '';
    let status = '';
    let microphoneLevel = 0;
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

    async function saveNote(audioBlob: Blob, transcription: string) {
        const noteId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        
        try {
            let finalTranscription = transcription;
            
            // Use AssemblyAI for mobile devices
            if (isMobile) {
                const formData = new FormData();
                formData.append('audio', audioBlob);
                
                const transcribeResponse = await fetch('/api/transcribe', {
                    method: 'POST',
                    body: formData
                });
                
                if (!transcribeResponse.ok) {
                    throw new Error('Failed to transcribe audio');
                }
                
                const transcribeResult = await transcribeResponse.json();
                finalTranscription = transcribeResult.text;
            }

            const newNote: Note = {
                id: noteId,
                timestamp,
                transcription: finalTranscription,
                localStorageKey: noteId
            };

            // Analyze the transcription
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transcription: finalTranscription })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze note');
            }

            const analysis = await response.json();
            const updatedNote = { ...newNote, ...analysis };

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
            status = 'Note saved successfully';
        } catch (error) {
            console.error('Error saving note:', error);
            status = error instanceof Error ? error.message : 'Error saving note';
            // Still save locally even if remote save fails
            const fallbackNote = {
                id: noteId,
                timestamp,
                transcription: transcription,
                localStorageKey: noteId
            };
            notes = [fallbackNote, ...notes];
            localStorage.setItem('voice-notes', JSON.stringify(notes));
        }
    }

    // Initialize recorder and speech recognition
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
            
            const audioChunks: BlobPart[] = [];

            // Only initialize browser speech recognition for desktop
            if (!isMobile) {
                const SpeechRecognition = (window as any).SpeechRecognition || 
                                        (window as any).webkitSpeechRecognition;
                                        
                if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-US';
                    
                    recognition.onresult = (event: any) => {
                        let interimTranscript = '';
                        let finalTranscript = currentTranscript;

                        for (let i = event.resultIndex; i < event.results.length; i++) {
                            const transcript = event.results[i][0].transcript;
                            if (event.results[i].isFinal) {
                                finalTranscript += transcript + ' ';
                            } else {
                                interimTranscript += transcript;
                            }
                        }

                        currentTranscript = finalTranscript;
                        transcription = (finalTranscript + interimTranscript).trim();
                        console.log('Got transcription:', transcription);
                    };

                    recognition.onerror = (event: any) => {
                        console.error('Speech recognition error:', event.error);
                        status = `Error: ${event.error}`;
                    };

                    recognition.onend = () => {
                        if (isRecording) {
                            try {
                                recognition.start();
                                console.log('Restarted recognition');
                            } catch (error) {
                                console.error('Failed to restart recognition:', error);
                            }
                        }
                    };
                }
            }

            audioRecorder.ondataavailable = (event: BlobEvent) => {
                audioChunks.push(event.data);
            };

            audioRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { 
                    type: audioRecorder.mimeType 
                });
                audioChunks.length = 0;
                
                if (isMobile) {
                    status = 'Processing audio...';
                    console.log('Audio blob size:', audioBlob.size, 'type:', audioBlob.type);
                }
                
                await saveNote(audioBlob, transcription);
            };

            audioRecorder.startRecording = () => {
                audioChunks.length = 0;
                transcription = '';
                currentTranscript = '';
                status = isMobile ? 'Recording...' : 'Listening...';
                
                // For mobile, record in larger chunks since we'll process afterward
                audioRecorder.start(isMobile ? 1000 : 250);
                
                if (!isMobile && recognition) {
                    try {
                        recognition.start();
                        console.log('Started recognition');
                    } catch (error) {
                        console.error('Failed to start recognition:', error);
                    }
                }
                updateMicrophoneLevel();
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
            status = 'Recording...';
            audioRecorder.startRecording();
        } else {
            if (recognition) {
                recognition.stop();
            }
            audioRecorder.stop();
            isRecording = false;
            status = 'Processing...';
        }
    }

    function updateMicrophoneLevel() {
        if (isRecording) {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);

            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            analyzer.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            microphoneLevel = average / 128; // Normalize to 0-1
            requestAnimationFrame(updateMicrophoneLevel);
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
                <div class="note-item">
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
