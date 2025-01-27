<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { generateUUID } from '$lib/utils';
    import { user } from '$lib/auth';
    import { supabase } from '$lib/supabase';

    interface Note {
        id?: string;
        name: string;
        due_date?: string;
        status?: string;
        localid: string;
        summary?: string;
        priority?: string;
        category?: string;
        created_at?: string;
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

    onMount(() => {
        isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('Device type:', isMobile ? 'mobile' : 'desktop');

        const savedNotes = localStorage.getItem('voice-notes');
        if (savedNotes) {
            notes = JSON.parse(savedNotes);
        }
        initializeRecorder();
    });

    async function initializeRecorder() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

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
                
                audioRecorder.start(1000);
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

    async function saveNote(audioBlob: Blob, text: string) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            status = 'Transcribing audio...';
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
            
            const deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
            };

            const timestamp = new Date().toISOString();
            const localid = generateUUID();
            const storageKey = `note_${localid}`;

            // First get the analysis
            status = 'Analyzing transcription...';
            let analysis = {
                category: 'Note',
                priority: 'Low',
                summary: '',
                status: 'Not Started'
            };
            
            try {
                const analysisResponse = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ transcription: data.text })
                });

                if (!analysisResponse.ok) {
                    console.warn('Failed to analyze note, saving with basic information');
                } else {
                    const analysisData = await analysisResponse.json();
                    analysis = { ...analysis, ...analysisData };
                }
            } catch (analyzeError) {
                console.warn('Error analyzing note:', analyzeError);
            }

            // Save transcription to database with analysis results
            try {
                status = 'Saving note...';
                
                if ($user) {
                    // For authenticated users, save to private_notes and brain_dump_database
                    const { error: privateNoteError } = await supabase
                        .from('private_notes')
                        .insert([
                            {
                                content: data.text,
                                created_at: timestamp,
                                analyzed: true,
                                source_type: 'voice'
                            }
                        ]);

                    if (privateNoteError) throw privateNoteError;

                    // Also save to brain_dump_database with full analysis
                    const { error: brainDumpError } = await supabase
                        .from('brain_dump_database')
                        .insert([
                            {
                                name: data.text,
                                summary: analysis.summary,
                                status: analysis.status,
                                priority: analysis.priority,
                                category: analysis.category,
                                created_at: timestamp,
                                localid: localid
                            }
                        ]);

                    if (brainDumpError) throw brainDumpError;
                } else {
                    // For non-authenticated users, save to public_notes
                    const { error: publicNoteError } = await supabase
                        .from('public_notes')
                        .insert([
                            {
                                content: data.text,
                                created_at: timestamp,
                                analyzed: true,
                                source_type: 'voice',
                                device_info: deviceInfo,
                                status: analysis.status,
                                priority: analysis.priority,
                                category: analysis.category,
                                summary: analysis.summary
                            }
                        ]);

                    if (publicNoteError) throw publicNoteError;
                }

                // Save locally
                const note = {
                    name: data.text,
                    localid: localid,
                    created_at: timestamp,
                    ...analysis
                };

                localStorage.setItem(storageKey, JSON.stringify(note));
                notes = [note, ...notes];
                localStorage.setItem('voice-notes', JSON.stringify(notes));

                status = '';
            } catch (dbError) {
                console.error('Failed to save to database:', dbError);
                status = `Warning: Note saved locally but not to database (${dbError.message})`;
                return;
            }
        } catch (error: any) {
            console.error('Error saving note:', error);
            status = `Error: ${error.message}`;
            throw error;
        }
    }

    async function deleteNote(note: Note) {
        if (confirm('Are you sure you want to delete this note?')) {
            localStorage.removeItem(`note_${note.localid}`);
            notes = notes.filter(n => n.localid !== note.localid);
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

<div class="container">
    <div class="recorder-container">
        <div class="status-text">{status}</div>
        
        <button 
            class="record-button" 
            class:recording={isRecording}
            on:click={toggleRecording}
            disabled={!audioRecorder}
        >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        {#if isRecording}
            <div class="recording-indicator">
                <div class="microphone-level" style="height: {microphoneLevel}%"></div>
            </div>
        {/if}

        {#if currentTranscript}
            <div class="current-transcript">
                {currentTranscript}
            </div>
        {/if}
    </div>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .recorder-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-top: 2rem;
    }

    .status-text {
        color: #666;
        text-align: center;
        min-height: 1.5em;
    }

    .record-button {
        background: #ff4444;
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1.2rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .record-button:hover:not(:disabled) {
        background: #cc0000;
        transform: scale(1.05);
    }

    .record-button:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .record-button.recording {
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
        }
    }

    .recording-indicator {
        width: 20px;
        height: 60px;
        background: #eee;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
    }

    .microphone-level {
        width: 100%;
        background: #ff4444;
        transition: height 0.1s;
        position: absolute;
        bottom: 0;
    }

    .current-transcript {
        margin-top: 1rem;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 4px;
        width: 100%;
        max-width: 500px;
        min-height: 100px;
    }

    /* Mobile styles */
    @media (max-width: 767px) {
        .container {
            padding: 0.5rem;
        }

        .recorder-container {
            margin-top: 1rem;
            padding: 1rem;
        }

        .record-button {
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
        }
    }
</style>
