<script>
    import { createEventDispatcher } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import { user } from '$lib/auth';

    const dispatch = createEventDispatcher();

    let goal = {
        title: '',
        description: '',
        category: 'personal',
        type: 'milestone',
        target_value: null,
        current_value: 0,
        target_date: null,
        priority: 'medium'
    };

    let loading = false;
    let error = '';
    let mounted = false;

    onMount(() => {
        mounted = true;
    });

    const goalTypes = [
        { id: 'milestone', label: 'One-time Goal', icon: '🎯' },
        { id: 'habit', label: 'Daily Habit', icon: '🔄' },
        { id: 'achievement', label: 'Achievement', icon: '🏆' }
    ];

    const priorities = [
        { id: 'high', label: 'High Priority', color: '#dc2626' },
        { id: 'medium', label: 'Medium Priority', color: '#d97706' },
        { id: 'low', label: 'Low Priority', color: '#2563eb' }
    ];

    async function handleSubmit() {
        if (!mounted) {
            error = 'Please wait for the form to initialize...';
            return;
        }

        if (!$user) {
            error = 'You must be logged in to create a goal.';
            return;
        }

        if (!goal.title) {
            error = 'Please enter a goal title';
            return;
        }

        loading = true;
        error = '';

        try {
            const { data, error: err } = await supabase
                .from('goals')
                .insert({
                    ...goal,
                    user_id: $user.id
                })
                .select()
                .single();

            if (err) throw err;

            dispatch('save', data);
            dispatch('close');
        } catch (err) {
            console.error('Error creating goal:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="modal-backdrop" on:click={() => dispatch('close')} transition:fade>
    <div class="modal" on:click|stopPropagation transition:fly="{{ y: 20, duration: 300 }}">
        <div class="modal-header">
            <h2>Create New Goal</h2>
            <button class="close-btn" on:click={() => dispatch('close')}>
                <i class="fas fa-times"></i>
            </button>
        </div>

        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="title">Goal Title</label>
                <input
                    type="text"
                    id="title"
                    bind:value={goal.title}
                    placeholder="What do you want to achieve?"
                    required
                />
            </div>

            <div class="form-group">
                <label for="description">Description</label>
                <textarea
                    id="description"
                    bind:value={goal.description}
                    placeholder="Add some details about your goal..."
                    rows="3"
                />
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Category</label>
                    <div class="toggle-group">
                        <button
                            type="button"
                            class:active={goal.category === 'personal'}
                            on:click={() => goal.category = 'personal'}
                        >
                            <i class="fas fa-user"></i>
                            Personal
                        </button>
                        <button
                            type="button"
                            class:active={goal.category === 'business'}
                            on:click={() => goal.category = 'business'}
                        >
                            <i class="fas fa-briefcase"></i>
                            Business
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Priority</label>
                    <div class="priority-options">
                        {#each priorities as priority}
                            <button
                                type="button"
                                class="priority-btn"
                                class:active={goal.priority === priority.id}
                                style="--priority-color: {priority.color}"
                                on:click={() => goal.priority = priority.id}
                            >
                                {priority.label}
                            </button>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>Goal Type</label>
                <div class="goal-types">
                    {#each goalTypes as type}
                        <button
                            type="button"
                            class="goal-type-btn"
                            class:active={goal.type === type.id}
                            on:click={() => goal.type = type.id}
                        >
                            <span class="icon">{type.icon}</span>
                            <span class="label">{type.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="target">Target Value</label>
                    <input
                        type="number"
                        id="target"
                        bind:value={goal.target_value}
                        placeholder="Set a target"
                    />
                </div>

                <div class="form-group">
                    <label for="target_date">Target Date</label>
                    <input
                        type="date"
                        id="target_date"
                        bind:value={goal.target_date}
                    />
                </div>
            </div>

            {#if error}
                <div class="error-message">
                    {error}
                </div>
            {/if}

            <div class="modal-footer">
                <button type="button" class="cancel-btn" on:click={() => dispatch('close')}>
                    Cancel
                </button>
                <button type="submit" class="submit-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Goal'}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 2rem;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
    }

    .close-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        font-size: 1.25rem;
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
        font-weight: 500;
        color: #475569;
        margin-bottom: 0.5rem;
    }

    input, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 1rem;
    }

    .toggle-group {
        display: flex;
        gap: 0.5rem;
    }

    .toggle-group button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
    }

    .toggle-group button.active {
        background: #4c1d95;
        color: white;
        border-color: #4c1d95;
    }

    .priority-options {
        display: flex;
        gap: 0.5rem;
    }

    .priority-btn {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 6px;
        background: color-mix(in srgb, var(--priority-color) 15%, transparent);
        color: var(--priority-color);
        cursor: pointer;
        transition: all 0.2s;
    }

    .priority-btn.active {
        background: var(--priority-color);
        color: white;
    }

    .goal-types {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
    }

    .goal-type-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
    }

    .goal-type-btn.active {
        background: #4c1d95;
        color: white;
        border-color: #4c1d95;
    }

    .goal-type-btn .icon {
        font-size: 1.5rem;
    }

    .goal-type-btn .label {
        font-size: 0.875rem;
        text-align: center;
    }

    .error-message {
        padding: 0.75rem;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 6px;
        margin-bottom: 1rem;
    }

    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
    }

    .cancel-btn, .submit-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .cancel-btn {
        background: #f1f5f9;
        color: #64748b;
        border: none;
    }

    .cancel-btn:hover {
        background: #e2e8f0;
    }

    .submit-btn {
        background: #4c1d95;
        color: white;
        border: none;
    }

    .submit-btn:hover {
        background: #6d28d9;
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>
