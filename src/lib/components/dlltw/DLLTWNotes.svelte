<script lang="ts">
    import { fade } from 'svelte/transition';
    import Card from '../containers/Card.svelte';
    import GridContainer from '../containers/GridContainer.svelte';

    export let notes = [];
</script>

<div class="dlltw-notes" transition:fade>
    <header class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">DLLTW Notes</h2>
        <p class="text-gray-600">Notes from Deep Learning: Life Through Writing</p>
    </header>

    <GridContainer>
        {#each notes as note}
            <Card>
                <h3 class="text-xl font-semibold">{note.title}</h3>
                <div class="text-sm text-gray-500 mb-2">Chapter {note.chapter}</div>
                <p class="text-gray-600">{note.content}</p>
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
    .dlltw-notes {
        padding: 1rem;
    }
    .mb-6 {
        margin-bottom: 1.5rem;
    }
    .mb-2 {
        margin-bottom: 0.5rem;
    }
    .mt-4 {
        margin-top: 1rem;
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
