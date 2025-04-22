<script lang="ts">
    import { fade } from 'svelte/transition';
    import Card from '../containers/Card.svelte';
    import SkeletonLoader from '../brain-inbox/SkeletonLoader.svelte';

    export let items = [];
    export let loading = false;
</script>

<div class="shopping-list" transition:fade>
    <header class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Shopping List</h2>
        <p class="text-gray-600">Items to purchase</p>
    </header>

    <div class="items-container">
        {#if loading || !items || items.length === 0}
            <SkeletonLoader rows={4} />
        {:else}
            {#each items as item}
                <Card>
                    <div class="item-row">
                        <div class="flex items-center">
                            <input 
                                type="checkbox" 
                                checked={item.completed} 
                                class="checkbox"
                            />
                            <span class="ml-3 text-lg {item.completed ? 'line-through text-gray-400' : ''}">{item.name}</span>
                        </div>
                        {#if item.quantity}
                            <div class="text-sm text-gray-500">Quantity: {item.quantity}</div>
                        {/if}
                        {#if item.notes}
                            <div class="text-sm text-gray-600 mt-2">{item.notes}</div>
                        {/if}
                    </div>
                </Card>
            {/each}
        {/if}
    </div>
</div>

<style>
    .shopping-list {
        padding: 1rem;
    }
    .mb-6 {
        margin-bottom: 1.5rem;
    }
    .items-container {
        display: grid;
        gap: 1rem;
    }
    .item-row {
        padding: 0.5rem;
    }
    .flex {
        display: flex;
    }
    .items-center {
        align-items: center;
    }
    .checkbox {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 0.25rem;
        border: 2px solid #cbd5e0;
    }
    .ml-3 {
        margin-left: 0.75rem;
    }
    .mt-2 {
        margin-top: 0.5rem;
    }
    .text-2xl {
        font-size: 1.5rem;
        line-height: 2rem;
    }
    .text-lg {
        font-size: 1.125rem;
        line-height: 1.75rem;
    }
    .text-sm {
        font-size: 0.875rem;
        line-height: 1.25rem;
    }
    .font-bold {
        font-weight: 700;
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
    .text-gray-400 {
        color: rgb(156 163 175);
    }
    .line-through {
        text-decoration: line-through;
    }
</style>
