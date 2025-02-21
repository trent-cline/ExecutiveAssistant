<script lang="ts">
    import { onMount } from 'svelte';
    import { activeComponent } from '$lib/stores/voiceCommands';
    import BrainInboxTable from '$lib/components/brain-inbox/BrainInboxTable.svelte';
    
    export let componentName: string | null = null;

    const components = {
        'brain-inbox': BrainInboxTable,
        // Add other components as needed
    };

    onMount(() => {
        activeComponent.set(componentName);
        return () => activeComponent.set(null);
    });
</script>

{#if componentName && components[componentName]}
    <div class="component-container">
        <svelte:component this={components[componentName]} />
    </div>
{:else}
    <div class="flex items-center justify-center h-full text-gray-500">
        <p>Say a command to load a component</p>
    </div>
{/if}

<style>
    .component-container {
        height: 100%;
        overflow-y: auto;
    }
</style>
