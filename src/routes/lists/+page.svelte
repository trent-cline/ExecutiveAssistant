<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import ListsTable from '$lib/components/lists/ListsTable.svelte';
    import ListsSkeletonLoader from '$lib/components/lists/ListsSkeletonLoader.svelte';
    import type { ListItem } from '$lib/types/lists';
    import AuthGuard from '$lib/components/AuthGuard.svelte';


    // List type definitions
    type ListType = 'shopping' | 'concert' | 'restaurant' | 'project' | 'steel-trap';
    
    let activeListType: ListType = 'shopping';
    let items: ListItem[] = [];
    let loading = true;
    let error = '';

    // Column definitions for each list type
    const listConfigs = {
        'steel-trap': {
            tableName: 'steel_trap',
            columns: [
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
            ]
        },
        shopping: {
            tableName: 'shopping_list',
            columns: [
                {
                    id: 'name',
                    label: 'Item',
                    type: 'text',
                    editable: true,
                    width: '20%'
                },
                {
                    id: 'summary',
                    label: 'Description',
                    type: 'text',
                    editable: true,
                    width: '30%'
                },
                {
                    id: 'quantity',
                    label: 'Quantity',
                    type: 'number',
                    editable: true,
                    width: '10%'
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    editable: true,
                    width: '15%',
                    options: ['Not Started', 'In Progress', 'Done']
                },
                {
                    id: 'priority',
                    label: 'Priority',
                    type: 'select',
                    editable: true,
                    width: '15%',
                    options: ['Low', 'Medium', 'High']
                },
                {
                    id: 'checked',
                    label: 'Checked',
                    type: 'boolean',
                    editable: true,
                    width: '10%'
                }
            ]
        },
        concert: {
            tableName: 'concert_list',
            columns: [
                {
                    id: 'name',
                    label: 'Concert',
                    type: 'text',
                    editable: true,
                    width: '20%'
                },
                {
                    id: 'artist',
                    label: 'Artist',
                    type: 'text',
                    editable: true,
                    width: '20%'
                },
                {
                    id: 'venue',
                    label: 'Venue',
                    type: 'text',
                    editable: true,
                    width: '20%'
                },
                {
                    id: 'date',
                    label: 'Date',
                    type: 'date',
                    editable: true,
                    width: '15%'
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    editable: true,
                    width: '15%',
                    options: ['active', 'booked', 'attended', 'cancelled']
                },
                {
                    id: 'priority',
                    label: 'Priority',
                    type: 'select',
                    editable: true,
                    width: '10%',
                    options: ['low', 'medium', 'high']
                }
            ]
        },
        restaurant: {
            tableName: 'restaurant_list',
            columns: [
                {
                    id: 'name',
                    label: 'Restaurant',
                    type: 'text',
                    editable: true,
                    width: '25%'
                },
                {
                    id: 'cuisine',
                    label: 'Cuisine',
                    type: 'text',
                    editable: true,
                    width: '15%'
                },
                {
                    id: 'location',
                    label: 'Location',
                    type: 'text',
                    editable: true,
                    width: '20%'
                },
                {
                    id: 'notes',
                    label: 'Notes',
                    type: 'text',
                    editable: true,
                    width: '20%'
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    editable: true,
                    width: '10%',
                    options: ['active', 'visited', 'favorite', 'archived']
                },
                {
                    id: 'priority',
                    label: 'Priority',
                    type: 'select',
                    editable: true,
                    width: '10%',
                    options: ['low', 'medium', 'high']
                }
            ]
        },
        project: {
            tableName: 'projects_list',
            columns: [
                {
                    id: 'name',
                    label: 'Project',
                    type: 'text',
                    editable: true,
                    width: '25%'
                },
                {
                    id: 'description',
                    label: 'Description',
                    type: 'text',
                    editable: true,
                    width: '30%'
                },
                {
                    id: 'deadline',
                    label: 'Deadline',
                    type: 'date',
                    editable: true,
                    width: '15%'
                },
                {
                    id: 'status',
                    label: 'Status',
                    type: 'select',
                    editable: true,
                    width: '15%',
                    options: ['active', 'in progress', 'completed', 'on hold']
                },
                {
                    id: 'priority',
                    label: 'Priority',
                    type: 'select',
                    editable: true,
                    width: '15%',
                    options: ['low', 'medium', 'high']
                }
            ]
        }
    };

    // Get current config based on active list type
    $: currentConfig = {
        tableName: listConfigs[activeListType].tableName,
        columns: listConfigs[activeListType].columns,
        defaultSort: { column: 'created_at', direction: 'desc' },
        pageSize: 10,
        filters: [
            {
                column: 'status',
                operator: 'eq',
                type: 'select',
                options: listConfigs[activeListType].columns.find(col => col.id === 'status')?.options || []
            },
            {
                column: 'priority',
                operator: 'eq',
                type: 'select',
                options: listConfigs[activeListType].columns.find(col => col.id === 'priority')?.options || []
            }
        ],
        features: {
            search: true,
            pagination: true,
            sort: true,
            edit: true,
            delete: true,
            add: true
        },
        permissions: {
            canEdit: () => true,
            canDelete: () => true
        }
    };

    // Function to load items based on active list type
    async function loadItems() {
        loading = true;
        error = '';
        
        try {
            const { data, error: err } = await supabase
                .from(listConfigs[activeListType].tableName)
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            items = data || [];
        } catch (err) {
            console.error(`Error loading ${activeListType} list:`, err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    // Handle list type change
    function changeListType(type: ListType) {
        activeListType = type;
        loadItems();
    }

    // Add new item to the current list
    async function addNewItem(item: Partial<ListItem>) {
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            
            if (!userId) {
                throw new Error('User not authenticated');
            }
            
            const { data, error: err } = await supabase
                .from(listConfigs[activeListType].tableName)
                .insert([{
                    ...item,
                    user_id: userId
                }])
                .select();

            if (err) throw err;
            
            // Refresh the list
            loadItems();
            
            return data;
        } catch (err) {
            console.error(`Error adding item to ${activeListType} list:`, err);
            error = err.message;
            return null;
        }
    }

    onMount(() => {
        loadItems();
    });
</script>

<AuthGuard>
    <div class="container">
        <div class="header">
            <h1>Lists</h1>
            <p class="text-sm text-gray-600 mb-4">Manage your different lists in one place</p>
            
            <div class="list-type-tabs">
                <button 
                    class="tab-button {activeListType === 'shopping' ? 'active' : ''}"
                    on:click={() => changeListType('shopping')}
                >
                    <i class="fas fa-shopping-cart mr-2"></i>
                    Shopping
                </button>
                <button 
                    class="tab-button {activeListType === 'concert' ? 'active' : ''}"
                    on:click={() => changeListType('concert')}
                >
                    <i class="fas fa-music mr-2"></i>
                    Concerts
                </button>
                <button 
                    class="tab-button {activeListType === 'restaurant' ? 'active' : ''}"
                    on:click={() => changeListType('restaurant')}
                >
                    <i class="fas fa-utensils mr-2"></i>
                    Restaurants
                </button>
                <button 
                    class="tab-button {activeListType === 'project' ? 'active' : ''}"
                    on:click={() => changeListType('project')}
                >
                    <i class="fas fa-tasks mr-2"></i>
                    Projects
                </button>
                <a 
                    href="/steel-trap"
                    class="tab-button steel-trap"
                >
                    <i class="fas fa-lightbulb mr-2"></i>
                    Steel Trap
                </a>
            </div>
        </div>

        {#if error}
            <div class="error-message" role="alert">
                <span class="block sm:inline">{error}</span>
            </div>
        {/if}

        {#if loading}
            <ListsSkeletonLoader rows={8} />
        {:else}
            <div class="content">
                <div class="list-header">
                    <h2 class="list-title">
                        {#if activeListType === 'shopping'}
                            Shopping List
                        {:else if activeListType === 'concert'}
                            Concert List
                        {:else if activeListType === 'restaurant'}
                            Restaurant List
                        {:else if activeListType === 'project'}
                            Projects List
                        {:else if activeListType === 'steel-trap'}
                            Steel Trap
                        {/if}
                    </h2>
                    <button class="add-button" on:click={() => {
                        // Open a modal or form to add new item
                        const defaultItem = {
                            name: '',
                            status: activeListType === 'shopping' ? 'Not Started' : 'active',
                            priority: 'medium'
                        };
                        addNewItem(defaultItem);
                    }}>
                        <i class="fas fa-plus mr-2"></i>
                        Add {activeListType === 'shopping' ? 'Item' : 
                              activeListType === 'concert' ? 'Concert' : 
                              activeListType === 'restaurant' ? 'Restaurant' : 
                              activeListType === 'project' ? 'Project' : 'Idea'}
                    </button>
                </div>
                <ListsTable 
                    items={items}
                    loading={loading}
                    error={error}
                    onEdit={(e) => {/* TODO: Implement edit modal for lists */}}
                    onDelete={(e) => {/* TODO: Implement delete logic for lists */}}
                    onCheck={(e) => {/* TODO: Implement check/uncheck logic for lists */}}
                />
                {#if items.length === 0}
                    <div class="empty-state">
                        <p>No items in your {activeListType} list yet.</p>
                        <p>Add items using the button above or from your notes.</p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</AuthGuard>

<style>
    .container {
        max-width: 1400px;
        margin-left: auto;
        margin-right: auto;
        padding-left: 1rem;
        padding-right: 1rem;
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
        border-radius: 1.5rem;
        box-shadow: 0 10px 40px 0 rgb(56 189 248 / 0.10), 0 2px 4px -1px rgb(129 140 248 / 0.15);
        background: linear-gradient(135deg, #eff6ff 0%, #fff 60%, #c7d2fe 100%);
    }

    .header {
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.01em;
        margin-bottom: 0.25rem;
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
        background: #fff;
        border-radius: 1.5rem;
        box-shadow: 0 6px 32px 0 rgb(59 130 246 / 0.08), 0 1.5px 4px -1px rgb(99 102 241 / 0.10);
        padding: 2rem 1.25rem;
        margin-bottom: 2rem;
    }
    
    .list-type-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        background: #f1f5f9;
        border-radius: 0.75rem;
        padding: 0.5rem 0.25rem;
    }
    
    .tab-button {
        padding: 0.5rem 1.25rem;
        border-radius: 0.75rem;
        font-weight: 600;
        background: #e0e7ff;
        color: #3730a3;
        transition: background 0.2s, color 0.2s;
        display: flex;
        align-items: center;
        border: none;
        font-size: 1rem;
    }
    
    .tab-button:hover {
        background-color: #e5e7eb;
    }
    
    .tab-button.active {
        background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%);
        color: #fff;
        box-shadow: 0 2px 8px 0 rgb(59 130 246 / 0.15);
    }
    
    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .list-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
    }
    
    .add-button {
        display: flex;
        align-items: center;
        padding: 0.5rem 1.25rem;
        background: linear-gradient(90deg, #10b981 0%, #3b82f6 100%);
        color: #fff;
        border-radius: 0.75rem;
        font-weight: 600;
        font-size: 1rem;
        border: none;
        box-shadow: 0 1px 4px 0 rgb(16 185 129 / 0.10);
        transition: background 0.2s, color 0.2s;
    }
    
    .add-button:hover {
        background: linear-gradient(90deg, #059669 0%, #2563eb 100%);
        color: #e0e7ff;
    }
    
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
    
    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: #3b82f6;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }
</style>
