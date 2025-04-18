<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let employee: any;
    export let selected = false;
    export let editable = false;
    
    const dispatch = createEventDispatcher();
    
    function handleClick() {
        dispatch('click', employee);
    }
    
    function handleEdit() {
        dispatch('edit', employee);
    }
</script>

<div 
    class="team-member {selected ? 'selected' : ''}"
    on:click={handleClick}
>
    <div class="avatar">
        {employee.name.charAt(0)}
    </div>
    
    <div class="info">
        <div class="name">{employee.name}</div>
        <div class="title">{employee.title}</div>
        {#if employee.department}
            <div class="department">{employee.department}</div>
        {/if}
    </div>
    
    {#if editable}
        <button class="edit-button" on:click|stopPropagation={handleEdit}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    {/if}
</div>

<style>
    .team-member {
        display: flex;
        align-items: center;
        padding: 1rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        background: var(--surface-1, #ffffff);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    
    .team-member:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .team-member.selected {
        border-color: var(--surface-3, #3b82f6);
        background: #ebf5ff;
    }
    
    .avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 9999px;
        background: var(--surface-3, #3b82f6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1.25rem;
        margin-right: 1rem;
    }
    
    .info {
        flex: 1;
    }
    
    .name {
        font-weight: 600;
        color: var(--text-1, #111827);
        margin-bottom: 0.25rem;
    }
    
    .title {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        margin-bottom: 0.25rem;
    }
    
    .department {
        font-size: 0.75rem;
        color: var(--text-2, #6b7280);
        padding: 0.125rem 0.5rem;
        background: var(--surface-2, #f3f4f6);
        border-radius: 9999px;
        display: inline-block;
    }
    
    .edit-button {
        background: none;
        border: none;
        color: var(--text-2, #6b7280);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 9999px;
        transition: background-color 0.2s, color 0.2s;
    }
    
    .edit-button:hover {
        background: var(--surface-3, #3b82f6);
        color: white;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .team-member {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
        }
        
        .team-member.selected {
            background: #1e3a8a;
        }
        
        .department {
            background: var(--surface-2, #374151);
        }
    }
</style>
