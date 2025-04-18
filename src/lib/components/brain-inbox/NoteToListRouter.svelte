<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { createEventDispatcher } from 'svelte';
    
    export let note: any; // The brain dump note to be routed
    export let showModal = false;
    
    const dispatch = createEventDispatcher<{
        close: void;
        success: { listType: string; itemId: string };
        error: { message: string };
    }>();
    
    let selectedList = 'shopping';
    let loading = false;
    let error = '';
    let success = '';
    
    // List type options
    const listTypes = [
        { id: 'shopping', label: 'Shopping List', icon: 'fa-shopping-cart' },
        { id: 'concert', label: 'Concert List', icon: 'fa-music' },
        { id: 'restaurant', label: 'Restaurant List', icon: 'fa-utensils' },
        { id: 'project', label: 'Projects List', icon: 'fa-tasks' }
    ];
    
    // Default values for each list type
    const defaultValues = {
        shopping: {
            name: note?.content?.substring(0, 50) || '',
            summary: note?.content || '',
            quantity: 1,
            status: 'Not Started',
            priority: 'Medium',
            checked: false
        },
        concert: {
            name: note?.content?.substring(0, 50) || '',
            artist: '',
            venue: '',
            date: null,
            notes: note?.content || '',
            status: 'active',
            priority: 'medium'
        },
        restaurant: {
            name: note?.content?.substring(0, 50) || '',
            cuisine: '',
            location: '',
            notes: note?.content || '',
            status: 'active',
            priority: 'medium'
        },
        project: {
            name: note?.content?.substring(0, 50) || '',
            description: note?.content || '',
            deadline: null,
            status: 'active',
            priority: 'medium'
        }
    };
    
    // The item to be added to the selected list
    let itemData = { ...defaultValues[selectedList] };
    
    // Update item data when selected list changes
    $: if (selectedList) {
        itemData = { ...defaultValues[selectedList] };
    }
    
    // Get table name based on selected list
    function getTableName(listType) {
        const tableMap = {
            'shopping': 'shopping_list',
            'concert': 'concert_list',
            'restaurant': 'restaurant_list',
            'project': 'projects_list'
        };
        return tableMap[listType];
    }
    
    // Add item to the selected list
    async function addToList() {
        loading = true;
        error = '';
        success = '';
        
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;
            
            if (!userId) {
                throw new Error('User not authenticated');
            }
            
            const tableName = getTableName(selectedList);
            
            // Add the note ID and user ID to the item data
            const dataToInsert = {
                ...itemData,
                original_note_id: note?.id,
                user_id: userId
            };
            
            const { data, error: err } = await supabase
                .from(tableName)
                .insert([dataToInsert])
                .select();
                
            if (err) throw err;
            
            success = `Added to ${listTypes.find(lt => lt.id === selectedList)?.label}`;
            
            // Dispatch success event
            dispatch('success', { 
                listType: selectedList, 
                itemId: data[0].id 
            });
            
            // Close modal after a short delay
            setTimeout(() => {
                dispatch('close');
            }, 1500);
            
        } catch (err) {
            console.error('Error adding to list:', err);
            error = err.message;
            dispatch('error', { message: err.message });
        } finally {
            loading = false;
        }
    }
    
    function closeModal() {
        dispatch('close');
    }
</script>

