<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { fade, slide } from 'svelte/transition';
    import Chart from 'chart.js/auto';
    import GridContainer from '$lib/components/containers/GridContainer.svelte';
    import Card from '$lib/components/containers/Card.svelte';
    import StatCard from '$lib/components/stats/StatCard.svelte';
    import AddFundingModal from '$lib/components/funding/AddFundingModal.svelte';
    import EditFundingModal from '$lib/components/funding/EditFundingModal.svelte';
    import FundingStatsContainer from '$lib/components/funding/FundingStatsContainer.svelte';

    let fundingSources: any[] = [];
    let loading = true;
    const FUNDING_GOAL = 750000;
    let totalFunding = 0;
    let investorTotal = 0;
    let clientTotal = 0;
    let otherTotal = 0;
    let foundersTotal = 0;
    let sweatEquityTotal = 0;
    let equityTotal = 0;
    let pillarEquity = 100;
    let pieChart: Chart;
    let barChart: Chart;
    let equityChart: Chart;
    let showAddForm = false;
    let showEditForm = false;
    let selectedSource = null;
    let error = '';

    onMount(async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
            goto('/login');
            return;
        }
        await loadFundingSources();
        initializeCharts();
    });

    async function loadFundingSources() {
        const { data, error } = await supabase
            .from('funding_sources')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading funding sources:', error);
            return;
        }

        fundingSources = data || [];
        calculateTotals();
        if (pieChart) updateCharts();
    }

    function calculateTotals() {
        investorTotal = 0;
        clientTotal = 0;
        otherTotal = 0;
        foundersTotal = 0;
        sweatEquityTotal = 0;
        equityTotal = 0;

        fundingSources.forEach((source) => {
            const amount = parseFloat(source.amount);
            const equity = parseFloat(source.equity) || 0;
            
            switch (source.type) {
                case 'investor':
                    investorTotal += amount;
                    break;
                case 'client':
                    clientTotal += amount;
                    break;
                case 'founder':
                    foundersTotal += amount;
                    break;
                case 'sweat-equity':
                    sweatEquityTotal += amount;
                    break;
                default:
                    otherTotal += amount;
            }
            
            equityTotal += equity;
        });

        totalFunding = investorTotal + clientTotal + otherTotal + foundersTotal + sweatEquityTotal;
        pillarEquity = Math.max(0, 100 - equityTotal);
    }

    function initializeCharts() {
        if (pieChart) pieChart.destroy();
        if (barChart) barChart.destroy();
        if (equityChart) equityChart.destroy();

        // Pie Chart for funding distribution
        const pieCtx = document.getElementById('fundingDistribution') as HTMLCanvasElement;
        pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Investors', 'Founders', 'Sweat Equity', 'Clients', 'Other'],
                datasets: [{
                    data: [investorTotal, foundersTotal, sweatEquityTotal, clientTotal, otherTotal],
                    backgroundColor: ['#4F46E5', '#22C55E', '#EC4899', '#10B981', '#F59E0B']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Bar Chart for funding progress
        const barCtx = document.getElementById('fundingProgress') as HTMLCanvasElement;
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Current Funding', 'Goal'],
                datasets: [{
                    label: 'Funding Progress',
                    data: [totalFunding, FUNDING_GOAL],
                    backgroundColor: ['#10B981', '#E5E7EB']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Equity distribution chart
        const equityCtx = document.getElementById('equityDistribution') as HTMLCanvasElement;
        equityChart = new Chart(equityCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pillar', ...fundingSources.map(s => s.name)],
                datasets: [{
                    data: [pillarEquity, ...fundingSources.map(s => parseFloat(s.equity) || 0)],
                    backgroundColor: ['#4F46E5', '#22C55E', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#D946EF']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw as number;
                                return `${value.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateCharts() {
        if (pieChart) {
            pieChart.data.datasets[0].data = [investorTotal, foundersTotal, sweatEquityTotal, clientTotal, otherTotal];
            pieChart.update();
        }
        if (barChart) {
            barChart.data.datasets[0].data = [totalFunding, FUNDING_GOAL];
            barChart.update();
        }
        if (equityChart) {
            equityChart.data.labels = ['Pillar', ...fundingSources.map(s => s.name)];
            equityChart.data.datasets[0].data = [pillarEquity, ...fundingSources.map(s => parseFloat(s.equity) || 0)];
            equityChart.update();
        }
    }

    async function addFundingSource(event: CustomEvent) {
        const newSource = event.detail;
        try {
            const { data, error: err } = await supabase
                .from('funding_sources')
                .insert([newSource])
                .select()
                .single();

            if (err) throw err;

            fundingSources = [data, ...fundingSources];
            calculateTotals();
            updateCharts();
            showAddForm = false;
        } catch (err: any) {
            console.error('Error adding funding source:', err);
            error = err.message;
        }
    }

    async function editFundingSource(event: CustomEvent) {
        try {
            const updatedSource = event.detail;
            const { error: updateError } = await supabase
                .from('funding_sources')
                .update({
                    name: updatedSource.name,
                    type: updatedSource.type,
                    amount: updatedSource.amount,
                    equity: updatedSource.equity,
                    notes: updatedSource.notes,
                    updated_at: new Date()
                })
                .eq('id', updatedSource.id);

            if (updateError) throw updateError;

            await loadFundingSources();
            showEditForm = false;
            selectedSource = null;
        } catch (err) {
            console.error('Error updating funding source:', err);
            error = err.message;
        }
    }

    async function deleteFundingSource(event: CustomEvent) {
        try {
            const sourceId = event.detail;
            const { error: deleteError } = await supabase
                .from('funding_sources')
                .delete()
                .eq('id', sourceId);

            if (deleteError) throw deleteError;

            await loadFundingSources();
            showEditForm = false;
            selectedSource = null;
        } catch (err) {
            console.error('Error deleting funding source:', err);
            error = err.message;
        }
    }

    function handleEditClick(source) {
        selectedSource = source;
        showEditForm = true;
    }

    $: progress = (totalFunding / FUNDING_GOAL) * 100;
    $: remainingFunding = FUNDING_GOAL - totalFunding;
</script>

<svelte:head>
    <title>Pillar Apps - Company Dashboard</title>
</svelte:head>

<div class="page-container">
    <div class="content">
        <!-- Header Section -->
        <div class="header">
            <div class="header-content">
                <h1>Pillar Apps, LLC</h1>
                <p>Financial Dashboard & Funding Management</p>
            </div>
            <button
                class="add-button"
                on:click={() => showAddForm = !showAddForm}
            >
                <i class="fas fa-plus"></i>
                {showAddForm ? 'Cancel' : 'Add Funding Source'}
            </button>
        </div>

        <!-- Main Grid Layout -->
        <div class="main-grid">
            <!-- Main Content -->
            <div class="main-content">
                <!-- Funding Stats Container -->
                <FundingStatsContainer
                    {totalFunding}
                    {remainingFunding}
                    {fundingSources}
                    fundingGoal={FUNDING_GOAL}
                />

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Funding Progress</h3>
                            <div class="chart-actions">
                                <button class="chart-button">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="fundingProgress"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Funding Distribution</h3>
                            <div class="chart-actions">
                                <button class="chart-button">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="fundingDistribution"></canvas>
                        </div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3>Equity Distribution</h3>
                            <div class="chart-actions">
                                <button class="chart-button">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="equityDistribution"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Funding Sources List -->
                <div class="funding-sources">
                    <div class="funding-header">
                        <h3>Funding Sources</h3>
                        <button class="add-button" on:click={() => showAddForm = true}>
                            <i class="fas fa-plus"></i>
                            Add Source
                        </button>
                    </div>
                    <div class="source-list">
                        {#each fundingSources as source}
                            <div class="source-item" on:click={() => handleEditClick(source)}>
                                <div class="source-icon">
                                    {#if source.type === 'investor'}
                                        <i class="fas fa-user-tie"></i>
                                    {:else if source.type === 'client'}
                                        <i class="fas fa-briefcase"></i>
                                    {:else if source.type === 'founder'}
                                        <i class="fas fa-crown"></i>
                                    {:else if source.type === 'sweat-equity'}
                                        <i class="fas fa-hammer"></i>
                                    {:else}
                                        <i class="fas fa-circle"></i>
                                    {/if}
                                </div>
                                <div class="source-content">
                                    <div class="source-header">
                                        <h4>{source.name}</h4>
                                        <div class="source-tags">
                                            <span class="tag {source.type}">{source.type}</span>
                                            {#if source.equity > 0}
                                                <span class="tag equity">{source.equity}%</span>
                                            {/if}
                                        </div>
                                    </div>
                                    <p class="source-amount">${source.amount.toLocaleString()}</p>
                                    {#if source.notes}
                                        <p class="source-notes">{source.notes}</p>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Company Tools -->
                <div class="tools-card">
                    <div class="tools-header">
                        <h3>Company Tools</h3>
                    </div>
                    <div class="tools-list">
                        <a href="/company/cloud-costs" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-cloud"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Cloud Cost Calculator</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/structure" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-project-diagram"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Company Structure</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                        <a href="/company/organization-chart" class="tool-item">
                            <div class="tool-icon">
                                <i class="fas fa-sitemap"></i>
                            </div>
                            <div class="tool-content">
                                <h4>Organization Chart</h4>
                            </div>
                            <i class="fas fa-chevron-right tool-arrow"></i>
                        </a>
                    </div>
                </div>
                
                <!-- Add Funding Form -->
                <Card>
                    <div class="funding-header">
                        <h2>Funding Sources</h2>
                        <div class="funding-actions">
                            <button 
                                class="add-button"
                                on:click={() => showAddForm = true}
                            >
                                <i class="fas fa-plus"></i>
                                Add Source
                            </button>
                        </div>
                    </div>
                </Card>

                <!-- Quick Stats -->
                <div class="stats-card">
                    <div class="stats-header">
                        <h3>Quick Stats</h3>
                    </div>
                    <div class="quick-stats">
                        <div class="stat-item">
                            <div class="stat-label">Average Investment</div>
                            <div class="stat-value">
                                ${(totalFunding / (fundingSources.length || 1)).toLocaleString()}
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Last Updated</div>
                            <div class="stat-value">
                                {fundingSources.length > 0 
                                    ? new Date(fundingSources[0].created_at).toLocaleDateString()
                                    : 'No data'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{#if showAddForm}
    <AddFundingModal 
        on:close={() => showAddForm = false}
        on:submit={addFundingSource}
    />
{/if}

{#if showEditForm && selectedSource}
    <EditFundingModal 
        fundingSource={selectedSource}
        on:close={() => {
            showEditForm = false;
            selectedSource = null;
        }}
        on:submit={editFundingSource}
        on:delete={deleteFundingSource}
    />
{/if}

<style>
    .page-container {
        min-height: 100vh;
        background-color: #f9fafb;
        padding: 2rem;
        border-left: 1px solid #e5e7eb;
    }

    .content {
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e5e7eb;
    }

    .header h1 {
        font-size: 2rem;
        font-weight: bold;
        color: #111827;
    }

    .header p {
        color: #6b7280;
        margin-top: 0.5rem;
    }

    .add-button {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background-color: #4f46e5;
        color: white;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        transition: background-color 0.2s;
    }

    .add-button:hover {
        background-color: #4338ca;
    }

    .add-button i {
        margin-right: 0.5rem;
    }

    .main-grid {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 2rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stats-grid :global(.card) {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }

    .stats-grid :global(.card:hover) {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }

    .chart-card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        overflow: hidden;
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .chart-container {
        padding: 1rem;
        height: 300px;
    }

    @media (prefers-color-scheme: dark) {
        .chart-card {
            background-color: var(--surface-2);
        }

        .chart-header {
            border-bottom-color: #374151;
        }
    }

    .funding-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .funding-tags {
        display: flex;
        gap: 0.5rem;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
    }

    .tag i {
        margin-right: 0.25rem;
    }

    .tag.investor {
        background-color: #e0e7ff;
        color: #4f46e5;
    }

    .tag.founders {
        background-color: #d1fae5;
        color: #059669;
    }

    .tag.sweat-equity {
        background-color: #fbcfe8;
        color: #be185d;
    }

    .tag.client {
        background-color: #d1fae5;
        color: #059669;
    }

    .tag.other {
        background-color: #fef3c7;
        color: #d97706;
    }

    .funding-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .funding-item {
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background-color: white;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .funding-item:hover {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .source-type {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        margin-top: 0.25rem;
    }

    .amount-info {
        text-align: right;
    }

    .amount {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
    }

    .date {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.25rem;
    }

    .notes {
        margin-top: 0.5rem;
        padding: 0.5rem 0 0.5rem 1rem;
        border-left: 2px solid #e5e7eb;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 0.875rem;
    }

    .sidebar :global(.card) {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }

    .sidebar :global(.card:hover) {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .tool-link {
        display: block;
        padding: 0.5rem 1rem;
        color: #4b5563;
        border-radius: 0.375rem;
        border: 1px solid transparent;
        transition: all 0.2s ease-in-out;
    }

    .tool-link:hover {
        background: var(--surface-3, #f3f4f6);
        color: #111827;
        border-color: #e5e7eb;
    }

    .stats-card {
        background: var(--surface-2, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .stats-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .stats-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }

    .quick-stats {
        padding: 1rem;
    }

    .stat-item {
        padding: 0.75rem;
        background: var(--surface-1, #f9fafb);
        border-radius: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .stat-item:last-child {
        margin-bottom: 0;
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        margin-bottom: 0.25rem;
    }

    .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-1, #111827);
    }

    .tools-card {
        background: var(--surface-2, #ffffff);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .tools-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .tools-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }

    .tools-list {
        padding: 0.75rem;
    }

    .tool-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-radius: 0.5rem;
        color: var(--text-1, #111827);
        text-decoration: none;
        transition: all 0.2s ease-in-out;
        margin-bottom: 0.5rem;
    }

    .tool-item:last-child {
        margin-bottom: 0;
    }

    .tool-item:hover {
        background: var(--surface-3, #f3f4f6);
    }

    .tool-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.5rem;
        background: var(--primary-color, #4f46e5);
        color: white;
        margin-right: 1rem;
    }

    .tool-content {
        flex: 1;
    }

    .tool-content h4 {
        font-size: 1rem;
        font-weight: 500;
        margin: 0;
        color: var(--text-1, #111827);
    }

    .tool-arrow {
        color: var(--text-2, #6b7280);
        font-size: 0.875rem;
    }

    /* Responsive Design */
    @media (max-width: 1280px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 1024px) {
        .main-grid {
            grid-template-columns: 1fr;
        }

        .charts-grid {
            grid-template-columns: 1fr;
        }

        .sidebar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
    }

    @media (max-width: 640px) {
        .page-container {
            padding: 1rem;
        }

        .header {
            flex-direction: column;
            gap: 1rem;
        }

        .funding-header {
            flex-direction: column;
            gap: 1rem;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .chart-card {
            background: var(--surface-2, #1f2937);
        }

        .chart-header h3 {
            color: var(--text-1, #f3f4f6);
        }

        .chart-button {
            color: var(--text-2, #9ca3af);
        }

        .chart-button:hover {
            background: var(--surface-3, #374151);
            color: var(--text-1, #f3f4f6);
        }

        .tools-card {
            background: var(--surface-2, #1f2937);
        }

        .tools-header h3 {
            color: var(--text-1, #f3f4f6);
        }

        .tool-item {
            color: var(--text-1, #f3f4f6);
        }

        .tool-item:hover {
            background: var(--surface-3, #374151);
        }

        .tool-content h4 {
            color: var(--text-1, #f3f4f6);
        }

        .tool-arrow {
            color: var(--text-2, #9ca3af);
        }

        .stats-card {
            background: var(--surface-2, #1f2937);
        }

        .stats-header h3 {
            color: var(--text-1, #f3f4f6);
        }

        .stat-item {
            background: var(--surface-1, #111827);
        }

        .stat-label {
            color: var(--text-2, #9ca3af);
        }

        .stat-value {
            color: var(--text-1, #f3f4f6);
        }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }

        .chart-card {
            padding: 1rem;
        }

        .chart-container {
            height: 250px;
        }

        .tools-card {
            margin-bottom: 1rem;
        }

        .tools-header {
            padding: 1rem;
        }

        .tools-list {
            padding: 0.5rem;
        }

        .tool-item {
            padding: 0.75rem;
        }

        .tool-icon {
            width: 2rem;
            height: 2rem;
            margin-right: 0.75rem;
        }

        .stats-card {
            margin-bottom: 1rem;
        }

        .stats-header {
            padding: 1rem;
        }

        .quick-stats {
            padding: 0.75rem;
        }

        .stat-item {
            padding: 0.625rem;
        }
    }
</style>
