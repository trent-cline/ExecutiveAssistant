# Goals Page Content
<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { user } from '$lib/auth';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import ProgressRing from './ProgressRing.svelte';
    import GoalCard from './GoalCard.svelte';
    import NewGoalModal from './NewGoalModal.svelte';
    import StepByStepGoalForm from './StepByStepGoalForm.svelte';
    import VisualGoalForm from './VisualGoalForm.svelte';
    import GoalTimeline from './GoalTimeline.svelte';
    import GoalInsights from './GoalInsights.svelte';

    let loading = true;
    let error = '';
    let goals = [];
    let showNewGoalModal = false;
    let showStepForm = false;
    let showVisualForm = false;
    let selectedCategory = 'all';
    let selectedView = 'grid';
    let searchQuery = '';
    let achievements = [];
    let streakCount = 0;
    let completionRate = 0;
    let showConfetti = false;

    // Goal categories with icons
    const categories = [
        { id: 'all', label: 'All Goals', icon: 'fa-globe' },
        { id: 'personal', label: 'Personal', icon: 'fa-user' },
        { id: 'business', label: 'Business', icon: 'fa-briefcase' },
        { id: 'completed', label: 'Completed', icon: 'fa-check-circle' }
    ];

    // View options
    const viewOptions = [
        { id: 'grid', label: 'Grid View', icon: 'fa-th-large' },
        { id: 'timeline', label: 'Timeline', icon: 'fa-stream' },
        { id: 'insights', label: 'Insights', icon: 'fa-chart-line' }
    ];

    onMount(async () => {
        if (!$user) {
            goto('/login');
            return;
        }
        await loadGoals();
        await loadAchievements();
        calculateStats();
    });

    async function loadGoals() {
        try {
            const { data, error: err } = await supabase
                .from('goals')
                .select(`
                    *,
                    goal_progress (
                        value,
                        recorded_at
                    ),
                    goal_rewards (
                        title,
                        description,
                        unlocked_at,
                        claimed_at,
                        required_progress
                    )
                `)
                .order('created_at', { ascending: false });

            if (err) throw err;
            goals = data;
            loading = false;
        } catch (err) {
            console.error('Error loading goals:', err);
            error = err.message;
            loading = false;
        }
    }

    async function loadAchievements() {
        // Load user achievements and badges
        achievements = [
            { title: 'Goal Setter', description: 'Created first goal', icon: '🎯' },
            { title: 'Streak Master', description: '7-day streak', icon: '🔥' },
            { title: 'Business Pro', description: 'Completed 5 business goals', icon: '💼' }
        ];
    }

    function calculateStats() {
        // Calculate completion rate and streaks
        const completedGoals = goals.filter(g => g.status === 'completed');
        completionRate = goals.length ? (completedGoals.length / goals.length) * 100 : 0;
        streakCount = calculateCurrentStreak();
    }

    function calculateCurrentStreak() {
        // Calculate current streak based on daily goal completions
        return 5; // Placeholder
    }

    function getFilteredGoals() {
        let filtered = [...goals];
        
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(g => 
                selectedCategory === 'completed' 
                    ? g.status === 'completed'
                    : g.category === selectedCategory && g.status !== 'completed'
            );
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(g =>
                g.title.toLowerCase().includes(query) ||
                g.description.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    async function handleGoalComplete(goal) {
        // Update goal status and show celebration
        const { error: err } = await supabase
            .from('goals')
            .update({ status: 'completed' })
            .eq('id', goal.id);

        if (!err) {
            showConfetti = true;
            setTimeout(() => showConfetti = false, 3000);
            await loadGoals();
        }
    }
</script>

<div class="goals-page">
    <!-- Header Section -->
    <header class="header" in:fly="{{ y: -20, duration: 400, delay: 200 }}">
        <div class="header-content">
            <h1>Goals & Achievements</h1>
            <div class="header-actions">
                <div class="add-goal-buttons">
                    <button class="add-btn classic" on:click={() => showNewGoalModal = true}>
                        <i class="fas fa-plus"></i>
                        Quick Add
                    </button>
                    <button class="add-btn step" on:click={() => showStepForm = true}>
                        <i class="fas fa-list-ol"></i>
                        Step by Step
                    </button>
                    <button class="add-btn visual" on:click={() => showVisualForm = true}>
                        <i class="fas fa-th-large"></i>
                        Visual Builder
                    </button>
                </div>
                <div class="view-options">
                    {#each viewOptions as option}
                        <button
                            class="view-btn"
                            class:active={selectedView === option.id}
                            on:click={() => selectedView = option.id}
                        >
                            <i class="fas {option.icon}"></i>
                            <span class="view-label">{option.label}</span>
                        </button>
                    {/each}
                </div>
            </div>
        </div>
        
        <!-- Stats Overview -->
        <div class="stats-overview">
            <div class="stat-card">
                <ProgressRing 
                    percentage={completionRate} 
                    size={80} 
                    strokeWidth={8} 
                />
                <div class="stat-info">
                    <h3>Completion Rate</h3>
                    <p>{completionRate.toFixed(1)}%</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="streak-counter">
                    <i class="fas fa-fire"></i>
                    <span>{streakCount}</span>
                </div>
                <div class="stat-info">
                    <h3>Current Streak</h3>
                    <p>{streakCount} days</p>
                </div>
            </div>
            
            <div class="stat-card achievements-preview">
                <div class="achievement-icons">
                    {#each achievements.slice(0, 3) as achievement}
                        <span class="achievement-icon" title={achievement.title}>
                            {achievement.icon}
                        </span>
                    {/each}
                </div>
                <div class="stat-info">
                    <h3>Achievements</h3>
                    <p>{achievements.length} unlocked</p>
                </div>
            </div>
        </div>
    </header>

    <!-- Filters and View Options -->
    <div class="controls" in:fly="{{ y: -20, duration: 400, delay: 400 }}">
        <div class="categories">
            {#each categories as category}
                <button
                    class="category-btn"
                    class:active={selectedCategory === category.id}
                    on:click={() => selectedCategory = category.id}
                >
                    <i class="fas {category.icon}"></i>
                    {category.label}
                </button>
            {/each}
        </div>

        <div class="view-controls">
            <input
                type="text"
                placeholder="Search goals..."
                bind:value={searchQuery}
                class="search-input"
            />
            
            <div class="view-options">
                {#each viewOptions as view}
                    <button
                        class="view-btn"
                        class:active={selectedView === view.id}
                        on:click={() => selectedView = view.id}
                    >
                        <i class="fas {view.icon}"></i>
                    </button>
                {/each}
            </div>
        </div>
    </div>

    <!-- Goal Forms -->
    {#if showNewGoalModal}
        <NewGoalModal
            on:close={() => showNewGoalModal = false}
            on:save={async () => {
                await loadGoals();
                showNewGoalModal = false;
                calculateStats();
            }}
        />
    {/if}

    <StepByStepGoalForm
        bind:show={showStepForm}
        on:goalCreated={async () => {
            await loadGoals();
            calculateStats();
        }}
    />

    <VisualGoalForm
        bind:show={showVisualForm}
        on:goalCreated={async () => {
            await loadGoals();
            calculateStats();
        }}
    />

    <!-- Main Content -->
    <main class="main-content" in:fly="{{ y: 20, duration: 400, delay: 600 }}">
        {#if loading}
            <div class="loading">Loading your goals...</div>
        {:else if error}
            <div class="error">{error}</div>
        {:else}
            {#if selectedView === 'grid'}
                <div class="goals-grid">
                    {#each getFilteredGoals() as goal (goal.id)}
                        <GoalCard
                            {goal}
                            on:complete={handleGoalComplete}
                        />
                    {/each}
                </div>
            {:else if selectedView === 'timeline'}
                <GoalTimeline goals={getFilteredGoals()} />
            {:else}
                <GoalInsights goals={getFilteredGoals()} />
            {/if}
        {/if}
    </main>

    <!-- Celebration Confetti -->
    {#if showConfetti}
        <div class="confetti-container" transition:fade>
            <!-- Add confetti animation here -->
        </div>
    {/if}
</div>

<style>
    .goals-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        margin-bottom: 2rem;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0;
    }

    .header-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-top: 1rem;
    }

    .add-goal-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .add-btn.classic {
        background: #3b82f6;
        color: white;
    }

    .add-btn.classic:hover {
        background: #2563eb;
    }

    .add-btn.step {
        background: #4c1d95;
        color: white;
    }

    .add-btn.step:hover {
        background: #6b21a8;
    }

    .add-btn.visual {
        background: #059669;
        color: white;
    }

    .add-btn.visual:hover {
        background: #047857;
    }

    .stats-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 2rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .streak-counter {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        background: #fef2f2;
        border-radius: 50%;
        color: #dc2626;
        font-size: 1.5rem;
        font-weight: 700;
    }

    .achievements-preview .achievement-icons {
        display: flex;
        gap: 0.5rem;
    }

    .achievement-icon {
        font-size: 2rem;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .categories {
        display: flex;
        gap: 0.5rem;
    }

    .category-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        color: #4a5568;
        cursor: pointer;
        transition: all 0.2s;
    }

    .category-btn.active {
        background: #4c1d95;
        color: white;
        border-color: #4c1d95;
    }

    .view-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .search-input {
        padding: 0.5rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        width: 250px;
    }

    .view-options {
        display: flex;
        gap: 0.5rem;
    }

    .view-btn {
        padding: 0.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        color: #4a5568;
        cursor: pointer;
        transition: all 0.2s;
    }

    .view-btn.active {
        background: #4c1d95;
        color: white;
        border-color: #4c1d95;
    }

    .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .confetti-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
    }

    @media (max-width: 768px) {
        .goals-page {
            padding: 1rem;
        }

        .controls {
            flex-direction: column;
            align-items: stretch;
        }

        .view-controls {
            flex-direction: column;
        }

        .search-input {
            width: 100%;
        }
    }

    @media (max-width: 640px) {
        .header-actions {
            flex-direction: column;
            align-items: stretch;
        }

        .add-goal-buttons {
            flex-direction: column;
        }

        .view-label {
            display: none;
        }
    }
</style>
