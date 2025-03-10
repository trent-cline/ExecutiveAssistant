<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto';
    import GridContainer from '$lib/components/containers/GridContainer.svelte';
    import Card from '$lib/components/containers/Card.svelte';
    import AddFundingModal from '$lib/components/funding/AddFundingModal.svelte';
    import EditFundingModal from '$lib/components/funding/EditFundingModal.svelte';
    import FundingStatsContainer from '$lib/components/funding/FundingStatsContainer.svelte';

    interface FundingSource {
        id: string;
        name: string;
        amount: number;
        type: 'investor' | 'client' | 'founder' | 'sweat-equity' | 'other';
        equity: number;
        notes?: string;
        created_at: string;
        updated_at: string;
        user_id: string;
    }

    let fundingSources: FundingSource[] = [];
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
    let showAddForm = false;
    let showEditForm = false;
    let selectedSource: FundingSource | null = null;
    let errorMessage: string | null = null;

    onMount(async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
            goto('/login');
            return;
        }
        await loadFundingSources();
    });

    async function loadFundingSources() {
        const { data, error: fetchError } = await supabase
            .from('funding_sources')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error loading funding sources:', fetchError);
            errorMessage = fetchError.message;
            return;
        }

        fundingSources = data || [];
        calculateTotals();
        loading = false;
    }

    function calculateTotals() {
        investorTotal = 0;
        clientTotal = 0;
        otherTotal = 0;
        foundersTotal = 0;
        sweatEquityTotal = 0;
        equityTotal = 0;

        fundingSources.forEach((source) => {
            const amount = parseFloat(source.amount.toString());
            const equity = parseFloat(source.equity.toString()) || 0;
            
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

    async function addFundingSource(event: CustomEvent<Omit<FundingSource, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) {
        const newSource = event.detail;
        try {
            const { data, error: insertError } = await supabase
                .from('funding_sources')
                .insert([newSource])
                .select()
                .single();

            if (insertError) throw insertError;

            fundingSources = [data, ...fundingSources];
            calculateTotals();
            showAddForm = false;
            errorMessage = null;
        } catch (err) {
            console.error('Error adding funding source:', err);
            errorMessage = err instanceof Error ? err.message : 'Failed to add funding source';
        }
    }

    async function editFundingSource(event: CustomEvent<Pick<FundingSource, 'id' | 'name' | 'amount' | 'type' | 'equity' | 'notes'>>) {
        try {
            const updatedSource = event.detail;
            const { error: updateError } = await supabase
                .from('funding_sources')
                .update(updatedSource)
                .eq('id', updatedSource.id);

            if (updateError) throw updateError;

            fundingSources = fundingSources.map(source => 
                source.id === updatedSource.id ? { ...source, ...updatedSource } : source
            );
            calculateTotals();
            showEditForm = false;
            selectedSource = null;
            errorMessage = null;
        } catch (err) {
            console.error('Error updating funding source:', err);
            errorMessage = err instanceof Error ? err.message : 'Failed to update funding source';
        }
    }

    async function deleteFundingSource(event: CustomEvent<string>) {
        try {
            const sourceId = event.detail;
            const { error: deleteError } = await supabase
                .from('funding_sources')
                .delete()
                .eq('id', sourceId);

            if (deleteError) throw deleteError;

            fundingSources = fundingSources.filter(source => source.id !== sourceId);
            calculateTotals();
            showEditForm = false;
            selectedSource = null;
            errorMessage = null;
        } catch (err) {
            console.error('Error deleting funding source:', err);
            errorMessage = err instanceof Error ? err.message : 'Failed to delete funding source';
        }
    }
</script>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Funding Management</h1>
        <p class="text-gray-600 dark:text-gray-300">Track and manage funding opportunities and investments</p>
    </div>

    {#if errorMessage}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {errorMessage}
        </div>
    {/if}

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {#if loading}
            <div class="flex justify-center items-center h-48">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card>
                    <div class="text-center">
                        <h3 class="text-lg font-semibold mb-2">Total Funding</h3>
                        <p class="text-2xl font-bold text-green-600">${totalFunding.toLocaleString()}</p>
                    </div>
                </Card>
                <Card>
                    <div class="text-center">
                        <h3 class="text-lg font-semibold mb-2">Remaining to Goal</h3>
                        <p class="text-2xl font-bold text-blue-600">${Math.max(0, FUNDING_GOAL - totalFunding).toLocaleString()}</p>
                    </div>
                </Card>
                <Card>
                    <div class="text-center">
                        <h3 class="text-lg font-semibold mb-2">Pillar Equity</h3>
                        <p class="text-2xl font-bold text-purple-600">{pillarEquity.toFixed(2)}%</p>
                    </div>
                </Card>
            </div>

            <div class="mb-6 flex justify-between items-center">
                <h2 class="text-xl font-semibold">Funding Sources</h2>
                <button 
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    on:click={() => showAddForm = true}
                >
                    Add Source
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equity</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {#each fundingSources as source}
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {source.name}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 capitalize">
                                    {source.type.replace('-', ' ')}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    ${source.amount.toLocaleString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {source.equity}%
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(source.created_at).toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        on:click={() => {
                                            selectedSource = source;
                                            showEditForm = true;
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-4"
                                        on:click={() => {
                                            const event = new CustomEvent('delete', { detail: source.id });
                                            deleteFundingSource(event);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>

{#if showAddForm}
    <AddFundingModal 
        on:submit={addFundingSource}
        on:close={() => {
            showAddForm = false;
            errorMessage = null;
        }}
    />
{/if}

{#if showEditForm && selectedSource}
    <EditFundingModal 
        fundingSource={selectedSource}
        on:submit={editFundingSource}
        on:delete={deleteFundingSource}
        on:close={() => {
            showEditForm = false;
            selectedSource = null;
            errorMessage = null;
        }}
    />
{/if}

<style>
    :global(.dark) {
        --surface-1: #1f2937;
        --surface-2: #111827;
        --text-1: #f3f4f6;
        --text-2: #9ca3af;
        --border-2: #374151;
    }
</style>
