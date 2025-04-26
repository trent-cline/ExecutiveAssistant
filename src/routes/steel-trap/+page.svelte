<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import ListsTable from '$lib/components/lists/ListsTable.svelte';
    import ListsSkeletonLoader from '$lib/components/lists/ListsSkeletonLoader.svelte';
    import type { ListItem } from '$lib/types/lists';
    import AuthGuard from '$lib/components/AuthGuard.svelte';

    let items: ListItem[] = [];
    let loading = true;
    let error = '';
    let showAddModal = false;
    let newItem: Partial<ListItem> = {
        name: '',
        summary: '',
        status: 'Active',
        priority: 'Medium',
        checked: false
    };

    // Column definitions for Steel Trap
    const columns = [
        {
            id: 'name',
            label: 'Idea/Thought',
            type: 'text',
            editable: true,
            width: '25%'
        },
        {
            id: 'summary',
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
            width: '15%',
            options: ['Active', 'In Progress', 'Completed', 'Archived']
        },
        {
            id: 'priority',
            label: 'Priority',
            type: 'select',
            editable: true,
            width: '15%',
            options: ['Low', 'Medium', 'High', 'Critical']
        },
        {
            id: 'checked',
            label: 'Checked',
            type: 'boolean',
            editable: true,
            width: '10%'
        }
    ];

    onMount(async () => {
        await loadItems();
    });

    async function loadItems() {
        try {
            loading = true;
            const { data, error: err } = await supabase
                .from('steel_trap')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (err) throw new Error(err.message);
            
            items = data || [];
        } catch (e: unknown) {
            console.error('Error loading steel trap items:', e);
            error = e instanceof Error ? e.message : 'Failed to load items';
        } finally {
            loading = false;
        }
    }

    async function handleAddItem() {
        try {
            if (!newItem.name) {
                error = 'Name is required';
                return;
            }

            const { data, error: err } = await supabase
                .from('steel_trap')
                .insert({
                    ...newItem,
                    user_id: $user?.id
                })
                .select();
            
            if (err) throw new Error(err.message);
            
            items = [data[0], ...items];
            resetNewItem();
            showAddModal = false;
        } catch (e: unknown) {
            console.error('Error adding item:', e);
            error = e instanceof Error ? e.message : 'Failed to add item';
        }
    }

    async function handleEditItem(item: ListItem) {
        try {
            const { error: err } = await supabase
                .from('steel_trap')
                .update(item)
                .eq('id', item.id);
            
            if (err) throw new Error(err.message);
            
            // Update local item
            items = items.map(i => i.id === item.id ? item : i);
        } catch (e: unknown) {
            console.error('Error updating item:', e);
            error = e instanceof Error ? e.message : 'Failed to update item';
        }
    }

    async function handleDeleteItem(item: ListItem) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const { error: err } = await supabase
                .from('steel_trap')
                .delete()
                .eq('id', item.id);
            
            if (err) throw new Error(err.message);
            
            // Remove item from local array
            items = items.filter(i => i.id !== item.id);
        } catch (e: unknown) {
            console.error('Error deleting item:', e);
            error = e instanceof Error ? e.message : 'Failed to delete item';
        }
    }

    async function handleCheckItem(item: ListItem) {
        try {
            const updatedItem = { ...item, checked: !item.checked };
            
            const { error: err } = await supabase
                .from('steel_trap')
                .update({ checked: updatedItem.checked })
                .eq('id', item.id);
            
            if (err) throw new Error(err.message);
            
            // Update local item
            items = items.map(i => i.id === item.id ? updatedItem : i);
        } catch (e: unknown) {
            console.error('Error updating item check status:', e);
            error = e instanceof Error ? e.message : 'Failed to update item';
        }
    }

    function resetNewItem() {
        newItem = {
            name: '',
            summary: '',
            status: 'Active',
            priority: 'Medium',
            checked: false
        };
    }
</script>

