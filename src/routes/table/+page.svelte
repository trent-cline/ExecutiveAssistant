<script lang="ts">
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import BrainInboxTable from '$lib/components/brain-inbox/BrainInboxTable.svelte';
    import CompletedNotesModal from '$lib/components/brain-inbox/CompletedNotesModal.svelte';
    import FloatingVoiceRecorder from '$lib/components/FloatingVoiceRecorder.svelte';

    let showCompletedModal = false;
    let brainInboxTable: BrainInboxTable;
</script>

<div class="container mx-auto px-4 py-6">
    <div class="grid grid-cols-4 gap-4 mb-6">
        <a 
            href="/goals" 
            class="btn-nav"
        >
            <i class="fas fa-bullseye mr-2" aria-hidden="true"></i>
            Goals
        </a>
        <a 
            href="/private-notes" 
            class="btn-nav"
        >
            <i class="fas fa-user-lock mr-2" aria-hidden="true"></i>
            Private Notes
        </a>
        <a 
            href="/dlltw" 
            class="btn-nav"
        >
            <i class="fas fa-book mr-2" aria-hidden="true"></i>
            DLLTW Notes
        </a>
        <a 
            href="/lists" 
            class="btn-nav"
        >
            <i class="fas fa-list mr-2" aria-hidden="true"></i>
            Lists
        </a>
    </div>

    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Brain Inbox Database</h1>
        <div class="flex gap-3">
            <a 
                href="/table/new"
                class="btn btn-primary"
                aria-label="Add new note"
            >
                <i class="fas fa-plus mr-2" aria-hidden="true"></i>
                Add New
            </a>
            <button 
                class="btn btn-primary"
                on:click={() => showCompletedModal = true}
                aria-label="Show completed items"
            >
                <i class="fas fa-check-circle mr-2" aria-hidden="true"></i>
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
    .btn-nav {
        @apply flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg 
               hover:bg-blue-700 transition-colors duration-200 text-sm font-medium;
    }

    @media (max-width: 640px) {
        .grid {
            @apply grid-cols-1 gap-2;
        }
    }
</style>