<!-- Modal backdrop -->
{#if showModal}
<div class="modal-backdrop" on:click|self={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="presentation">
    <!-- Modal content -->
    <div class="modal-content" role="dialog" aria-modal="true">
        <div class="modal-header">
            <h3>Add Note to List</h3>
            <button class="close-button" on:click={closeModal} aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="modal-body">
            {#if error}
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            {/if}
            
            {#if success}
                <div class="success-message">
                    <i class="fas fa-check-circle"></i>
                    {success}
                </div>
            {/if}
            
            <div class="note-preview">
                <h4>Note Content:</h4>
                <p>{note?.content || 'No content'}</p>
            </div>
            
            <div class="form-group">
                <label for="list-select">Select List:</label>
                <div class="list-options">
                    {#each listTypes as listType}
                        <button 
                            class="list-option {selectedList === listType.id ? 'selected' : ''}"
                            on:click={() => selectedList = listType.id}
                        >
                            <i class="fas {listType.icon}"></i>
                            {listType.label}
                        </button>
                    {/each}
                </div>
            </div>
            
            <!-- Dynamic form fields based on selected list -->
            <div class="form-fields">
                <div class="form-group">
                    <label for="name">Name:</label>
                    <input 
                        type="text" 
                        id="name" 
                        bind:value={itemData.name} 
                        placeholder="Enter a name"
                    />
                </div>
                
                {#if selectedList === 'shopping'}
                    <div class="form-group">
                        <label for="summary">Description:</label>
                        <textarea 
                            id="summary" 
                            bind:value={itemData.summary} 
                            placeholder="Enter a description"
                            rows="3"
                        ></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quantity">Quantity:</label>
                            <input 
                                type="number" 
                                id="quantity" 
                                bind:value={itemData.quantity} 
                                min="1"
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="priority">Priority:</label>
                            <select id="priority" bind:value={itemData.priority}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    
                {:else if selectedList === 'concert'}
                    <div class="form-group">
                        <label for="artist">Artist:</label>
                        <input 
                            type="text" 
                            id="artist" 
                            bind:value={itemData.artist} 
                            placeholder="Enter artist name"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="venue">Venue:</label>
                        <input 
                            type="text" 
                            id="venue" 
                            bind:value={itemData.venue} 
                            placeholder="Enter venue"
                        />
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="date">Date:</label>
                            <input 
                                type="date" 
                                id="date" 
                                bind:value={itemData.date}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="priority">Priority:</label>
                            <select id="priority" bind:value={itemData.priority}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes:</label>
                        <textarea 
                            id="notes" 
                            bind:value={itemData.notes} 
                            placeholder="Enter notes"
                            rows="3"
                        ></textarea>
                    </div>
                    
                {:else if selectedList === 'restaurant'}
                    <div class="form-group">
                        <label for="cuisine">Cuisine:</label>
                        <input 
                            type="text" 
                            id="cuisine" 
                            bind:value={itemData.cuisine} 
                            placeholder="Enter cuisine type"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="location">Location:</label>
                        <input 
                            type="text" 
                            id="location" 
                            bind:value={itemData.location} 
                            placeholder="Enter location"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="notes">Notes:</label>
                        <textarea 
                            id="notes" 
                            bind:value={itemData.notes} 
                            placeholder="Enter notes"
                            rows="3"
                        ></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="priority">Priority:</label>
                        <select id="priority" bind:value={itemData.priority}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    
                {:else if selectedList === 'project'}
                    <div class="form-group">
                        <label for="description">Description:</label>
                        <textarea 
                            id="description" 
                            bind:value={itemData.description} 
                            placeholder="Enter project description"
                            rows="3"
                        ></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="deadline">Deadline:</label>
                            <input 
                                type="date" 
                                id="deadline" 
                                bind:value={itemData.deadline}
                            />
                        </div>
                        
                        <div class="form-group">
                            <label for="priority">Priority:</label>
                            <select id="priority" bind:value={itemData.priority}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
        
        <div class="modal-footer">
            <button class="cancel-button" on:click={closeModal} disabled={loading}>
                Cancel
            </button>
            <button class="submit-button" on:click={addToList} disabled={loading}>
                {#if loading}
                    <i class="fas fa-spinner fa-spin"></i> Adding...
                {:else}
                    <i class="fas fa-plus"></i> Add to {listTypes.find(lt => lt.id === selectedList)?.label}
                {/if}
            </button>
        </div>
    </div>
</div>
{/if}

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
        border-radius: 0.5rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
    }
    
    .close-button:hover {
        color: #1f2937;
    }
    
    .modal-body {
        padding: 1.5rem;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .error-message {
        background-color: #fee2e2;
        color: #b91c1c;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .success-message {
        background-color: #d1fae5;
        color: #065f46;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .note-preview {
        background-color: #f3f4f6;
        padding: 0.75rem;
        border-radius: 0.375rem;
        margin-bottom: 1.5rem;
        max-height: 100px;
        overflow-y: auto;
    }
    
    .note-preview h4 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #4b5563;
    }
    
    .note-preview p {
        margin: 0;
        font-size: 0.875rem;
        color: #1f2937;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-row {
        display: flex;
        gap: 1rem;
    }
    
    .form-row .form-group {
        flex: 1;
    }
    
    label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: #4b5563;
    }
    
    input, textarea, select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }
    
    input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .list-options {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .list-option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        background-color: white;
        font-size: 0.875rem;
        font-weight: 500;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .list-option:hover {
        background-color: #f3f4f6;
    }
    
    .list-option.selected {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
    }
    
    .cancel-button {
        padding: 0.5rem 1rem;
        background-color: #f3f4f6;
        color: #4b5563;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    
    .cancel-button:hover {
        background-color: #e5e7eb;
    }
    
    .submit-button {
        padding: 0.5rem 1rem;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .submit-button:hover {
        background-color: #2563eb;
    }
    
    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>
