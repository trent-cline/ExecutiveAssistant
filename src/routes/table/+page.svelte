<script lang="ts">
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import BrainInboxTable from '$lib/components/brain-inbox/BrainInboxTable.svelte';

    let hideCompleted = false;
</script>

<div class="container">
    <div class="header">
        <h1>Brain Inbox Database</h1>
        <div class="header-controls">
            <label class="hide-completed-toggle">
                <input
                    type="checkbox"
                    bind:checked={hideCompleted}
                >
                Hide Completed
            </label>
        </div>
    </div>

    <BrainInboxTable {hideCompleted} />
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

    .hide-completed-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #4b5563;
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