<AuthGuard>
    <div class="container mx-auto px-4 py-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold">Steel Trap</h1>
                <p class="text-gray-600">Capture your ideas and thoughts before they escape</p>
            </div>
            <div class="flex gap-3">
                <button 
                    class="btn btn-primary"
                    on:click={() => showAddModal = true}
                >
                    <i class="fas fa-plus mr-2"></i>
                    Add New Idea
                </button>
                <a href="/lists" class="btn btn-secondary">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back to Lists
                </a>
            </div>
        </div>

        <div class="home-systems-buttons mb-8">
            <div class="section-header">
                <h2 class="text-xl font-semibold mb-4">Home Systems</h2>
                <div class="divider"></div>
            </div>
            <div class="button-grid">
                <a href="/sprinkler-zones" class="system-button sprinkler">
                    <div class="icon-container">
                        <i class="fas fa-tint"></i>
                    </div>
                    <div class="button-content">
                        <h3>Sprinkler Zones</h3>
                        <p>Manage your 7 sprinkler zones</p>
                    </div>
                </a>
                <a href="/breaker-box" class="system-button breaker">
                    <div class="icon-container">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="button-content">
                        <h3>Breaker Box</h3>
                        <p>Manage electrical circuits</p>
                    </div>
                </a>
            </div>
        </div>

        {#if loading}
            <ListsSkeletonLoader />
        {:else}
            <ListsTable 
                {items} 
                {error}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
                onCheck={handleCheckItem}
            />
        {/if}

        {#if showAddModal}
            <div class="modal-backdrop" on:click|self={() => showAddModal = false} on:keydown={(e) => e.key === 'Escape' && (showAddModal = false)} role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-content">
                    <h2 id="modal-title" class="text-xl font-bold mb-4">Add New Idea</h2>
                    <form on:submit|preventDefault={handleAddItem}>
                        <div class="mb-4">
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Idea/Thought</label>
                            <input 
                                type="text" 
                                id="name" 
                                bind:value={newItem.name} 
                                class="w-full p-2 border rounded"
                                placeholder="Enter your idea"
                            />
                        </div>
                        <div class="mb-4">
                            <label for="summary" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                id="summary" 
                                bind:value={newItem.summary} 
                                class="w-full p-2 border rounded"
                                rows="3"
                                placeholder="Describe your idea"
                            ></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select id="status" bind:value={newItem.status} class="w-full p-2 border rounded">
                                    <option value="Active">Active</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Archived">Archived</option>
                                </select>
                            </div>
                            <div>
                                <label for="priority" class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select id="priority" bind:value={newItem.priority} class="w-full p-2 border rounded">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button 
                                type="button" 
                                class="btn btn-secondary"
                                on:click={() => showAddModal = false}
                            >
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Add Idea
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        {/if}
    </div>
</AuthGuard>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .btn {
        @apply px-4 py-2 rounded font-medium transition-colors duration-200;
    }

    .btn-primary {
        @apply bg-blue-600 text-white hover:bg-blue-700;
    }

    .btn-secondary {
        @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
    }

    .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .section-header h2 {
        margin-right: 1rem;
        white-space: nowrap;
    }

    .divider {
        flex-grow: 1;
        height: 2px;
        background: linear-gradient(to right, #3b82f6, transparent);
    }

    .button-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
    }

    .system-button {
        display: flex;
        align-items: center;
        padding: 1.25rem;
        border-radius: 0.5rem;
        color: white;
        text-decoration: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .system-button:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }

    .system-button.sprinkler {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
    }

    .system-button.breaker {
        background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3rem;
        height: 3rem;
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        margin-right: 1rem;
        flex-shrink: 0;
    }

    .icon-container i {
        font-size: 1.5rem;
    }

    .button-content h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
    }

    .button-content p {
        font-size: 0.875rem;
        margin: 0;
        opacity: 0.9;
    }

    @media (max-width: 640px) {
        .modal-content {
            width: 95%;
            padding: 1.5rem;
        }
        
        .button-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
