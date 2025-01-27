<script>
    export let goals = [];

    $: timelineItems = goals.map(goal => ({
        ...goal,
        date: goal.deadline || goal.created_at,
        type: goal.deadline ? 'deadline' : 'created'
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    function formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
</script>

<div class="timeline">
    {#each timelineItems as item, i}
        <div class="timeline-item" class:future={new Date(item.date) > new Date()}>
            <div class="timeline-marker">
                {#if item.type === 'deadline'}
                    <i class="fas fa-flag"></i>
                {:else}
                    <i class="fas fa-star"></i>
                {/if}
            </div>
            <div class="timeline-content">
                <div class="timeline-date">
                    {formatDate(item.date)}
                </div>
                <div class="timeline-card">
                    <div class="card-header">
                        <span class="category">
                            <i class="fas {item.category === 'personal' ? 'fa-user' : 'fa-briefcase'}"></i>
                            {item.category}
                        </span>
                        <span class="type">
                            {item.type === 'deadline' ? 'Deadline' : 'Started'}
                        </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {#if item.target_value}
                        <div class="progress">
                            <div class="progress-bar" style="width: {(item.current_value / item.target_value) * 100}%"></div>
                            <span class="progress-text">
                                {item.current_value} / {item.target_value}
                            </span>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .timeline {
        position: relative;
        padding: 2rem 0;
    }

    .timeline::before {
        content: '';
        position: absolute;
        top: 0;
        left: 120px;
        height: 100%;
        width: 2px;
        background: #e2e8f0;
    }

    .timeline-item {
        display: flex;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .timeline-marker {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        background: white;
        border: 2px solid #4c1d95;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #4c1d95;
        margin-left: 100px;
        z-index: 1;
    }

    .timeline-content {
        flex-grow: 1;
        padding-top: 0.5rem;
    }

    .timeline-date {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 0.5rem;
    }

    .timeline-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .category {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
        text-transform: capitalize;
    }

    .type {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        background: #f1f5f9;
        color: #475569;
    }

    h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
    }

    p {
        font-size: 0.875rem;
        color: #64748b;
        margin-bottom: 1rem;
    }

    .progress {
        position: relative;
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: #4c1d95;
        transition: width 0.3s ease;
    }

    .progress-text {
        position: absolute;
        right: 0;
        top: -1.5rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
    }

    .future .timeline-marker {
        border-color: #94a3b8;
        color: #94a3b8;
    }

    .future .timeline-card {
        opacity: 0.8;
    }

    @media (max-width: 640px) {
        .timeline::before {
            left: 20px;
        }

        .timeline-marker {
            margin-left: 0;
        }

        .timeline-date {
            margin-left: 60px;
        }
    }
</style>
