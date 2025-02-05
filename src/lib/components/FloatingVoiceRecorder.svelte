<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import VoiceRecorder from './VoiceRecorder.svelte';
    import { supabase } from '$lib/supabase';
    import { analyzeNote, analysisStatus } from '$lib/stores/noteAnalysis';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let isOpen = false;
    let status = '';
    let isRecording = false;

    async function handleRecording(event: CustomEvent) {
        const { audioBlob } = event.detail;
        
        try {
            status = 'Transcribing...';
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to transcribe audio');
            }

            const data = await response.json();
            const timestamp = new Date().toISOString();
            
            // Save to private notes
            const { data: noteData, error: privateError } = await supabase
                .from('private_notes')
                .insert([
                    {
                        content: data.text,
                        created_at: timestamp,
                        analyzed: false
                    }
                ])
                .select()
                .single();

            if (privateError) throw privateError;

            // Analyze the note
            status = 'Analyzing...';
            const analysis = await analyzeNote(noteData);

            // Map priority to valid enum values (Low, Medium, High)
            let priority = 'Medium';
            if (analysis.priority) {
                const lowerPriority = analysis.priority.toLowerCase();
                if (lowerPriority === 'low' || lowerPriority === 'minor') priority = 'Low';
                else if (lowerPriority === 'high' || lowerPriority === 'critical') priority = 'High';
            }

            // Map category to valid enum values (Note, Task, Reminder)
            let category = 'Note';
            if (analysis.category) {
                const lowerCategory = analysis.category.toLowerCase();
                if (lowerCategory.includes('task') || lowerCategory.includes('todo')) category = 'Task';
                else if (lowerCategory.includes('remind')) category = 'Reminder';
            }

            // Map status to valid enum values (Not Started, In Progress, Done)
            let noteStatus = 'Not Started';
            if (analysis.status) {
                const lowerStatus = analysis.status.toLowerCase();
                if (lowerStatus.includes('progress') || lowerStatus.includes('doing')) noteStatus = 'In Progress';
                else if (lowerStatus.includes('done') || lowerStatus.includes('complete')) noteStatus = 'Done';
            }

            // Save to brain_dump_database with analysis results
            const localId = crypto.randomUUID();
            const { error: brainDumpError } = await supabase
                .from('brain_dump_database')
                .insert([
                    {
                        name: data.text,
                        summary: analysis.summary,
                        status: noteStatus,
                        priority: priority,
                        category: category,
                        created_at: timestamp,
                        localid: localId,
                        user_id: 'public'
                    }
                ]);

            if (brainDumpError) throw brainDumpError;

            status = 'Saved!';
            // Dispatch a custom event to notify that data has been updated
            dispatch('noteAdded');
            
            setTimeout(() => {
                status = '';
                isOpen = false;
            }, 2000);

        } catch (error) {
            console.error('Error processing recording:', error);
            status = 'Error: ' + error.message;
            setTimeout(() => status = '', 3000);
        }
    }
</script>

<div class="floating-recorder" class:open={isOpen}>
    {#if !isOpen}
        <button 
            class="floating-button" 
            on:click={() => {
                isOpen = true;
            }}
            aria-label="Open voice recorder"
            transition:fade
        >
            <i class="fas fa-microphone" aria-hidden="true"></i>
        </button>
    {:else}
        <div class="recorder-panel" transition:fly={{ y: 20, duration: 300 }}>
            <button class="close-button" on:click={() => isOpen = false} aria-label="Close voice recorder">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
            <VoiceRecorder 
                {status}
                {isRecording}
                on:recording={handleRecording}
                on:recordingStarted={() => isRecording = true}
                on:recordingStopped={() => isRecording = false}
            />
        </div>
    {/if}
</div>

<style>
    .floating-recorder {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
    }

    .floating-button {
        background: #ff4444;
        color: white;
        border: none;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s, background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    }

    .floating-button:hover {
        background: #cc0000;
        transform: scale(1.1);
    }

    .recorder-panel {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        position: relative;
        min-width: 300px;
    }

    .close-button {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.5rem;
        transition: color 0.2s;
    }

    .close-button:hover {
        color: #333;
    }

    @media (max-width: 640px) {
        .floating-recorder {
            top: auto;
            bottom: 1rem;
        }

        .recorder-panel {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 12px 12px 0 0;
            min-width: 100%;
        }
    }
</style>
