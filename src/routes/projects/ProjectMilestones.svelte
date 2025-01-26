<script>
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';
    
    export let milestones = {
        industry_identified: false,
        partner_ided: false,
        prototype_created: false,
        deal_signed: false
    };
    
    const dispatch = createEventDispatcher();
    
    const milestoneConfig = [
        {
            id: 'industry_identified',
            icon: '🎯',
            tooltip: 'Industry Identified: Markets Of 4,000'
        },
        {
            id: 'partner_ided',
            icon: '🤝',
            tooltip: 'Partner Id\'ed: We Want Them'
        },
        {
            id: 'prototype_created',
            icon: '💡',
            tooltip: 'Prototype Created: Wow Them'
        },
        {
            id: 'deal_signed',
            icon: '📝',
            tooltip: 'Deal Signed: Strong Foundations'
        }
    ];
    
    function toggleMilestone(id) {
        milestones[id] = !milestones[id];
        dispatch('change', { milestones });
    }
</script>

<div class="milestone-container" transition:fade>
    {#each milestoneConfig as { id, icon, tooltip }}
        <button
            class="milestone-button"
            class:completed={milestones[id]}
            on:click={() => toggleMilestone(id)}
            title={tooltip}
        >
            <span class="milestone-icon">{icon}</span>
        </button>
    {/each}
</div>

<style>
    .milestone-container {
        display: flex;
        gap: 0.25rem;
        align-items: center;
        padding: 0;
        border-radius: 0.25rem;
        background: none;
    }

    .milestone-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.125rem;
        border-radius: 0.25rem;
        transition: all 0.2s ease-in-out;
        position: relative;
        filter: grayscale(100%) opacity(0.5);
        line-height: 1;
        display: inline-flex;
        align-items: center;
    }

    .milestone-button:hover {
        background: rgba(255, 255, 255, 0.1);
        filter: grayscale(0%) opacity(0.8);
    }

    .completed {
        filter: none !important;
        opacity: 1 !important;
    }

    .milestone-icon {
        font-size: 1rem;
        transition: all 0.2s ease-in-out;
        line-height: 1;
    }
</style>
