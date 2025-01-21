<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { onMount } from 'svelte';

    export let show = false;

    const dispatch = createEventDispatcher();

    type Step = {
        title: string;
        description: string;
    };

    const steps: Step[] = [
        {
            title: "What's your goal?",
            description: "Start with a clear, specific goal you want to achieve."
        },
        {
            title: "Make it measurable",
            description: "How will you track progress? Add specific numbers or milestones."
        },
        {
            title: "Set a timeline",
            description: "When do you want to achieve this goal?"
        },
        {
            title: "Add details",
            description: "Additional information to help you succeed."
        }
    ];

    let currentStep = 0;
    let loading = false;
    let error = '';

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

    let newMilestone = '';

    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    function addMilestone() {
        if (newMilestone.trim()) {
            formData.milestones = [...formData.milestones, newMilestone.trim()];
            newMilestone = '';
        }
    }

    function removeMilestone(index: number) {
        formData.milestones = formData.milestones.filter((_, i) => i !== index);
    }

    function nextStep() {
        if (currentStep < steps.length - 1) {
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
        }
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
            in:fly="{{ y: 20, duration: 300 }}"
        >
            <div class="modal-header">
                <div class="step-info">
                    <h2>{steps[currentStep].title}</h2>
                    <p class="step-description">{steps[currentStep].description}</p>
                </div>
                <button class="close-btn" on:click={close}>
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="progress-bar">
                {#each steps as _, i}
                    <div 
                        class="progress-step" 
                        class:active={i === currentStep}
                        class:completed={i < currentStep}
                    />
                {/each}
            </div>

            <form on:submit|preventDefault={handleSubmit}>
                <div class="step-content">
                    {#if currentStep === 0}
                        <div class="form-group">
                            <label for="title">Goal Title *</label>
                            <input
                                id="title"
                                bind:value={formData.title}
                                placeholder="e.g., Run a marathon"
                                required
                            />
                        </div>

                        <div class="form-group">
                            <label for="description">Description</label>
                            <textarea
                                id="description"
                                bind:value={formData.description}
                                placeholder="Add some details about your goal..."
                                rows="3"
                            />
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="category">Category</label>
                                <select id="category" bind:value={formData.category}>
                                    <option value="personal">Personal</option>
                                    <option value="business">Business</option>
                                    <option value="health">Health</option>
                                    <option value="finance">Finance</option>
                                </select>
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
                    {:else if currentStep === 1}
                        <div class="form-group">
                            <label for="target_value">Target Value</label>
                            <input
                                id="target_value"
                                type="number"
                                bind:value={formData.target_value}
                                min="0"
                                placeholder="e.g., 42 (for km)"
                            />
                        </div>

                        <div class="form-group">
                            <label for="current_value">Starting Value</label>
                            <input
                                id="current_value"
                                type="number"
                                bind:value={formData.current_value}
                                min="0"
                                placeholder="e.g., 0"
                            />
                        </div>

                        <div class="form-group">
                            <label>Milestones</label>
                            <div class="milestone-input">
                                <input
                                    bind:value={newMilestone}
                                    placeholder="Add a milestone"
                                    on:keydown={(e) => e.key === 'Enter' && addMilestone()}
                                />
                                <button type="button" class="add-btn" on:click={addMilestone}>
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="milestones-list">
                                {#each formData.milestones as milestone, i}
                                    <div class="milestone-item">
                                        <span>{milestone}</span>
                                        <button type="button" class="remove-btn" on:click={() => removeMilestone(i)}>
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else if currentStep === 2}
                        <div class="form-group">
                            <label for="target_date">Target Date</label>
                            <input
                                id="target_date"
                                type="date"
                                bind:value={formData.target_date}
                            />
                        </div>

                        <div class="form-group">
                            <label for="frequency">Reminder Frequency</label>
                            <select id="frequency" bind:value={formData.frequency}>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="none">No Reminders</option>
                            </select>
                        </div>
                    {:else if currentStep === 3}
                        <div class="summary">
                            <h3>Goal Summary</h3>
                            <div class="summary-item">
                                <strong>Title:</strong> {formData.title}
                            </div>
                            <div class="summary-item">
                                <strong>Category:</strong> {formData.category}
                            </div>
                            <div class="summary-item">
                                <strong>Priority:</strong> {formData.priority}
                            </div>
                            {#if formData.target_value}
                                <div class="summary-item">
                                    <strong>Target:</strong> {formData.target_value}
                                </div>
                            {/if}
                            {#if formData.target_date}
                                <div class="summary-item">
                                    <strong>Deadline:</strong> {new Date(formData.target_date).toLocaleDateString()}
                                </div>
                            {/if}
                            {#if formData.milestones.length > 0}
                                <div class="summary-item">
                                    <strong>Milestones:</strong>
                                    <ul>
                                        {#each formData.milestones as milestone}
                                            <li>{milestone}</li>
                                        {/each}
                                    </ul>
                                </div>
                            {/if}
                        </div>
                    {/if}
                </div>

                {#if error}
                    <div class="error-message">
                        {error}
                    </div>
                {/if}

                <div class="form-actions">
                    {#if currentStep > 0}
                        <button type="button" class="back-btn" on:click={prevStep}>
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    {/if}

                    {#if currentStep < steps.length - 1}
                        <button type="button" class="next-btn" on:click={nextStep}>
                            Next <i class="fas fa-arrow-right"></i>
                        </button>
                    {:else}
                        <button type="submit" class="submit-btn" disabled={loading}>
                            {#if loading}
                                <i class="fas fa-spinner fa-spin"></i>
                            {:else}
                                Create Goal
                            {/if}
                        </button>
                    {/if}
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
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
    }

    .step-info {
        margin-right: 2rem;
    }

    h2 {
        font-size: 1.5rem;
        color: #1a202c;
        margin: 0 0 0.5rem 0;
    }

    .step-description {
        color: #4a5568;
        margin: 0;
    }

    .progress-bar {
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.5rem;
        background: #f7fafc;
    }

    .progress-step {
        width: 100%;
        height: 4px;
        background: #e2e8f0;
        margin: 0 2px;
    }

    .progress-step.active {
        background: #4c1d95;
    }

    .progress-step.completed {
        background: #9f7aea;
    }

    .step-content {
        padding: 1.5rem;
    }

    .form-group {
        margin-bottom: 1rem;
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
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
    }

    textarea {
        resize: vertical;
    }

    .milestone-input {
        display: flex;
        gap: 0.5rem;
    }

    .add-btn {
        padding: 0.5rem;
        background: #4c1d95;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }

    .milestones-list {
        margin-top: 0.5rem;
    }

    .milestone-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: #f7fafc;
        border-radius: 4px;
        margin-bottom: 0.5rem;
    }

    .remove-btn {
        background: none;
        border: none;
        color: #e53e3e;
        cursor: pointer;
        padding: 0.25rem;
    }

    .summary {
        background: #f7fafc;
        padding: 1rem;
        border-radius: 8px;
    }

    .summary h3 {
        margin: 0 0 1rem 0;
        color: #2d3748;
    }

    .summary-item {
        margin-bottom: 0.5rem;
    }

    .summary-item ul {
        margin: 0.5rem 0 0 1.5rem;
        padding: 0;
    }

    .error-message {
        color: #e53e3e;
        padding: 0.5rem;
        margin: 1rem 1.5rem;
        background: #fff5f5;
        border-radius: 6px;
    }

    .form-actions {
        display: flex;
        justify-content: space-between;
        padding: 1.5rem;
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

    .back-btn {
        background: #e2e8f0;
        color: #4a5568;
    }

    .next-btn {
        background: #4c1d95;
        color: white;
    }

    .submit-btn {
        background: #059669;
        color: white;
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

    @media (max-width: 640px) {
        .form-row {
            grid-template-columns: 1fr;
        }
    }
</style>
