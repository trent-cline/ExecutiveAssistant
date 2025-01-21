<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DataTable from '$lib/components/DataTable/DataTable.svelte';
    import type { Column } from '$lib/components/DataTable/types';

    interface ShoppingItem {
        id: string;
        name: string;
        description: string;
        status: 'Not Started' | 'In Progress' | 'Done';
        priority: 'Low' | 'Medium' | 'High';
        quantity: number;
        checked: boolean;
        created_at: string;
    }

    let items: ShoppingItem[] = [];
    let loading = true;
    let error = '';
    let activeView = 'checklist'; // or 'database'

    const columns: Column[] = [
        { 
            id: 'name', 
            label: 'Item', 
            width: '200px', 
            sortable: true 
        },
        { 
            id: 'description', 
            label: 'Description', 
            width: '300px', 
            sortable: true 
        },
        { 
            id: 'quantity', 
            label: 'Quantity', 
            width: '120px', 
            sortable: true 
        },
        { 
            id: 'status', 
            label: 'Status', 
            width: '150px',
            filterOptions: ['Not Started', 'In Progress', 'Done'],
            template: (value) => {
                const colors = {
                    'Not Started': '#6c757d',
                    'In Progress': '#007bff',
                    'Done': '#28a745'
                };
                return `<span style="color: ${colors[value]}">${value}</span>`;
            }
        },
        { 
            id: 'priority', 
            label: 'Priority', 
            width: '150px',
            filterOptions: ['Low', 'Medium', 'High'],
            template: (value) => {
                const colors = {
                    'Low': '#28a745',
                    'Medium': '#ffc107',
                    'High': '#dc3545'
                };
                return `<span style="color: ${colors[value]}">${value}</span>`;
            }
        },
        { 
            id: 'actions', 
            label: '', 
            width: '100px',
            actions: [
                { icon: 'edit', label: 'Edit', action: 'edit' },
                { icon: 'trash', label: 'Delete', action: 'delete' }
            ]
        }
    ];

    onMount(async () => {
        if (!$user) {
            goto('/login');
            return;
        }
        await loadItems();
    });

    async function loadItems() {
        try {
            const { data, error: err } = await supabase
                .from('shopping_list')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            items = data || [];
            loading = false;
        } catch (e) {
            error = e.message;
            loading = false;
        }
    }

    async function toggleChecked(item: ShoppingItem) {
        try {
            const { error: err } = await supabase
                .from('shopping_list')
                .update({ checked: !item.checked })
                .eq('id', item.id);

            if (err) throw err;
            items = items.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i);
        } catch (e) {
            error = e.message;
        }
    }

    async function updateQuantity(item: ShoppingItem, increment: number) {
        const newQuantity = Math.max(1, item.quantity + increment);
        try {
            const { error: err } = await supabase
                .from('shopping_list')
                .update({ quantity: newQuantity })
                .eq('id', item.id);

            if (err) throw err;
            items = items.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i);
        } catch (e) {
            error = e.message;
        }
    }

    async function deleteItem(id: string) {
        try {
            const { error: err } = await supabase
                .from('shopping_list')
                .delete()
                .eq('id', id);

            if (err) throw err;
            items = items.filter(i => i.id !== id);
        } catch (e) {
            error = e.message;
        }
    }

    function handleSort(event: CustomEvent) {
        const { column, direction } = event.detail;
        items = items.sort((a, b) => {
            const aVal = a[column];
            const bVal = b[column];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            return direction === 'asc' 
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }

    function handleFilter(event: CustomEvent) {
        const { column, selectedOptions } = event.detail;
        if (selectedOptions.size === 0) return;
        
        items = items.filter(item => 
            selectedOptions.has(item[column])
        );
    }

    function handleRowAction(event: CustomEvent) {
        const { action, rowData } = event.detail;
        if (action === 'edit') {
            goto(`/shopping/${rowData.id}/edit`);
        } else if (action === 'delete') {
            deleteItem(rowData.id);
        }
    }

    function getPriorityClass(priority: string) {
        return priority.toLowerCase();
    }
</script>

<div class="container">
    <div class="header">
        <h1>Shopping List</h1>
        <div class="view-controls">
            <button 
                class="view-button" 
                class:active={activeView === 'checklist'} 
                on:click={() => activeView = 'checklist'}
            >
                <i class="fas fa-check-square"></i>
                Checklist View
            </button>
            <button 
                class="view-button" 
                class:active={activeView === 'database'} 
                on:click={() => activeView = 'database'}
            >
                <i class="fas fa-table"></i>
                Database View
            </button>
            <button class="new-button" on:click={() => goto('/shopping/new')}>
                <i class="fas fa-plus"></i>
                New Item
            </button>
        </div>
    </div>

    {#if activeView === 'checklist'}
        <div class="checklist-view">
            <div class="filters">
                <button class="clear-checked" on:click={() => items.filter(i => i.checked).forEach(i => deleteItem(i.id))}>
                    Clear Checked Items
                </button>
            </div>

            {#if loading}
                <div class="loading">Loading shopping list...</div>
            {:else if error}
                <div class="error">{error}</div>
            {:else}
                <div class="items-list">
                    {#each items as item (item.id)}
                        <div class="item" class:checked={item.checked}>
                            <div class="item-main">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    on:change={() => toggleChecked(item)}
                                />
                                <div class="item-content">
                                    <div class="item-header">
                                        <h3>{item.name}</h3>
                                        <span class="priority-badge {getPriorityClass(item.priority)}">
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p>{item.description}</p>
                                </div>
                            </div>
                            <div class="item-actions">
                                <div class="quantity-controls">
                                    <button on:click={() => updateQuantity(item, -1)}>-</button>
                                    <span>{item.quantity}</span>
                                    <button on:click={() => updateQuantity(item, 1)}>+</button>
                                </div>
                                <button class="delete-btn" on:click={() => deleteItem(item.id)}>
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {:else}
        <DataTable
            {columns}
            data={items}
            {loading}
            {error}
            on:sort={handleSort}
            on:filter={handleFilter}
            on:rowAction={handleRowAction}
        />
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .view-controls {
        display: flex;
        gap: 0.5rem;
    }

    .view-button {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #495057;
    }

    .view-button.active {
        background: #e9ecef;
        border-color: #ced4da;
        color: #212529;
    }

    .new-button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .new-button:hover {
        background: #45a049;
    }

    .checklist-view {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1rem;
    }

    .filters {
        margin-bottom: 1rem;
    }

    .clear-checked {
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .items-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
        border: 1px solid #dee2e6;
    }

    .item.checked {
        background: #e9ecef;
        opacity: 0.7;
    }

    .item-main {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        flex: 1;
    }

    .item-content {
        flex: 1;
    }

    .item-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
    }

    .item-header h3 {
        margin: 0;
        font-size: 1.1rem;
    }

    .priority-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .priority-badge.low {
        background: #d4edda;
        color: #155724;
    }

    .priority-badge.medium {
        background: #fff3cd;
        color: #856404;
    }

    .priority-badge.high {
        background: #f8d7da;
        color: #721c24;
    }

    .item-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .quantity-controls button {
        background: white;
        border: 1px solid #dee2e6;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .delete-btn {
        background: none;
        border: none;
        color: #dc3545;
        cursor: pointer;
        padding: 0.25rem;
    }

    .delete-btn:hover {
        color: #c82333;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
        }

        .header {
            flex-direction: column;
            gap: 1rem;
        }

        .view-controls {
            width: 100%;
            flex-wrap: wrap;
        }

        .view-button, .new-button {
            flex: 1;
            justify-content: center;
        }

        .item {
            flex-direction: column;
            gap: 1rem;
        }

        .item-actions {
            width: 100%;
            justify-content: space-between;
        }
    }
</style>
