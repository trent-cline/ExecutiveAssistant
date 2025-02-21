<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DatabaseTable/types';
    import AuthGuard from '$lib/components/AuthGuard.svelte';

    interface ListItem {
        id: string;
        created_at: string;
        name: string;
        category: string;
        description: string;
        status: string;
        priority: string;
    }

    let items: ListItem[] = [];
    let loading = true;
    let error = '';

    const columns: Column[] = [
        {
            id: 'name',
            label: 'Name',
            type: 'text',
            editable: true,
            width: '25%'
        },
        {
            id: 'category',
            label: 'Category',
            type: 'select',
            editable: true,
            width: '15%',
            options: ['christmas', 'restaurants', 'movies', 'concerts', 'vacations', 'other']
        },
        {
            id: 'description',
            label: 'Description',
            type: 'text',
            editable: true,
            width: '35%'
        },
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            editable: true,
            width: '10%',
            options: ['active', 'completed', 'archived']
        },
        {
            id: 'priority',
            label: 'Priority',
            type: 'select',
            editable: true,
            width: '10%',
            options: ['low', 'medium', 'high']
        },
        {
            id: 'created_at',
            label: 'Created',
            type: 'datetime',
            width: '15%'
        }
    ];

    const config = {
        tableName: 'lists',
        columns,
        defaultSort: { column: 'created_at', direction: 'desc' },
        pageSize: 10,
        filters: [
            {
                column: 'category',
                operator: 'eq',
                type: 'select',
                options: ['christmas', 'restaurants', 'movies', 'concerts', 'vacations', 'other']
            },
            {
                column: 'status',
                operator: 'eq',
                type: 'select',
                options: ['active', 'completed', 'archived']
            }
        ],
        features: {
            search: true,
            pagination: true,
            sort: true,
            edit: true,
            delete: true
        },
        permissions: {
            canEdit: () => true,
            canDelete: () => true
        }
    };

    onMount(async () => {
        try {
            const { data, error: err } = await supabase
                .from('lists')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            items = data || [];
        } catch (err) {
            console.error('Error loading lists:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    });
</script>

<AuthGuard>
    <div class="container">
        <div class="header">
            <h1>Lists</h1>
        </div>

        {#if error}
            <div class="error-message" role="alert">
                <span class="block sm:inline">{error}</span>
            </div>
        {/if}

        <div class="content">
            <DatabaseTable {config} {supabase} initialData={items} />
        </div>
    </div>
</AuthGuard>

<style>
    .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
    }

    .header {
        margin-bottom: 2rem;
    }

    h1 {
        font-size: 2rem;
        font-weight: bold;
        color: var(--color-text-primary);
    }

    .error-message {
        background-color: #FEE2E2;
        border: 1px solid #F87171;
        color: #B91C1C;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .content {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        padding: 1.5rem;
    }
</style>
