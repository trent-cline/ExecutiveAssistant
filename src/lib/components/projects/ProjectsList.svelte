<script lang="ts">
    import { fade } from 'svelte/transition';
    import Card from '../containers/Card.svelte';
    import GridContainer from '../containers/GridContainer.svelte';

    export let projects = [];
</script>

<div class="projects-list" transition:fade>
    <header class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Projects</h2>
        <p class="text-gray-600">Active and upcoming projects</p>
    </header>

    <GridContainer>
        {#each projects as project}
            <Card>
                <h3 class="text-xl font-semibold">{project.name}</h3>
                <p class="text-gray-600">{project.description}</p>
                <div class="mt-4">
                    <div class="text-sm text-gray-500">Status: {project.status}</div>
                    <div class="text-sm text-gray-500">Due: {new Date(project.due_date).toLocaleDateString()}</div>
                </div>
            </Card>
        {/each}
    </GridContainer>
</div>

<style>
    .projects-list {
        padding: 1rem;
    }
    .mb-6 {
        margin-bottom: 1.5rem;
    }
    .mt-4 {
        margin-top: 1rem;
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
</style>
