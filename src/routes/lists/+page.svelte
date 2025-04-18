<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import DatabaseTable from '$lib/components/DatabaseTable/DatabaseTable.svelte';
    import type { Column } from '$lib/components/DatabaseTable/types';
    import AuthGuard from '$lib/components/AuthGuard.svelte';

    // Generic list item interface
    interface ListItem {
        id: string;
        created_at: string;
        name: string;
        status: string;
        priority: string;
        checked?: boolean;
        original_note_id?: string;
        user_id: string;
        [key: string]: any; // For additional properties specific to list types
    }

    // List type definitions
    type ListType = 'shopping' | 'concert' | 'restaurant' | 'project';
    
    let activeListType: ListType = 'shopping';
    let items: ListItem[] = [];
    let loading = true;
    let error = '';

    // Column definitions for each list type
    const listConfigs = {
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
            </div>
        </div>

        {#if error}
            <div class="error-message" role="alert">
                <span class="block sm:inline">{error}</span>
            </div>
        {/if}

        {#if loading}
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading {activeListType} list...</p>
            </div>
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
                              activeListType === 'restaurant' ? 'Restaurant' : 'Project'}
                    </button>
                </div>
                
                <DatabaseTable 
                    config={currentConfig} 
                    {supabase} 
                    initialData={items} 
                    onRefresh={loadItems}
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
    
    .list-type-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }
    
    .tab-button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        background-color: #f3f4f6;
        color: #4b5563;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
    }
    
    .tab-button:hover {
        background-color: #e5e7eb;
    }
    
    .tab-button.active {
        background-color: #3b82f6;
        color: white;
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
        padding: 0.5rem 1rem;
        background-color: #10b981;
        color: white;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: background-color 0.2s ease;
    }
    
    .add-button:hover {
        background-color: #059669;
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
