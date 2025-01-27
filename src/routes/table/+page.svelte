<script lang="ts">
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import BrainInboxTable from '$lib/components/brain-inbox/BrainInboxTable.svelte';
    import CompletedNotesModal from '$lib/components/brain-inbox/CompletedNotesModal.svelte';
    import FloatingVoiceRecorder from '$lib/components/FloatingVoiceRecorder.svelte';

    let showCompletedModal = false;
    let brainInboxTable: BrainInboxTable;
</script>

<div class="container">
    <div class="header">
        <h1>Brain Inbox Database</h1>
        <div class="header-controls">
            <button 
                class="show-completed-btn"
                on:click={() => showCompletedModal = true}
                aria-label="Show completed items"
            >
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                Show Completed
            </button>
        </div>
    </div>

    <BrainInboxTable 
        bind:this={brainInboxTable} 
        hideCompleted={true} 
    />

    <CompletedNotesModal
        show={showCompletedModal}
        onClose={() => showCompletedModal = false}
    />

    <FloatingVoiceRecorder 
        on:noteAdded={() => brainInboxTable.loadNotes()} 
    />
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .header-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .show-completed-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: #4f46e5;
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .show-completed-btn:hover {
        background-color: #4338ca;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
        }

        .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }
</style>
