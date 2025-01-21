<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let project = {
        company_name: '',
        partner_name: '',
        industry: '',
        ownership: 0,
        development_revenue: '',
        additional_revenue: '',
        exclusivity: '',
        status: 'Active'
    };

    onMount(() => {
        if (!$user) {
            goto('/login');
        }
    });

    async function saveProject() {
        try {
            const projectData = {
                ...project,
                user_id: $user?.id,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('active_projects')
                .insert([projectData])
                .select();

            if (error) throw error;
            goto('/projects');
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project. Please try again.');
        }
    }
</script>

<div class="container">
    <div class="header">
        <h1>New Project</h1>
    </div>

    <form on:submit|preventDefault={saveProject} class="form">
        <div class="form-group">
            <label for="company_name">Company Name</label>
            <input
                type="text"
                id="company_name"
                bind:value={project.company_name}
                required
                placeholder="Enter company name"
            />
        </div>

        <div class="form-group">
            <label for="partner_name">Partner Name</label>
            <input
                type="text"
                id="partner_name"
                bind:value={project.partner_name}
                required
                placeholder="Enter partner name"
            />
        </div>

        <div class="form-group">
            <label for="industry">Industry</label>
            <input
                type="text"
                id="industry"
                bind:value={project.industry}
                required
                placeholder="Enter industry"
            />
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="ownership">Ownership %</label>
                <input
                    type="number"
                    id="ownership"
                    bind:value={project.ownership}
                    min="0"
                    max="100"
                    required
                    placeholder="Enter ownership percentage"
                />
            </div>

            <div class="form-group">
                <label for="development_revenue">Development Revenue</label>
                <input
                    type="text"
                    id="development_revenue"
                    bind:value={project.development_revenue}
                    placeholder="Enter development revenue"
                />
            </div>
        </div>

        <div class="form-group">
            <label for="additional_revenue">Additional Revenue</label>
            <input
                type="text"
                id="additional_revenue"
                bind:value={project.additional_revenue}
                placeholder="Enter additional revenue details"
            />
        </div>

        <div class="form-group">
            <label for="exclusivity">Exclusivity</label>
            <textarea
                id="exclusivity"
                bind:value={project.exclusivity}
                rows="2"
                placeholder="Enter exclusivity details"
            ></textarea>
        </div>

        <div class="form-group">
            <label for="status">Status</label>
            <select id="status" bind:value={project.status}>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
            </select>
        </div>

        <div class="button-group">
            <button type="button" class="cancel-button" on:click={() => goto('/projects')}>
                Cancel
            </button>
            <button type="submit" class="save-button">
                Save Project
            </button>
        </div>
    </form>
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .header {
        margin-bottom: 2rem;
    }

    .form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    label {
        font-weight: 500;
        color: #333;
    }

    input, select, textarea {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    textarea {
        resize: vertical;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
    }

    .cancel-button {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
    }

    .save-button {
        padding: 0.5rem 1rem;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .save-button:hover {
        background: #45a049;
    }

    @media (max-width: 768px) {
        .container {
            padding: 0.5rem;
        }

        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>
