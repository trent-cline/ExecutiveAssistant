<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    export let employees: any[] = [];
    
    const dispatch = createEventDispatcher();
    
    let title = '';
    let description = '';
    let meetingDate = new Date().toISOString().split('T')[0];
    let selectedParticipants: string[] = [];
    let objectives = '';
    let employeeObjectives: Record<string, string> = {};
    let activeTab = 'details';
    
    $: if (show) {
        resetForm();
    }
    
    function resetForm() {
        title = '';
        description = '';
        meetingDate = new Date().toISOString().split('T')[0];
        selectedParticipants = [];
        objectives = '';
        employeeObjectives = {};
        activeTab = 'details';
    }
    
    function handleClose() {
        dispatch('close');
    }
    
    function handleSubmit() {
        if (!title || !meetingDate || selectedParticipants.length === 0) {
            return;
        }
        
        dispatch('create', {
            title,
            description,
            meetingDate,
            participants: selectedParticipants,
            objectives,
            employeeObjectives
        });
    }
    
    function toggleParticipant(employeeId: string) {
        if (selectedParticipants.includes(employeeId)) {
            selectedParticipants = selectedParticipants.filter(id => id !== employeeId);
            // Remove objectives for this employee
            const { [employeeId]: _, ...rest } = employeeObjectives;
            employeeObjectives = rest;
        } else {
            selectedParticipants = [...selectedParticipants, employeeId];
            // Initialize objectives for this employee
            employeeObjectives = { ...employeeObjectives, [employeeId]: '' };
        }
    }
    
    function setEmployeeObjective(employeeId: string, objective: string) {
        employeeObjectives = { ...employeeObjectives, [employeeId]: objective };
    }
</script>

