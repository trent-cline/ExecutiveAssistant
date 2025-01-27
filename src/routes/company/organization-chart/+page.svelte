<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { goto } from '$app/navigation';
    import OrganizationChart from '$lib/components/organization/OrganizationChart.svelte';
    import CreateEmployeeModal from '$lib/components/organization/CreateEmployeeModal.svelte';
    import EditEmployeeModal from '$lib/components/organization/EditEmployeeModal.svelte';

    let employees: any[] = [];
    let showAddModal = false;
    let showEditModal = false;
    let selectedEmployee: any = null;
    let loading = true;
    let error: string | null = null;

    onMount(async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
            goto('/login');
            return;
        }

        await loadEmployees();
    });

    async function loadEmployees() {
        try {
            const { data, error: err } = await supabase
                .from('organization_employees')
                .select('*')
                .order('created_at');

            if (err) throw err;

            employees = data || [];
        } catch (err: any) {
            console.error('Error loading employees:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    async function handleCreateEmployee(event: CustomEvent) {
        try {
            const employee = event.detail;
            
            const { data, error: err } = await supabase
                .from('organization_employees')
                .insert([{
                    name: employee.name,
                    title: employee.title,
                    role: employee.role,
                    status: employee.status,
                    email: employee.email,
                    department: employee.department,
                    reports_to: employee.reports_to
                }])
                .select()
                .single();
                
            if (err) throw err;
            
            employees = [...employees, data];
            showAddModal = false;
        } catch (err: any) {
            console.error('Error creating employee:', err);
            error = err.message;
        }
    }

    async function handleUpdateEmployee(event: CustomEvent) {
        try {
            const employee = event.detail;
            
            const { data, error: err } = await supabase
                .from('organization_employees')
                .update({
                    name: employee.name,
                    title: employee.title,
                    role: employee.role,
                    status: employee.status,
                    email: employee.email,
                    department: employee.department,
                    reports_to: employee.reports_to
                })
                .eq('id', employee.id)
                .select()
                .single();
                
            if (err) throw err;
            
            employees = employees.map(emp => 
                emp.id === data.id ? data : emp
            );
            showEditModal = false;
        } catch (err: any) {
            console.error('Error updating employee:', err);
            error = err.message;
        }
    }

    async function handleDeleteEmployee(event: CustomEvent) {
        try {
            const { id } = event.detail;
            
            // First check if this employee has any direct reports
            const hasDirectReports = employees.some(emp => emp.reports_to === id);
            if (hasDirectReports) {
                throw new Error('Cannot delete employee with direct reports. Please reassign their reports first.');
            }
            
            const { error: err } = await supabase
                .from('organization_employees')
                .delete()
                .eq('id', id);
                
            if (err) throw err;
            
            employees = employees.filter(emp => emp.id !== id);
            showEditModal = false;
        } catch (err: any) {
            console.error('Error deleting employee:', err);
            error = err.message;
        }
    }

    function handleEmployeeDoubleClick(event: CustomEvent) {
        selectedEmployee = event.detail;
        showEditModal = true;
    }
</script>

<div class="organization-chart">
    <div class="header">
        <h1>Organization Chart</h1>
        <button class="add-button" on:click={() => showAddModal = true}>
            Add Employee
        </button>
    </div>

    {#if error}
        <div class="error" role="alert">
            <p>{error}</p>
            <button 
                class="close-error" 
                on:click={() => error = null}
                aria-label="Dismiss error"
            >
                ×
            </button>
        </div>
    {/if}

    {#if loading}
        <div class="loading" role="status">
            <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading organization data...</span>
        </div>
    {:else if employees.length === 0}
        <div class="empty-state">
            <p>No employees found. Click "Add Employee" to create your first employee.</p>
        </div>
    {:else}
        <div class="chart">
            <OrganizationChart 
                {employees} 
                on:dblclick={handleEmployeeDoubleClick}
            />
        </div>
    {/if}
</div>

<CreateEmployeeModal
    show={showAddModal}
    existingEmployees={employees}
    on:create={handleCreateEmployee}
    on:close={() => showAddModal = false}
/>

<EditEmployeeModal
    show={showEditModal}
    employee={selectedEmployee}
    existingEmployees={employees}
    on:update={handleUpdateEmployee}
    on:delete={handleDeleteEmployee}
    on:close={() => showEditModal = false}
/>

<style>
    .organization-chart {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 1.875rem;
        font-weight: 600;
        color: var(--text-1, #111827);
        margin: 0;
    }

    .add-button {
        display: inline-flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--surface-3, #3b82f6);
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .add-button:hover {
        background: var(--surface-4, #2563eb);
    }

    .error {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #fee2e2;
        border: 1px solid #ef4444;
        border-radius: 0.375rem;
        color: #991b1b;
        margin-bottom: 1rem;
    }

    .error p {
        margin: 0;
    }

    .close-error {
        background: none;
        border: none;
        color: #991b1b;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.25rem;
    }

    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
        height: 100%;
        color: var(--text-2, #6b7280);
    }

    .empty-state {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: var(--text-2, #6b7280);
        text-align: center;
        padding: 2rem;
    }

    .chart {
        flex: 1;
        min-height: 0;
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 0.5rem;
        background: var(--surface-1, #ffffff);
        position: relative;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .error {
            background: #7f1d1d;
            border-color: #b91c1c;
            color: #fee2e2;
        }

        .close-error {
            color: #fee2e2;
        }

        .chart {
            background: var(--surface-1, #1f2937);
            border-color: var(--border-color, #374151);
        }
    }
</style>
