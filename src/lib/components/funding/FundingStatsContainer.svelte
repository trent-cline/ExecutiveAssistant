<script lang="ts">
    import Card from '$lib/components/containers/Card.svelte';

    export let totalFunding: number;
    export let remainingFunding: number;
    export let fundingSources: any[];
    export let fundingGoal: number;

    $: progress = (totalFunding / fundingGoal) * 100;
</script>

<div class="tools-card">
    <div class="tools-header">
        <h3>Funding Overview</h3>
    </div>
    <div class="tools-list">
        <div class="tool-item">
            <div class="tool-icon">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="tool-content">
                <h4>Total Funding</h4>
                <p class="tool-value">${totalFunding.toLocaleString()}</p>
                <p class="tool-subtitle">{progress.toFixed(1)}% of ${fundingGoal.toLocaleString()} goal</p>
            </div>
        </div>
        <div class="tool-item">
            <div class="tool-icon">
                <i class="fas fa-bullseye"></i>
            </div>
            <div class="tool-content">
                <h4>Remaining Goal</h4>
                <p class="tool-value">${remainingFunding.toLocaleString()}</p>
                <p class="tool-subtitle">Amount needed</p>
            </div>
        </div>
        <div class="tool-item">
            <div class="tool-icon">
                <i class="fas fa-chart-bar"></i>
            </div>
            <div class="tool-content">
                <h4>Funding Progress</h4>
                <p class="tool-value">{progress.toFixed(1)}%</p>
                <p class="tool-subtitle">Of total goal</p>
            </div>
        </div>
    </div>
</div>

<style>
    .tools-card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        margin-bottom: 1rem;
    }

    .tools-header {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .tools-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-1);
        margin: 0;
    }

    .tools-list {
        padding: 0.5rem;
    }

    .tool-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 0.375rem;
        transition: background-color 0.2s;
    }

    .tool-item:hover {
        background-color: #f3f4f6;
    }

    .tool-icon {
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f3f4f6;
        border-radius: 0.5rem;
        margin-right: 1rem;
    }

    .tool-icon i {
        font-size: 1.25rem;
        color: #4F46E5;
    }

    .tool-content {
        flex: 1;
    }

    .tool-content h4 {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-2);
        margin: 0;
    }

    .tool-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-1);
        margin: 0.25rem 0;
    }

    .tool-subtitle {
        font-size: 0.875rem;
        color: var(--text-2);
        margin: 0;
    }

    @media (prefers-color-scheme: dark) {
        .tools-card {
            background-color: var(--surface-2);
        }

        .tools-header {
            border-bottom-color: #374151;
        }

        .tool-item:hover {
            background-color: #374151;
        }

        .tool-icon {
            background-color: #374151;
        }
    }
</style>
