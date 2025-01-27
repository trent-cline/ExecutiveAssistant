<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    const dispatch = createEventDispatcher();

    export let status = '';
    export let isRecording = false;

    let audioRecorder: MediaRecorder;
    let audioChunks: BlobPart[] = [];
    let microphoneLevel = 0;
    let animationFrameId: number;

    onMount(async () => {
        await initializeRecorder();
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
                audioChunks = [];
                dispatch('recording', { audioBlob });
            };

            return true;
        } catch (error) {
            console.error('Error initializing recorder:', error);
            dispatch('error', { message: error.message });
            return false;
        }
    }

    export async function startRecording() {
        if (!audioRecorder || audioRecorder.state === 'inactive') {
            audioChunks = [];
            audioRecorder.start(1000);
            isRecording = true;
            updateMicrophoneLevel();
            dispatch('recordingStarted');
        }
    }

    export function stopRecording() {
        if (audioRecorder && isRecording) {
            audioRecorder.stop();
            isRecording = false;
            cancelAnimationFrame(animationFrameId);
            microphoneLevel = 0;
            dispatch('recordingStopped');
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

    onDestroy(() => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (audioRecorder && isRecording) {
            audioRecorder.stop();
        }
    });
</script>

<div class="voice-recorder">
    <div class="status-text">{status}</div>
    
    <button 
        class="record-button" 
        class:recording={isRecording}
        on:click={() => isRecording ? stopRecording() : startRecording()}
        disabled={!audioRecorder}
    >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
    </button>

    {#if isRecording}
        <div class="recording-indicator">
            <div class="microphone-level" style="height: {microphoneLevel * 100}%"></div>
        </div>
    {/if}
</div>

<style>
    .voice-recorder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
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
</style>
