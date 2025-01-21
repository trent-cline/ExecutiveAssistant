<script>
    import { createEventDispatcher } from 'svelte';
    import ProgressRing from './ProgressRing.svelte';

    export let goal;
    
    const dispatch = createEventDispatcher();
    
    $: progress = goal.target_value 
        ? (goal.current_value / goal.target_value) * 100 
        : 0;
    
    $: daysLeft = goal.target_date 
        ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null;
        
    $: statusColor = {
        'active': 'emerald',
        'completed': 'blue',
        'archived': 'gray'
    }[goal.status] || 'gray';
    
    $: priorityColor = {
        'high': 'red',
        'medium': 'yellow',
        'low': 'blue'
    }[goal.priority] || 'gray';
</script>

<div class="goal-card" class:completed={goal.status === 'completed'}>
    <div class="goal-header">
        <div class="goal-category">
            <i class="fas {goal.category === 'personal' ? 'fa-user' : 'fa-briefcase'}"></i>
            {goal.category}
        </div>
        <div class="goal-priority" style="--priority-color: var(--{priorityColor}-500)">
            {goal.priority}
        </div>
    </div>

    <h3>{goal.title}</h3>
    <p class="description">{goal.description}</p>

    <div class="goal-progress">
        <ProgressRing percentage={progress} size={60} strokeWidth={6} />
        <div class="progress-info">
            <span class="current">{goal.current_value || 0}</span>
            <span class="separator">/</span>
            <span class="target">{goal.target_value}</span>
        </div>
    </div>

    {#if daysLeft !== null}
        <div class="deadline" class:urgent={daysLeft <= 7}>
            <i class="fas fa-clock"></i>
            {daysLeft} days left
        </div>
    {/if}

    <div class="goal-footer">
        <div class="status" style="--status-color: var(--{statusColor}-500)">
            {goal.status}
        </div>
        
        <div class="actions">
            {#if goal.status !== 'completed'}
                <button 
                    class="action-btn update"
                    on:click={() => dispatch('update', goal)}
                >
                    <i class="fas fa-pen"></i>
                </button>
                <button 
                    class="action-btn complete"
                    on:click={() => dispatch('complete', goal)}
                >
                    <i class="fas fa-check"></i>
                </button>
            {/if}
        </div>
    </div>

    {#if goal.streak_count > 0}
        <div class="streak">
            <i class="fas fa-fire"></i>
            {goal.streak_count} day streak!
        </div>
    {/if}
</div>

<style>
    .goal-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .goal-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
    }

    .goal-card.completed {
        background: #f8fafc;
    }

    .goal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .goal-category {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
        text-transform: capitalize;
    }

    .goal-priority {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        background: color-mix(in srgb, var(--priority-color) 15%, transparent);
        color: var(--priority-color);
    }

    h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
    }

    .description {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .goal-progress {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .progress-info {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        font-weight: 600;
    }

    .current {
        font-size: 1.25rem;
        color: #4c1d95;
    }

    .separator, .target {
        color: #94a3b8;
    }

    .deadline {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 1rem;
    }

    .deadline.urgent {
        color: #dc2626;
    }

    .goal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .status {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--status-color);
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .action-btn.update {
        background: #f1f5f9;
        color: #64748b;
    }

    .action-btn.update:hover {
        background: #e2e8f0;
    }

    .action-btn.complete {
        background: #4c1d95;
        color: white;
    }

    .action-btn.complete:hover {
        background: #6d28d9;
    }

    .streak {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #dc2626;
    }
</style>
