<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { StructureNode } from '$lib/types/structure';
    
    export let show = false;
    export let existingNodes: StructureNode[] = [];
    
    const dispatch = createEventDispatcher();
    
    let name = '';
    let type: 'company' | 'platform' | 'module' | 'revenue' = 'module';
    let description = '';
    let platform = '';
    let ownership: number | null = null;
    let monthlyRevenue: number | null = null;
    let connections: string[] = [];
    
    function handleSubmit() {
        const newNode: Partial<StructureNode> = {
            name,
            type,
            description,
            connections,
            platform: platform || undefined,
            ownership: ownership || undefined,
            monthlyRevenue: monthlyRevenue || undefined
        };
        
        dispatch('create', newNode);
        closeModal();
    }
    
    function closeModal() {
        show = false;
        resetForm();
    }
    
    function resetForm() {
        name = '';
        type = 'module';
        description = '';
        platform = '';
        ownership = null;
        monthlyRevenue = null;
        connections = [];
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click|self={closeModal}>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Node</h2>
                <button class="close-btn" on:click={closeModal}>×</button>
            </div>
            
            <form on:submit|preventDefault={handleSubmit}>
                <div class="form-group">
                    <label for="name">Name*</label>
                    <input
                        type="text"
                        id="name"
                        bind:value={name}
                        required
                        placeholder="Enter node name"
                    />
                </div>
                
                <div class="form-group">
                    <label for="type">Type*</label>
                    <select id="type" bind:value={type} required>
                        <option value="company">Company</option>
                        <option value="platform">Platform</option>
                        <option value="module">Module</option>
                        <option value="revenue">Revenue</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea
                        id="description"
                        bind:value={description}
                        placeholder="Enter description"
                        rows="3"
                    ></textarea>
                </div>
                
                {#if type === 'module'}
                    <div class="form-group">
                        <label for="platform">Platform</label>
                        <select id="platform" bind:value={platform}>
                            <option value="">None</option>
                            {#each existingNodes.filter(n => n.type === 'platform') as node}
                                <option value={node.name}>{node.name}</option>
                            {/each}
                        </select>
                    </div>
                {/if}
                
                {#if type === 'company'}
                    <div class="form-group">
                        <label for="ownership">Ownership %</label>
                        <input
                            type="number"
                            id="ownership"
                            bind:value={ownership}
                            min="0"
                            max="100"
                            placeholder="Enter ownership percentage"
                        />
                    </div>
                {/if}
                
                {#if type === 'revenue' || type === 'module'}
                    <div class="form-group">
                        <label for="monthlyRevenue">Monthly Revenue</label>
                        <input
                            type="number"
                            id="monthlyRevenue"
                            bind:value={monthlyRevenue}
                            min="0"
                            placeholder="Enter monthly revenue"
                        />
                    </div>
                {/if}
                
                <div class="form-group">
                    <label>Connections</label>
                    <div class="connections-list">
                        {#each existingNodes as node}
                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    value={node.id}
                                    checked={connections.includes(node.id)}
                                    on:change={(e) => {
                                        if (e.currentTarget.checked) {
                                            connections = [...connections, node.id];
                                        } else {
                                            connections = connections.filter(id => id !== node.id);
                                        }
                                    }}
                                />
                                {node.name}
                            </label>
                        {/each}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" on:click={closeModal}>
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary">
                        Create Node
                    </button>
                </div>
            </form>
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
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 1.5rem;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .modal-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        color: #6b7280;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
    }
    
    input[type="text"],
    input[type="number"],
    select,
    textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
    }
    
    .connections-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        padding: 0.5rem;
    }
    
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0;
    }
    
    .checkbox-label input[type="checkbox"] {
        width: auto;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .btn {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .btn-primary {
        background: #3b82f6;
        color: white;
        border: none;
    }
    
    .btn-primary:hover {
        background: #2563eb;
    }
    
    .btn-secondary {
        background: white;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .btn-secondary:hover {
        background: #f3f4f6;
    }
</style>
