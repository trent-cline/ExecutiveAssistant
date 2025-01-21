<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { clickOutside } from '$lib/actions/clickOutside';

    export let value: string;
    export let type: 'text' | 'select' | 'date' = 'text';
    export let options: string[] = [];
    export let className: string = '';
    
    const dispatch = createEventDispatcher();
    let editing = false;
    let inputElement: HTMLInputElement | HTMLSelectElement;
    let tempValue = value;

    function startEditing() {
        editing = true;
        tempValue = value;
        // Wait for input to be rendered
        setTimeout(() => {
            inputElement?.focus();
        }, 0);
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            saveChanges();
        } else if (event.key === 'Escape') {
            cancelEdit();
        }
    }

    function saveChanges() {
        if (value !== tempValue) {
            dispatch('change', { value: tempValue });
        }
        editing = false;
    }

    function cancelEdit() {
        tempValue = value;
        editing = false;
    }

    function handleClickOutside() {
        if (editing) {
            saveChanges();
        }
    }
</script>

<div 
    class="editable-cell {className}"
    use:clickOutside
    on:clickoutside={handleClickOutside}
>
    {#if editing}
        {#if type === 'select'}
            <select
                bind:this={inputElement}
                bind:value={tempValue}
                on:blur={saveChanges}
                on:keydown={handleKeyDown}
            >
                {#each options as option}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        {:else if type === 'date'}
            <input
                type="date"
                bind:this={inputElement}
                bind:value={tempValue}
                on:blur={saveChanges}
                on:keydown={handleKeyDown}
            />
        {:else}
            <input
                type="text"
                bind:this={inputElement}
                bind:value={tempValue}
                on:blur={saveChanges}
                on:keydown={handleKeyDown}
            />
        {/if}
    {:else}
        <div 
            class="display-value"
            on:click={startEditing}
        >
            <slot {value}>
                {value}
            </slot>
        </div>
    {/if}
</div>

<style>
    .editable-cell {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .display-value {
        width: 100%;
        height: 100%;
        padding: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .display-value:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    input, select {
        width: 100%;
        padding: 0.5rem;
        border: 2px solid #0066cc;
        border-radius: 4px;
        font-size: inherit;
        background: white;
        outline: none;
    }

    input:focus, select:focus {
        box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
    }
</style>
