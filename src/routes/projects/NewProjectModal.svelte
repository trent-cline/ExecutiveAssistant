<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { fade, fly } from 'svelte/transition';

    export let show = false;
    export let projectType: 'active' | 'static' | 'mentor' | 'probono' = 'active';

    const dispatch = createEventDispatcher();

    let formData = {
        company_name: '',
        partner_name: '',
        industry: '',
        ownership: projectType === 'active' ? 0 : null,
        development_revenue: '',
        additional_revenue: '',
        exclusivity: '',
        status: 'Active',
        website: '',
        description: '',
        impact_statement: '',
        target_audience: '',
        hosting_provider: '',
        domain_provider: '',
        monthly_cost: null as number | null,
        sample_website: ''
    };

    let loading = false;
    let error = '';

    async function handleSubmit() {
        if (!$user) {
            error = 'You must be logged in to create a project.';
            return;
        }

        if (!formData.company_name || !formData.partner_name) {
            error = 'Company name and partner name are required.';
            return;
        }

        loading = true;
        error = '';

        try {
            let table: string;
            let data: any = {
                company_name: formData.company_name,
                partner_name: formData.partner_name,
                industry: formData.industry,
                status: formData.status,
                website: formData.website,
                user_id: $user?.id
            };

            switch (projectType) {
                case 'active':
                    table = 'active_projects';
                    data = {
                        ...data,
                        ownership: formData.ownership,
                        development_revenue: formData.development_revenue,
                        additional_revenue: formData.additional_revenue,
                        exclusivity: formData.exclusivity
                    };
                    break;
                case 'static':
                    table = 'static_website_projects';
                    data = {
                        ...data,
                        hosting_provider: formData.hosting_provider,
                        domain_provider: formData.domain_provider,
                        monthly_cost: formData.monthly_cost
                    };
                    break;
                case 'mentor':
                    table = 'mentor_to_launch_projects';
                    data = {
                        ...data,
                        sample_website: formData.sample_website
                    };
                    break;
                case 'probono':
                    table = 'pro_bono_projects';
                    data = {
                        ...data,
                        description: formData.description,
                        impact_statement: formData.impact_statement,
                        target_audience: formData.target_audience
                    };
                    break;
            }

            const { error: err } = await supabase
                .from(table)
                .insert([data]);

            if (err) throw err;

            dispatch('projectAdded');
            closeModal();
        } catch (err) {
            console.error('Error adding project:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function closeModal() {
        show = false;
        dispatch('close');
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={closeModal} in:fade>
        <div 
            class="modal-content"
            on:click|stopPropagation
            in:fly="{{ y: 20, duration: 300 }}"
        >
            <div class="modal-header">
                <h2>Add New {projectType === 'active' ? 'Active' : projectType === 'static' ? 'Static Website' : projectType === 'mentor' ? 'Mentor to Launch' : 'Pro Bono'} Project</h2>
                <button 
                    class="close-button" 
                    on:click={closeModal}
                    aria-label="Close modal"
                >
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>

            <form on:submit|preventDefault={handleSubmit}>
                <!-- Common Fields -->
                <div class="form-grid">
                    <div class="form-group">
                        <label for="company_name">
                            {projectType === 'probono' ? 'Organization Name' : 'Company Name'}
                            <span class="required">*</span>
                        </label>
                        <input
                            id="company_name"
                            bind:value={formData.company_name}
                            placeholder="Enter company name"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="partner_name">
                            {projectType === 'probono' ? 'Contact Name' : 'Partner Name'}
                        </label>
                        <input
                            id="partner_name"
                            bind:value={formData.partner_name}
                            placeholder="Enter partner name"
                        />
                    </div>

                    <div class="form-group">
                        <label for="industry">
                            {projectType === 'probono' ? 'Focus Area' : 'Industry'}
                        </label>
                        <input
                            id="industry"
                            bind:value={formData.industry}
                            placeholder="Enter industry"
                        />
                    </div>

                    <div class="form-group">
                        <label for="status">Status</label>
                        <select id="status" bind:value={formData.status}>
                            <option value="Active">Active</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="website">Website</label>
                        <input
                            id="website"
                            type="url"
                            bind:value={formData.website}
                            placeholder="Enter website URL"
                        />
                    </div>

                    <!-- Active Project Fields -->
                    {#if projectType === 'active'}
                        <div class="form-group">
                            <label for="ownership">Ownership %</label>
                            <input
                                id="ownership"
                                type="number"
                                bind:value={formData.ownership}
                                min="0"
                                max="100"
                                placeholder="Enter ownership percentage"
                            />
                        </div>

                        <div class="form-group">
                            <label for="exclusivity">Exclusivity</label>
                            <input
                                id="exclusivity"
                                bind:value={formData.exclusivity}
                                placeholder="Enter exclusivity"
                            />
                        </div>

                        <div class="form-group">
                            <label for="development_revenue">Development Revenue</label>
                            <input
                                id="development_revenue"
                                bind:value={formData.development_revenue}
                                placeholder="Enter development revenue"
                            />
                        </div>

                        <div class="form-group">
                            <label for="additional_revenue">Additional Revenue</label>
                            <input
                                id="additional_revenue"
                                bind:value={formData.additional_revenue}
                                placeholder="Enter additional revenue"
                            />
                        </div>
                    {/if}

                    <!-- Static Website Fields -->
                    {#if projectType === 'static'}
                        <div class="form-group">
                            <label for="hosting_provider">Hosting Provider</label>
                            <input
                                id="hosting_provider"
                                bind:value={formData.hosting_provider}
                                placeholder="e.g., Vercel, Netlify"
                            />
                        </div>

                        <div class="form-group">
                            <label for="domain_provider">Domain Provider</label>
                            <input
                                id="domain_provider"
                                bind:value={formData.domain_provider}
                                placeholder="e.g., GoDaddy, Namecheap"
                            />
                        </div>

                        <div class="form-group">
                            <label for="monthly_cost">Monthly Cost</label>
                            <input
                                id="monthly_cost"
                                type="number"
                                step="0.01"
                                min="0"
                                bind:value={formData.monthly_cost}
                                placeholder="Enter monthly cost"
                            />
                        </div>
                    {/if}

                    <!-- Mentor to Launch Fields -->
                    {#if projectType === 'mentor'}
                        <div class="form-group">
                            <label for="sample_website">Sample Website</label>
                            <input
                                id="sample_website"
                                type="url"
                                bind:value={formData.sample_website}
                                placeholder="Enter sample website URL"
                            />
                        </div>
                    {/if}

                    <!-- Pro Bono Fields -->
                    {#if projectType === 'probono'}
                        <div class="form-group">
                            <label for="description">Project Description</label>
                            <textarea
                                id="description"
                                bind:value={formData.description}
                                rows="3"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label for="impact_statement">Impact Statement</label>
                            <textarea
                                id="impact_statement"
                                bind:value={formData.impact_statement}
                                rows="3"
                                placeholder="How will this project make a difference?"
                            ></textarea>
                        </div>

                        <div class="form-group">
                            <label for="target_audience">Target Audience</label>
                            <input
                                id="target_audience"
                                bind:value={formData.target_audience}
                                placeholder="Who will benefit from this project?"
                            />
                        </div>
                    {/if}
                </div>

                {#if error}
                    <div class="error-message">
                        {error}
                    </div>
                {/if}

                <div class="form-actions">
                    <button type="button" class="cancel-btn" on:click={closeModal} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" class="submit-btn" disabled={loading}>
                        {#if loading}
                            <i class="fas fa-spinner fa-spin"></i>
                        {:else}
                            Add Project
                        {/if}
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
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
    }

    h2 {
        font-size: 1.5rem;
        color: #1a202c;
        margin: 0;
    }

    .close-button {
        background: none;
        border: none;
        color: #4a5568;
        cursor: pointer;
        font-size: 1.25rem;
        padding: 0.5rem;
    }

    .close-button:hover {
        color: #2d3748;
    }

    form {
        padding: 1.5rem;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
    }

    input, textarea {
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
    }

    textarea {
        width: 100%;
        min-height: 100px;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        resize: vertical;
    }

    .error-message {
        color: #e53e3e;
        margin: 1rem 0;
        padding: 0.5rem;
        background: #fff5f5;
        border-radius: 6px;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e2e8f0;
    }

    button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .cancel-btn {
        background: #e2e8f0;
        color: #4a5568;
    }

    .submit-btn {
        background: #4c1d95;
        color: white;
    }

    .cancel-btn:hover:not(:disabled) {
        background: #cbd5e0;
    }

    .submit-btn:hover:not(:disabled) {
        background: #6d28d9;
    }

    @media (max-width: 640px) {
        .modal-content {
            width: 95%;
        }

        .form-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
