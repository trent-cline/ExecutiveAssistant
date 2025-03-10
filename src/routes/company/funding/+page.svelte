<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { DatabaseTableConfig } from '$lib/components/DatabaseTable/types';

    let loading = true;
    let error: string | null = null;
    let fundingData: any[] = [];

    const tableConfig: DatabaseTableConfig = {
        tableName: 'funding',
        columns: [
            {
                id: 'name',
                label: 'Name',
                width: '200px',
                sortable: true,
                filterable: true
            },
            {
                id: 'amount',
                label: 'Amount',
                width: '120px',
                sortable: true,
                type: 'currency'
            },
            {
                id: 'status',
                label: 'Status',
                width: '120px',
                sortable: true,
                filterable: true,
                type: 'select'
            },
            {
                id: 'source',
                label: 'Source',
                width: '150px',
                sortable: true,
                filterable: true
            },
            {
                id: 'due_date',
                label: 'Due Date',
                width: '120px',
                sortable: true,
                type: 'date',
                template: (value) => value ? new Date(value).toLocaleDateString() : ''
            },
            {
                id: 'created_at',
                label: 'Created',
                width: '120px',
                sortable: true,
                type: 'date',
                template: (value) => value ? new Date(value).toLocaleDateString() : ''
            }
        ],
        defaultSort: { column: 'created_at', direction: 'desc' },
        pageSize: 10,
        features: {
            search: true,
            filter: true,
            sort: true,
            pagination: true,
            edit: true,
            delete: true,
            add: true,
            export: true
        },
        permissions: {
            canView: () => true,
            canEdit: () => true,
            canDelete: () => true,
            canAdd: () => true
        }
    };

    onMount(loadFundingData);

    async function loadFundingData() {
        try {
            const { data, error: fetchError } = await supabase
                .from('funding')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            fundingData = data || [];
        } catch (err) {
            console.error('Error fetching funding data:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Funding Management</h1>
        <p class="text-gray-600 dark:text-gray-300">Track and manage funding opportunities and investments</p>
    </div>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            {error}
        </div>
    {/if}

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {#if loading}
            <div class="flex justify-center items-center h-48">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        {:else}
            <DatabaseTable
                {tableConfig}
                {supabase}
                initialData={fundingData}
                on:dataChange={loadFundingData}
            />
        {/if}
    </div>
</div>

<style>
    :global(.dark) {
        --surface-1: #1f2937;
        --surface-2: #111827;
        --text-1: #f3f4f6;
        --text-2: #e5e7eb;
        --border-color: #374151;
    }
</style>
