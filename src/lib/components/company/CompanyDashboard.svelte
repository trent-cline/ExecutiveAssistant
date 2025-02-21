<script lang="ts">
    import { fade } from 'svelte/transition';
    import Card from '../containers/Card.svelte';
    import GridContainer from '../containers/GridContainer.svelte';
    import FundingStatsContainer from '../funding/FundingStatsContainer.svelte';
    import StructureChart from '../structure/StructureChart.svelte';

    export let funding = [];
    export let structure = [];

    $: totalFunding = funding.reduce((sum, item) => sum + item.amount, 0);
    $: remainingFunding = funding.reduce((sum, item) => sum + (item.remaining || 0), 0);
</script>

<div class="company-dashboard" transition:fade>
    <header class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Company Dashboard</h2>
        <p class="text-gray-600">Pillar company overview and metrics</p>
    </header>

    <div class="mb-8">
        <FundingStatsContainer {totalFunding} {remainingFunding} />
    </div>

    <div class="mb-8">
        <h3 class="text-xl font-semibold mb-4">Company Structure</h3>
        <StructureChart data={structure} />
    </div>

    <GridContainer>
        {#each funding as item}
            <Card>
                <h3 class="text-xl font-semibold">{item.name}</h3>
                <div class="text-sm text-gray-500 mb-2">Added {new Date(item.created_at).toLocaleDateString()}</div>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-label">Amount</div>
                        <div class="stat-value">${item.amount.toLocaleString()}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Remaining</div>
                        <div class="stat-value">${(item.remaining || 0).toLocaleString()}</div>
                    </div>
                </div>
                {#if item.notes}
                    <p class="text-gray-600 mt-4">{item.notes}</p>
                {/if}
            </Card>
        {/each}
    </GridContainer>
</div>

<style>
    .company-dashboard {
        padding: 1rem;
    }
    .mb-8 {
        margin-bottom: 2rem;
    }
    .mb-6 {
        margin-bottom: 1.5rem;
    }
    .mb-4 {
        margin-bottom: 1rem;
    }
    .mb-2 {
        margin-bottom: 0.5rem;
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
    .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    .stat {
        padding: 0.5rem;
        background-color: rgb(243 244 246);
        border-radius: 0.5rem;
    }
    .stat-label {
        font-size: 0.875rem;
        color: rgb(107 114 128);
    }
    .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: rgb(17 24 39);
    }
</style>
