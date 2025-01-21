<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { clickOutside } from '$lib/actions/clickOutside';
    import { slide } from 'svelte/transition';
    import type { Column } from './types';

    export let options: string[] = [];
    export let column: Column;
    export let selectedOptions: Set<string> = new Set();
    
    const dispatch = createEventDispatcher();
    
    function handleOptionChange(option: string, checked: boolean) {
        if (checked) {
            selectedOptions.add(option);
        } else {
            selectedOptions.delete(option);
        }
        selectedOptions = selectedOptions; // trigger reactivity
        dispatch('filter', { column, selectedOptions });
    }
    
    function handleClickOutside() {
        dispatch('close');
    }

    function toggleOption(option: string) {
        if (selectedOptions.has(option)) {
            selectedOptions.delete(option);
        } else {
            selectedOptions.add(option);
        }
        selectedOptions = selectedOptions;
    }

    function applyFilter() {
        dispatch('filter', Array.from(selectedOptions));
        dispatch('close');
    }
</script>

{#if column?.filterOptions}
    <div 
        class="filter-menu" 
        use:clickOutside 
        on:outclick={handleClickOutside}
        role="dialog"
        aria-label="Filter options"
        transition:slide
    >
        <div class="filter-header">
            <span>Filter {column.label}</span>
            <button class="close-button" on:click={() => dispatch('close')}>
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="filter-options">
            {#each column.filterOptions as option}
                <label class="filter-option">
                    <input
                        type="checkbox"
                        checked={selectedOptions.has(option)}
                        on:change={() => toggleOption(option)}
                    />
                    <span>{option}</span>
                </label>
            {/each}
        </div>
        <div class="filter-actions">
            <button class="btn-secondary" on:click={() => dispatch('close')}>Cancel</button>
            <button class="btn-primary" on:click={applyFilter}>Apply</button>
        </div>
    </div>
{/if}

<style>
    .filter-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        min-width: 200px;
        z-index: 50;
    }

    .filter-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
        font-weight: 500;
    }

    .close-button {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0.25rem;
    }

    .close-button:hover {
        color: #475569;
    }

    .filter-options {
        max-height: 200px;
        overflow-y: auto;
        padding: 0.5rem;
    }

    .filter-option {
        display: flex;
        align-items: center;
        padding: 0.375rem;
        cursor: pointer;
        user-select: none;
    }

    .filter-option:hover {
        background: #f8fafc;
    }

    .filter-option input {
        margin-right: 0.5rem;
    }

    .filter-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding: 0.75rem;
        border-top: 1px solid #e2e8f0;
    }

    .btn-primary, .btn-secondary {
        padding: 0.375rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary {
        background: #2563eb;
        color: white;
        border: none;
    }

    .btn-primary:hover {
        background: #1d4ed8;
    }

    .btn-secondary {
        background: white;
        color: #64748b;
        border: 1px solid #e2e8f0;
    }

    .btn-secondary:hover {
        background: #f8fafc;
    }
</style>
