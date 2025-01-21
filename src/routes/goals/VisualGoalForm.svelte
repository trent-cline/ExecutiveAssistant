<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, slide } from 'svelte/transition';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { onMount } from 'svelte';

    export let show = false;

    const dispatch = createEventDispatcher();

    type GoalTemplate = {
        id: string;
        title: string;
        description: string;
        icon: string;
        category: string;
        suggestedMilestones?: string[];
    };

    const templates: GoalTemplate[] = [
        {
            id: 'fitness',
            title: 'Fitness Goal',
            description: 'Track your fitness and health progress',
            icon: 'fa-dumbbell',
            category: 'health',
            suggestedMilestones: [
                'Set up workout schedule',
                'Complete first workout',
                'Maintain consistency for a week',
                'Achieve initial target'
            ]
        },
        {
            id: 'learning',
            title: 'Learning Goal',
            description: 'Master a new skill or subject',
            icon: 'fa-book',
            category: 'personal',
            suggestedMilestones: [
                'Choose learning resources',
                'Complete first lesson/module',
                'Practice regularly',
                'Complete course/certification'
            ]
        },
        {
            id: 'business',
            title: 'Business Goal',
            description: 'Grow your business or career',
            icon: 'fa-briefcase',
            category: 'business',
            suggestedMilestones: [
                'Market research',
                'Create action plan',
                'Implementation phase',
                'Review and adjust'
            ]
        },
        {
            id: 'finance',
            title: 'Financial Goal',
            description: 'Save money or increase income',
            icon: 'fa-dollar-sign',
            category: 'finance',
            suggestedMilestones: [
                'Set target amount',
                'Create budget plan',
                'Track expenses',
                'Review progress monthly'
            ]
        },
        {
            id: 'custom',
            title: 'Custom Goal',
            description: 'Create your own goal from scratch',
            icon: 'fa-star',
            category: 'personal'
        }
    ];

    let selectedTemplate: GoalTemplate | null = null;
    let loading = false;
    let error = '';
    let showAdvanced = false;

    let formData = {
        title: '',
        description: '',
        category: 'personal',
        priority: 'medium',
        status: 'active',
        target_date: null as string | null,
        target_value: null as number | null,
        current_value: 0,
        milestones: [] as string[]
    };

    let newTag = '';

    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    function selectTemplate(template: GoalTemplate) {
        selectedTemplate = template;
        formData.category = template.category;
        if (template.suggestedMilestones) {
            formData.milestones = [...template.suggestedMilestones];
        }
    }

    function addTag() {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            formData.tags = [...formData.tags, newTag.trim()];
            newTag = '';
        }
    }

    function removeTag(tag: string) {
        formData.tags = formData.tags.filter(t => t !== tag);
    }

    async function handleSubmit() {
        if (!mounted) {
            error = 'Please wait for the form to initialize...';
            return;
        }

        if (!$user) {
            error = 'You must be logged in to create a goal.';
            return;
        }

        if (!formData.title) {
            error = 'Please enter a goal title';
            return;
        }

        loading = true;
        error = '';

        try {
            // Create the goal first
            const { data: goal, error: goalError } = await supabase
                .from('goals')
                .insert({
                    title: formData.title,
                    description: formData.description || '',
                    category: formData.category,
                    priority: formData.priority,
                    status: formData.status,
                    target_date: formData.target_date ? new Date(formData.target_date).toISOString() : null,
                    target_value: formData.target_value,
                    current_value: formData.current_value || 0,
                    template_id: selectedTemplate?.id || 'custom',
                    user_id: $user.id
                })
                .select()
                .single();

            if (goalError) throw goalError;

            // If goal created successfully, add milestones
            if (goal && formData.milestones.length > 0) {
                const milestonesData = formData.milestones
                    .filter(m => m.trim()) // Filter out empty milestones
                    .map((milestone, index) => ({
                        goal_id: goal.id,
                        description: milestone,
                        sort_order: index,
                        completed: false
                    }));

                if (milestonesData.length > 0) {
                    const { error: milestoneError } = await supabase
                        .from('goal_milestones')
                        .insert(milestonesData);

                    if (milestoneError) throw milestoneError;
                }
            }

            dispatch('goalCreated');
            close();
        } catch (err) {
            console.error('Error creating goal:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    function close() {
        show = false;
        selectedTemplate = null;
        formData = {
            title: '',
            description: '',
            category: 'personal',
            priority: 'medium',
            status: 'active',
            target_date: null,
            target_value: null,
            current_value: 0,
            milestones: []
        };
        dispatch('close');
    }
</script>

{#if show}
    <div class="modal-backdrop" on:click={close} in:fade>
        <div 
            class="modal-content"
            on:click|stopPropagation
            in:slide="{{ y: 20, duration: 300 }}"
        >
            <button class="close-btn" on:click={close}>
                <i class="fas fa-times"></i>
            </button>

            {#if !selectedTemplate}
                <div class="template-selection">
                    <h2>Choose a Goal Template</h2>
                    <p class="subtitle">Select a template to get started with predefined milestones, or create a custom goal.</p>
                    
                    <div class="template-grid">
                        {#each templates as template}
                            <button
                                class="template-card"
                                on:click={() => selectTemplate(template)}
                            >
                                <i class="fas {template.icon} template-icon"></i>
                                <h3>{template.title}</h3>
                                <p>{template.description}</p>
                            </button>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="goal-form">
                    <div class="form-header">
                        <button class="back-btn" on:click={() => selectedTemplate = null}>
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h2>
                            <i class="fas {selectedTemplate.icon}"></i>
                            {selectedTemplate.title}
                        </h2>
                    </div>

                    <form on:submit|preventDefault={handleSubmit}>
                        <div class="form-section">
                            <div class="form-group">
                                <label for="title">Goal Title *</label>
                                <input
                                    id="title"
                                    bind:value={formData.title}
                                    placeholder="What do you want to achieve?"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label for="description">Description</label>
                                <textarea
                                    id="description"
                                    bind:value={formData.description}
                                    class="form-control"
                                    rows="3"
                                    placeholder="Enter goal description (optional)"
                                ></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="target_date">Target Date</label>
                                    <input
                                        id="target_date"
                                        type="date"
                                        bind:value={formData.target_date}
                                    />
                                </div>

                                <div class="form-group">
                                    <label for="priority">Priority</label>
                                    <select id="priority" bind:value={formData.priority}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Milestones</label>
                                <div class="milestones-list">
                                    {#each formData.milestones as milestone, i}
                                        <div class="milestone-item">
                                            <i class="fas fa-check-circle milestone-icon"></i>
                                            <input
                                                bind:value={formData.milestones[i]}
                                                placeholder="Describe this milestone"
                                            />
                                            <button type="button" class="remove-btn" on:click={() => formData.milestones = formData.milestones.filter((_, index) => index !== i)}>
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    {/each}
                                    <button
                                        type="button"
                                        class="add-milestone-btn"
                                        on:click={() => formData.milestones = [...formData.milestones, '']}
                                    >
                                        <i class="fas fa-plus"></i> Add Milestone
                                    </button>
                                </div>
                            </div>

                            <div class="advanced-toggle">
                                <button type="button" on:click={() => showAdvanced = !showAdvanced}>
                                    <i class="fas fa-{showAdvanced ? 'chevron-up' : 'chevron-down'}"></i>
                                    Advanced Options
                                </button>
                            </div>

                            {#if showAdvanced}
                                <div class="advanced-section" transition:slide>
                                    <div class="form-group">
                                        <label>Tags</label>
                                        <div class="tags-input">
                                            <input
                                                bind:value={newTag}
                                                placeholder="Add a tag"
                                                on:keydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                            />
                                            <button type="button" class="add-btn" on:click={addTag}>
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                        <div class="tags-list">
                                            {#each formData.tags as tag}
                                                <span class="tag">
                                                    {tag}
                                                    <button type="button" on:click={() => removeTag(tag)}>
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                </span>
                                            {/each}
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <label for="frequency">Check-in Frequency</label>
                                        <select id="frequency" bind:value={formData.frequency}>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="none">No Check-ins</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label for="notes">Additional Notes</label>
                                        <textarea
                                            id="notes"
                                            bind:value={formData.notes}
                                            rows="3"
                                            placeholder="Any other details about your goal"
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>

                        {#if error}
                            <div class="error-message">
                                {error}
                            </div>
                        {/if}

                        <div class="form-actions">
                            <button type="submit" class="submit-btn" disabled={loading}>
                                {#if loading}
                                    <i class="fas fa-spinner fa-spin"></i>
                                {:else}
                                    Create Goal
                                {/if}
                            </button>
                        </div>
                    </form>
                </div>
            {/if}
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
        border-radius: 16px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 2rem;
        position: relative;
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: #4a5568;
        font-size: 1.25rem;
        padding: 0.5rem;
        cursor: pointer;
    }

    .template-selection h2 {
        font-size: 1.875rem;
        color: #1a202c;
        margin: 0 0 0.5rem 0;
        text-align: center;
    }

    .subtitle {
        text-align: center;
        color: #4a5568;
        margin-bottom: 2rem;
    }

    .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .template-card {
        background: #f7fafc;
        border: 2px solid transparent;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .template-card:hover {
        border-color: #4c1d95;
        transform: translateY(-2px);
    }

    .template-icon {
        font-size: 2rem;
        color: #4c1d95;
        margin-bottom: 1rem;
    }

    .template-card h3 {
        color: #2d3748;
        margin: 0 0 0.5rem 0;
    }

    .template-card p {
        color: #4a5568;
        margin: 0;
        font-size: 0.875rem;
    }

    .goal-form {
        margin-top: 1rem;
    }

    .form-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .back-btn {
        background: none;
        border: none;
        color: #4a5568;
        font-size: 1.25rem;
        padding: 0.5rem;
        cursor: pointer;
    }

    .form-header h2 {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
        color: #1a202c;
    }

    .form-section {
        background: #f7fafc;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #4a5568;
        margin-bottom: 0.5rem;
    }

    input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
    }

    textarea {
        resize: vertical;
    }

    .milestones-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .milestone-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: white;
        padding: 0.5rem;
        border-radius: 8px;
    }

    .milestone-icon {
        color: #4c1d95;
    }

    .add-milestone-btn {
        background: none;
        border: 2px dashed #cbd5e0;
        border-radius: 8px;
        padding: 0.75rem;
        color: #4a5568;
        cursor: pointer;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .add-milestone-btn:hover {
        border-color: #4c1d95;
        color: #4c1d95;
    }

    .advanced-toggle {
        text-align: center;
        margin: 1rem 0;
    }

    .advanced-toggle button {
        background: none;
        border: none;
        color: #4a5568;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 auto;
    }

    .tags-input {
        display: flex;
        gap: 0.5rem;
    }

    .add-btn {
        padding: 0.75rem;
        background: #4c1d95;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }

    .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .tag {
        background: #edf2f7;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        color: #4a5568;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .tag button {
        background: none;
        border: none;
        color: #a0aec0;
        padding: 0;
        cursor: pointer;
    }

    .error-message {
        color: #e53e3e;
        padding: 0.75rem;
        margin-bottom: 1rem;
        background: #fff5f5;
        border-radius: 8px;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
    }

    .submit-btn {
        background: #4c1d95;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
    }

    .submit-btn:hover {
        background: #6b21a8;
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }

        .template-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