{#if show}
<div class="modal-backdrop" on:click={handleClose}>
    <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
            <h2>Create New Meeting</h2>
            <button class="close-button" on:click={handleClose} aria-label="Close">×</button>
        </div>
        
        <div class="modal-tabs">
            <button 
                class="tab-button {activeTab === 'details' ? 'active' : ''}" 
                on:click={() => activeTab = 'details'}
            >
                Meeting Details
            </button>
            <button 
                class="tab-button {activeTab === 'participants' ? 'active' : ''}" 
                on:click={() => activeTab = 'participants'}
                disabled={!title || !meetingDate}
            >
                Participants
            </button>
            <button 
                class="tab-button {activeTab === 'objectives' ? 'active' : ''}" 
                on:click={() => activeTab = 'objectives'}
                disabled={selectedParticipants.length === 0}
            >
                Objectives
            </button>
        </div>
        
        <div class="modal-body">
            {#if activeTab === 'details'}
                <div class="form-group">
                    <label for="title">Meeting Title*</label>
                    <input 
                        type="text" 
                        id="title" 
                        bind:value={title} 
                        placeholder="Enter meeting title"
                        required
                    />
                </div>
                
                <div class="form-group">
                    <label for="description">Description</label>
                    <textarea 
                        id="description" 
                        bind:value={description} 
                        placeholder="Enter meeting description"
                        rows="3"
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label for="meeting-date">Meeting Date*</label>
                    <input 
                        type="date" 
                        id="meeting-date" 
                        bind:value={meetingDate} 
                        required
                    />
                </div>
                
                <div class="form-actions">
                    <button class="cancel-button" on:click={handleClose}>Cancel</button>
                    <button 
                        class="next-button" 
                        on:click={() => activeTab = 'participants'}
                        disabled={!title || !meetingDate}
                    >
                        Next: Select Participants
                    </button>
                </div>
            {:else if activeTab === 'participants'}
                <div class="participants-selection">
                    <p class="instruction">Select up to 4 participants for this meeting:</p>
                    
                    <div class="participants-list">
                        {#each employees as employee}
                            <div 
                                class="participant-item {selectedParticipants.includes(employee.id) ? 'selected' : ''}"
                                on:click={() => toggleParticipant(employee.id)}
                            >
                                <div class="participant-avatar">
                                    {employee.name.charAt(0)}
                                </div>
                                <div class="participant-info">
                                    <div class="participant-name">{employee.name}</div>
                                    <div class="participant-title">{employee.title}</div>
                                </div>
                                <div class="participant-checkbox">
                                    {#if selectedParticipants.includes(employee.id)}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M20 6L9 17l-5-5"></path>
                                        </svg>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="back-button" on:click={() => activeTab = 'details'}>Back</button>
                    <button 
                        class="next-button" 
                        on:click={() => activeTab = 'objectives'}
                        disabled={selectedParticipants.length === 0}
                    >
                        Next: Set Objectives
                    </button>
                </div>
            {:else if activeTab === 'objectives'}
                <div class="objectives-section">
                    <div class="form-group">
                        <label for="meeting-objectives">Overall Meeting Objectives</label>
                        <textarea 
                            id="meeting-objectives" 
                            bind:value={objectives} 
                            placeholder="Enter the overall objectives for this meeting"
                            rows="3"
                        ></textarea>
                    </div>
                    
                    <h3>Participant Objectives</h3>
                    <p class="instruction">Set specific objectives for each participant:</p>
                    
                    {#each selectedParticipants as participantId}
                        {@const employee = employees.find(e => e.id === participantId)}
                        {#if employee}
                            <div class="participant-objectives">
                                <div class="participant-header">
                                    <div class="participant-avatar">
                                        {employee.name.charAt(0)}
                                    </div>
                                    <div class="participant-name">{employee.name}</div>
                                </div>
                                
                                <div class="form-group">
                                    <textarea 
                                        placeholder={`Objectives for ${employee.name}`}
                                        value={employeeObjectives[participantId] || ''}
                                        on:input={(e) => setEmployeeObjective(participantId, e.target.value)}
                                        rows="2"
                                    ></textarea>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
                
                <div class="form-actions">
                    <button class="back-button" on:click={() => activeTab = 'participants'}>Back</button>
                    <button class="create-button" on:click={handleSubmit}>Create Meeting</button>
                </div>
            {/if}
        </div>
    </div>
</div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: var(--surface-1, #ffffff);
        border-radius: 0.5rem;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    
    .modal-header h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-1, #111827);
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--text-2, #6b7280);
        padding: 0.25rem;
    }
    
    .modal-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    
    .tab-button {
        flex: 1;
        padding: 0.75rem;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        font-weight: 500;
        color: var(--text-2, #6b7280);
        cursor: pointer;
    }
    
    .tab-button.active {
        color: var(--surface-3, #3b82f6);
        border-bottom-color: var(--surface-3, #3b82f6);
    }
    
    .tab-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .modal-body {
        padding: 1.25rem;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        color: var(--text-1, #111827);
    }
    
    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
        background: var(--surface-1, #ffffff);
        color: var(--text-1, #111827);
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--surface-3, #3b82f6);
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
    }
    
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
    }
    
    .cancel-button,
    .back-button {
        padding: 0.5rem 1rem;
        background: var(--surface-2, #f3f4f6);
        color: var(--text-2, #6b7280);
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
    }
    
    .next-button,
    .create-button {
        padding: 0.5rem 1rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
    }
    
    .next-button:disabled,
    .create-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .instruction {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
        margin-bottom: 1rem;
    }
    
    .participants-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .participant-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .participant-item:hover {
        background: var(--surface-2, #f3f4f6);
    }
    
    .participant-item.selected {
        background: #ebf5ff;
        border-color: var(--surface-3, #3b82f6);
    }
    
    .participant-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 9999px;
        background: var(--surface-3, #3b82f6);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        margin-right: 0.75rem;
    }
    
    .participant-info {
        flex: 1;
    }
    
    .participant-name {
        font-weight: 500;
        color: var(--text-1, #111827);
    }
    
    .participant-title {
        font-size: 0.875rem;
        color: var(--text-2, #6b7280);
    }
    
    .participant-checkbox {
        color: var(--surface-3, #3b82f6);
    }
    
    .participant-objectives {
        margin-bottom: 1rem;
        padding: 0.75rem;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.375rem;
    }
    
    .participant-header {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .modal-content {
            background: var(--surface-1, #1f2937);
        }
        
        .form-group input,
        .form-group textarea {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
            color: var(--text-1, #f9fafb);
        }
        
        .participant-item {
            border-color: var(--border-color, #374151);
        }
        
        .participant-item:hover {
            background: var(--surface-2, #374151);
        }
        
        .participant-item.selected {
            background: #1e3a8a;
            border-color: var(--surface-3, #3b82f6);
        }
        
        .cancel-button,
        .back-button {
            background: var(--surface-2, #374151);
            color: var(--text-2, #9ca3af);
        }
        
        .participant-objectives {
            border-color: var(--border-color, #374151);
        }
    }
</style>
