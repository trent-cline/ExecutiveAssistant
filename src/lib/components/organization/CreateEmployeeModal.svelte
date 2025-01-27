<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    export let existingEmployees: any[] = [];
    
    const dispatch = createEventDispatcher();
    
    let name = '';
    let title = '';
    let role = 'Other';
    let status = 'Full-Time';
    let email = '';
    let department = '';
    let reportsTo = '';

    const roles = ['CEO', 'Manager', 'Developer', 'Designer', 'Product', 'Marketing', 'Sales', 'Other'];
    const statuses = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];

    function handleSubmit() {
        dispatch('create', {
            name,
            title,
            role,
            status,
            email,
            department,
            reports_to: reportsTo || null
        });
    }

    function closeModal() {
        dispatch('close');
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click|self={closeModal}>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Employee</h2>
            </div>
            
            <form on:submit|preventDefault={handleSubmit}>
                <div class="form-group">
                    <label for="name">Name *</label>
                    <input
                        type="text"
                        id="name"
                        bind:value={name}
                        required
                        placeholder="Enter employee name"
                    />
                </div>

                <div class="form-group">
                    <label for="title">Title *</label>
                    <input
                        type="text"
                        id="title"
                        bind:value={title}
                        required
                        placeholder="Enter job title"
                    />
                </div>

                <div class="form-group">
                    <label for="role">Role *</label>
                    <select id="role" bind:value={role} required>
                        {#each roles as r}
                            <option value={r}>{r}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="status">Status *</label>
                    <select id="status" bind:value={status} required>
                        {#each statuses as s}
                            <option value={s}>{s}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        placeholder="Enter email address"
                    />
                </div>

                <div class="form-group">
                    <label for="department">Department</label>
                    <input
                        type="text"
                        id="department"
                        bind:value={department}
                        placeholder="Enter department"
                    />
                </div>

                <div class="form-group">
                    <label for="reportsTo">Reports To</label>
                    <select id="reportsTo" bind:value={reportsTo}>
                        <option value="">No Manager</option>
                        {#each existingEmployees as emp}
                            <option value={emp.id}>{emp.name} ({emp.title})</option>
                        {/each}
                    </select>
                </div>

                <div class="button-group">
                    <button type="button" class="cancel" on:click={closeModal}>
                        Cancel
                    </button>
                    <button type="submit" class="submit">
                        Add Employee
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
        background: var(--surface-1, #ffffff);
        border-radius: 0.75rem;
        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        width: 90%;
        max-width: 32rem;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }

    form {
        padding: 1.5rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-2, #4b5563);
        margin-bottom: 0.5rem;
    }

    input, select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--border-color, #d1d5db);
        border-radius: 0.375rem;
        background: var(--surface-1, #ffffff);
        color: var(--text-1, #111827);
    }

    input:focus, select:focus {
        outline: none;
        border-color: var(--surface-3, #3b82f6);
        ring: 2px var(--surface-3, #3b82f6);
    }

    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .cancel {
        background: var(--surface-1, #ffffff);
        border: 1px solid var(--border-color, #d1d5db);
        color: var(--text-2, #4b5563);
    }

    .cancel:hover {
        background: var(--surface-2, #f3f4f6);
    }

    .submit {
        background: var(--surface-3, #3b82f6);
        border: 1px solid transparent;
        color: white;
    }

    .submit:hover {
        background: var(--surface-4, #2563eb);
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .modal-content {
            background: var(--surface-1, #1f2937);
        }

        h2 {
            color: var(--text-1, #f3f4f6);
        }

        label {
            color: var(--text-2, #9ca3af);
        }

        input, select {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
            color: var(--text-1, #f3f4f6);
        }

        .cancel {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
            color: var(--text-2, #9ca3af);
        }

        .cancel:hover {
            background: var(--surface-2, #374151);
        }
    }
</style>
