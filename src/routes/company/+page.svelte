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

    let fundingSources: any[] = [];
    let loading = true;
    const FUNDING_GOAL = 750000;
    let totalFunding = 0;
    let investorTotal = 0;
    let clientTotal = 0;
    let otherTotal = 0;
    let pieChart: Chart;
    let barChart: Chart;
    let showAddForm = false;
    
    let newSource = {
        name: '',
        type: 'investor',
        amount: 0,
        notes: ''
    };
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
        totalFunding = 0;
        investorTotal = 0;
        clientTotal = 0;
        otherTotal = 0;

        fundingSources.forEach(source => {
            const amount = Number(source.amount);
            totalFunding += amount;
            switch(source.type) {
                case 'investor':
                    investorTotal += amount;
                    break;
                case 'client':
                    clientTotal += amount;
                    break;
                case 'other':
                    otherTotal += amount;
                    break;
            }
        });
    }

    function initializeCharts() {
        // Pie Chart for funding distribution
        const pieCtx = document.getElementById('fundingDistribution') as HTMLCanvasElement;
        pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Investors', 'Clients', 'Other'],
                datasets: [{
                    data: [investorTotal, clientTotal, otherTotal],
                    backgroundColor: ['#4F46E5', '#10B981', '#F59E0B']
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
    }

    function updateCharts() {
        if (pieChart) {
            pieChart.data.datasets[0].data = [investorTotal, clientTotal, otherTotal];
            pieChart.update();
        }
        if (barChart) {
            barChart.data.datasets[0].data = [totalFunding, FUNDING_GOAL];
            barChart.update();
        }
    }

    async function addFundingSource() {
        if (!newSource.name || !newSource.amount) {
            error = 'Please fill in all required fields';
            return;
        }

        const { data, error: err } = await supabase
            .from('funding_sources')
            .insert([{
                name: newSource.name,
                type: newSource.type,
                amount: newSource.amount,
                notes: newSource.notes
            }]);

        if (err) {
            error = err.message;
            return;
        }

        newSource = {
            name: '',
            type: 'investor',
            amount: 0,
            notes: ''
        };
        error = '';
        showAddForm = false;
        await loadFundingSources();
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
                <!-- Stats Grid -->
                <div class="stats-grid">
                    <StatCard
                        title="Total Funding"
                        value={'$' + totalFunding.toLocaleString()}
                        subtitle={`${progress.toFixed(1)}% of ${FUNDING_GOAL.toLocaleString()} goal`}
                        icon="fas fa-chart-line"
                        color="indigo"
                    />
                    <StatCard
                        title="Remaining Goal"
                        value={'$' + remainingFunding.toLocaleString()}
                        subtitle="Amount needed"
                        icon="fas fa-bullseye"
                        color="emerald"
                    />
                    <StatCard
                        title="Active Sources"
                        value={fundingSources.length}
                        subtitle="Total funding sources"
                        icon="fas fa-users"
                        color="amber"
                    />
                    <StatCard
                        title="Funding Progress"
                        value={`${((totalFunding / FUNDING_GOAL) * 100).toFixed(1)}%`}
                        subtitle="Of total goal"
                        icon="fas fa-chart-bar"
                        color="blue"
                    />
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <Card>
                        <h3>Funding Progress</h3>
                        <div class="chart-container">
                            <canvas id="fundingProgress"></canvas>
                        </div>
                    </Card>
                    <Card>
                        <h3>Funding Distribution</h3>
                        <div class="chart-container">
                            <canvas id="fundingDistribution"></canvas>
                        </div>
                    </Card>
                </div>

                <!-- Funding Sources List -->
                <Card>
                    <div class="funding-header">
                        <h2>Funding Sources</h2>
                        <div class="funding-tags">
                            <span class="tag investor">
                                <i class="fas fa-user-tie"></i> Investors
                            </span>
                            <span class="tag client">
                                <i class="fas fa-briefcase"></i> Clients
                            </span>
                            <span class="tag other">
                                <i class="fas fa-star"></i> Other
                            </span>
                        </div>
                    </div>
                    <div class="funding-list">
                        {#each fundingSources as source (source.id)}
                            <div class="funding-item" transition:fade>
                                <div class="item-header">
                                    <div>
                                        <h3>{source.name}</h3>
                                        <span class="source-type {source.type}">
                                            <i class="fas {
                                                source.type === 'investor' ? 'fa-user-tie' :
                                                source.type === 'client' ? 'fa-briefcase' :
                                                'fa-star'
                                            }"></i>
                                            {source.type}
                                        </span>
                                    </div>
                                    <div class="amount-info">
                                        <span class="amount">${Number(source.amount).toLocaleString()}</span>
                                        <div class="date">Added: {new Date(source.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                {#if source.notes}
                                    <p class="notes">{source.notes}</p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </Card>
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Company Tools -->
                <Card>
                    <h3>Company Tools</h3>
                    <div class="tools-list">
                        <a href="/company/cloud-costs" class="tool-link">
                            <i class="fas fa-cloud"></i>
                            Cloud Cost Calculator
                        </a>
                        <a href="/company/structure" class="tool-link">
                            <i class="fas fa-project-diagram"></i>
                            Company Structure
                        </a>
                    </div>
                </Card>
                
                <!-- Add Funding Form -->
                {#if showAddForm}
                    <div transition:slide>
                        <Card>
                            <h2>Add New Funding Source</h2>
                            {#if error}
                                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                                    <span class="block sm:inline">{error}</span>
                                </div>
                            {/if}
                            <form on:submit|preventDefault={addFundingSource} class="space-y-4">
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Source Name</label>
                                    <input
                                        type="text"
                                        bind:value={newSource.name}
                                        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Enter source name"
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Source Type</label>
                                    <select
                                        bind:value={newSource.type}
                                        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="investor">Investor</option>
                                        <option value="client">Client</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Amount ($)</label>
                                    <input
                                        type="number"
                                        bind:value={newSource.amount}
                                        min="0"
                                        step="0.01"
                                        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                                <div class="space-y-2">
                                    <label class="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                    <textarea
                                        bind:value={newSource.notes}
                                        class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        rows="2"
                                        placeholder="Add any additional notes"
                                    ></textarea>
                                </div>
                                <button
                                    type="submit"
                                    class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                >
                                    <i class="fas fa-plus-circle mr-2" aria-hidden="true"></i>
                                    Add Funding Source
                                </button>
                            </form>
                        </Card>
                    </div>
                {/if}

                <!-- Quick Stats -->
                <Card>
                    <h3>Quick Stats</h3>
                    <div class="quick-stats">
                        <div class="stat-item">
                            <div class="stat-label">Average Investment</div>
                            <div class="stat-value">${(totalFunding / (fundingSources.length || 1)).toLocaleString()}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Investor Count</div>
                            <div class="stat-value">{fundingSources.filter(s => s.type === 'investor').length}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Client Count</div>
                            <div class="stat-value">{fundingSources.filter(s => s.type === 'client').length}</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</div>

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
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .charts-grid :global(.card) {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
    }

    .charts-grid :global(.card:hover) {
        border-color: #d1d5db;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .chart-container {
        height: 300px;
        position: relative;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        margin-top: 0.5rem;
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
        transition: all 0.2s;
    }

    .tool-link:hover {
        background-color: #f3f4f6;
        color: #111827;
        border-color: #e5e7eb;
    }

    .stat-item {
        padding: 1rem;
        background-color: #f9fafb;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
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
</style>
