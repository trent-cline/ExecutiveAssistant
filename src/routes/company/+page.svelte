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

<div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-gray-900">Pillar Apps, LLC</h1>
                <p class="mt-1 text-gray-500">Financial Dashboard & Funding Management</p>
            </div>
            <button
                class="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                on:click={() => showAddForm = !showAddForm}
            >
                <i class="fas fa-plus mr-2" aria-hidden="true"></i>
                {showAddForm ? 'Cancel' : 'Add Funding Source'}
            </button>
        </div>

        <!-- Two Column Layout -->
        <div class="flex flex-col lg:flex-row gap-8">
            <!-- Main Content Column -->
            <div class="flex-1 space-y-8">
                <!-- Stats Overview -->
                <GridContainer className="lg:grid-cols-4">
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
                </GridContainer>

                <!-- Charts Section -->
                <GridContainer cols="grid-cols-1" mdCols="md:grid-cols-2">
                    <Card>
                        <h3 class="text-lg font-semibold text-gray-700 mb-4">Funding Progress</h3>
                        <div class="relative" style="height: 300px;">
                            <canvas id="fundingProgress"></canvas>
                        </div>
                    </Card>
                    <Card>
                        <h3 class="text-lg font-semibold text-gray-700 mb-4">Funding Distribution</h3>
                        <div class="relative" style="height: 300px;">
                            <canvas id="fundingDistribution"></canvas>
                        </div>
                    </Card>
                </GridContainer>

                <!-- Funding Sources List -->
                <Card>
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-semibold">Funding Sources</h2>
                        <div class="flex gap-2">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                                <i class="fas fa-user-tie mr-1"></i> Investors
                            </span>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800">
                                <i class="fas fa-briefcase mr-1"></i> Clients
                            </span>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                                <i class="fas fa-star mr-1"></i> Other
                            </span>
                        </div>
                    </div>
                    <div class="space-y-4">
                        {#each fundingSources as source (source.id)}
                            <div
                                transition:fade
                                class="p-4 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all duration-200"
                            >
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h3 class="font-medium text-lg text-gray-900">{source.name}</h3>
                                        <span class="inline-flex items-center px-3 py-1 text-sm rounded-full mt-1 {
                                            source.type === 'investor' ? 'bg-indigo-100 text-indigo-800' :
                                            source.type === 'client' ? 'bg-emerald-100 text-emerald-800' :
                                            'bg-amber-100 text-amber-800'
                                        }">
                                            <i class="mr-1 {
                                                source.type === 'investor' ? 'fas fa-user-tie' :
                                                source.type === 'client' ? 'fas fa-briefcase' :
                                                'fas fa-star'
                                            }"></i>
                                            {source.type}
                                        </span>
                                    </div>
                                    <div class="text-right">
                                        <span class="font-semibold text-lg text-gray-900">${Number(source.amount).toLocaleString()}</span>
                                        <div class="text-xs text-gray-500 mt-1">
                                            Added: {new Date(source.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                {#if source.notes}
                                    <p class="text-sm text-gray-600 mt-2 pl-4 border-l-2 border-gray-200">{source.notes}</p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </Card>
            </div>

            <!-- Side Panel -->
            <div class="lg:w-1/3 space-y-8">
                 <!-- Company Tools -->
                 <Card>
                    <h3 class="text-lg font-semibold mb-4">Company Tools</h3>
                    <div class="space-y-2">
                        <a 
                            href="/company/cloud-costs"
                            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors duration-150 ease-in-out"
                        >
                            Cloud Cost Calculator
                        </a>
                    </div>
                </Card>
                
                <!-- Add Funding Form -->
                {#if showAddForm}
                    <div transition:slide>
                        <Card>
                            <h2 class="text-xl font-semibold mb-4">Add New Funding Source</h2>
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
                    <h3 class="text-lg font-semibold mb-4">Quick Stats</h3>
                    <div class="space-y-4">
                        <div>
                            <div class="text-sm text-gray-500">Average Investment</div>
                            <div class="text-xl font-semibold">${(totalFunding / (fundingSources.length || 1)).toLocaleString()}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Investor Count</div>
                            <div class="text-xl font-semibold">{fundingSources.filter(s => s.type === 'investor').length}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-500">Client Count</div>
                            <div class="text-xl font-semibold">{fundingSources.filter(s => s.type === 'client').length}</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
</div>

<style>
    :global(.chart-container) {
        position: relative;
        height: 300px;
    }
</style>
