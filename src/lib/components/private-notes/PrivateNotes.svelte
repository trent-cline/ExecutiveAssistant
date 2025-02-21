<script lang="ts">
    import { fade } from 'svelte/transition';
    import Card from '../containers/Card.svelte';
    import GridContainer from '../containers/GridContainer.svelte';

    export let notes = [];
</script>

<div class="private-notes" transition:fade>
    <header class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Private Notes</h2>
        <p class="text-gray-600">Your personal notes collection</p>
    </header>

    <GridContainer>
        {#each notes as note}
            <Card>
                <div class="note-header">
                    <h3 class="text-xl font-semibold">{note.title}</h3>
                    <div class="text-sm text-gray-500">{new Date(note.created_at).toLocaleDateString()}</div>
                </div>
                <p class="text-gray-600 mt-2">{note.content}</p>
                {#if note.source}
                    <div class="text-sm text-gray-500 mt-4">Source: {note.source}</div>
                {/if}
                {#if note.tags?.length}
                    <div class="mt-4 flex flex-wrap gap-2">
                        {#each note.tags as tag}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                {/if}
            </Card>
        {/each}
    </GridContainer>
</div>

<style>
    .private-notes {
        padding: 1rem;
    }
    .mb-6 {
        margin-bottom: 1.5rem;
    }
    .mt-2 {
        margin-top: 0.5rem;
    }
    .mt-4 {
        margin-top: 1rem;
    }
    .note-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    .flex {
        display: flex;
    }
    .flex-wrap {
        flex-wrap: wrap;
    }
    .gap-2 {
        gap: 0.5rem;
    }
    .text-2xl {
        font-size: 1.5rem;
        line-height: 2rem;
    }
    .text-xl {
        font-size: 1.25rem;
        line-height: 1.75rem;
    }
    .text-sm {
        font-size: 0.875rem;
        line-height: 1.25rem;
    }
    .font-bold {
        font-weight: 700;
    }
    .font-semibold {
        font-weight: 600;
    }
    .text-gray-900 {
        color: rgb(17 24 39);
    }
    .text-gray-600 {
        color: rgb(75 85 99);
    }
    .text-gray-500 {
        color: rgb(107 114 128);
    }
    .tag {
        padding: 0.25rem 0.75rem;
        background-color: rgb(243 244 246);
        border-radius: 9999px;
        font-size: 0.875rem;
        color: rgb(75 85 99);
    }
</style>
