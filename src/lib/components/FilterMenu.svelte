<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';

    export let title: string;
    export let options: string[];
    export let selectedOptions: Set<string>;
    export let getBadgeClass: (option: string) => string;
    export let isOpen: boolean;

    const dispatch = createEventDispatcher();

    function toggleOption(option: string) {
        if (selectedOptions.has(option)) {
            selectedOptions.delete(option);
        } else {
            selectedOptions.add(option);
        }
        selectedOptions = selectedOptions;
        dispatch('change', { selectedOptions });
    }

    function clearFilter() {
        selectedOptions.clear();
        selectedOptions = selectedOptions;
        dispatch('change', { selectedOptions });
    }
</script>

{#if isOpen}
    <div 
        class="filter-menu"
        transition:fade={{ duration: 100 }}
        on:click|stopPropagation
    >
        <div class="filter-header">
            <span>{title}</span>
            {#if selectedOptions.size > 0}
                <button 
                    class="clear-filter"
                    on:click={clearFilter}
                >
                    Clear
                </button>
            {/if}
        </div>
        <div class="filter-options" transition:slide={{ duration: 100 }}>
            {#each options as option}
                <label class="filter-option">
                    <input 
                        type="checkbox" 
                        checked={selectedOptions.has(option)}
                        on:change={() => toggleOption(option)}
                    />
                    <span class="{getBadgeClass(option)}">
                        {option}
                    </span>
                </label>
            {/each}
        </div>
    </div>
{/if}

<style>
    .filter-menu {
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        min-width: 200px;
        margin-top: 0.5rem;
    }

    .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #eee;
    }

    .clear-filter {
        background: none;
        border: none;
        color: #0066cc;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .filter-options {
        max-height: 300px;
        overflow-y: auto;
        padding: 0.5rem;
    }

    .filter-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .filter-option:hover {
        background: #f5f5f5;
    }

    .filter-option input[type="checkbox"] {
        width: 16px;
        height: 16px;
        border: 2px solid #ddd;
        border-radius: 3px;
        cursor: pointer;
    }
</style>
