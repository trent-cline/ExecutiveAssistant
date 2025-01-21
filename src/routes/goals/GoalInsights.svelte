<script>
    import { onMount } from 'svelte';
    export let goals = [];

    let canvas;
    let ctx;
    let completionChart;
    let categoryChart;

    $: completionStats = calculateCompletionStats(goals);
    $: categoryStats = calculateCategoryStats(goals);
    $: streakStats = calculateStreakStats(goals);

    function calculateCompletionStats(goals) {
        const total = goals.length;
        const completed = goals.filter(g => g.status === 'completed').length;
        const active = goals.filter(g => g.status === 'active').length;
        const archived = goals.filter(g => g.status === 'archived').length;

        return {
            total,
            completed,
            active,
            archived,
            completionRate: total ? (completed / total) * 100 : 0
        };
    }

    function calculateCategoryStats(goals) {
        const categories = {
            personal: goals.filter(g => g.category === 'personal').length,
            business: goals.filter(g => g.category === 'business').length
        };

        return {
            ...categories,
            total: goals.length,
            personalRate: goals.length ? (categories.personal / goals.length) * 100 : 0,
            businessRate: goals.length ? (categories.business / goals.length) * 100 : 0
        };
    }

    function calculateStreakStats(goals) {
        const activeStreaks = goals.filter(g => g.streak_count > 0);
        const longestStreak = Math.max(...goals.map(g => g.streak_count), 0);
        const averageStreak = activeStreaks.length
            ? activeStreaks.reduce((acc, g) => acc + g.streak_count, 0) / activeStreaks.length
            : 0;

        return {
            activeStreaks: activeStreaks.length,
            longestStreak,
            averageStreak: Math.round(averageStreak)
        };
    }

    onMount(() => {
        // Initialize charts here if using a charting library
    });
</script>

<div class="insights">
    <div class="stats-grid">
        <!-- Completion Stats -->
        <div class="stat-card">
            <h3>Goal Completion</h3>
            <div class="stat-content">
                <div class="stat-circle" style="--percentage: {completionStats.completionRate}">
                    <span class="stat-value">{completionStats.completionRate.toFixed(1)}%</span>
                    <span class="stat-label">Complete</span>
                </div>
                <div class="stat-details">
                    <div class="stat-item">
                        <span class="label">Active</span>
                        <span class="value">{completionStats.active}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Completed</span>
                        <span class="value">{completionStats.completed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="label">Archived</span>
                        <span class="value">{completionStats.archived}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Category Distribution -->
        <div class="stat-card">
            <h3>Goal Categories</h3>
            <div class="stat-content">
                <div class="category-bars">
                    <div class="category-bar">
                        <div class="bar-label">
                            <i class="fas fa-user"></i>
                            Personal
                        </div>
                        <div class="bar-container">
                            <div class="bar" style="width: {categoryStats.personalRate}%"></div>
                            <span class="bar-value">{categoryStats.personal}</span>
                        </div>
                    </div>
                    <div class="category-bar">
                        <div class="bar-label">
                            <i class="fas fa-briefcase"></i>
                            Business
                        </div>
                        <div class="bar-container">
                            <div class="bar" style="width: {categoryStats.businessRate}%"></div>
                            <span class="bar-value">{categoryStats.business}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Streak Stats -->
        <div class="stat-card">
            <h3>Goal Streaks</h3>
            <div class="stat-content">
                <div class="streak-stats">
                    <div class="streak-stat">
                        <div class="streak-icon">🔥</div>
                        <div class="streak-info">
                            <span class="value">{streakStats.longestStreak}</span>
                            <span class="label">Longest Streak</span>
                        </div>
                    </div>
                    <div class="streak-stat">
                        <div class="streak-icon">⚡</div>
                        <div class="streak-info">
                            <span class="value">{streakStats.activeStreaks}</span>
                            <span class="label">Active Streaks</span>
                        </div>
                    </div>
                    <div class="streak-stat">
                        <div class="streak-icon">📊</div>
                        <div class="streak-info">
                            <span class="value">{streakStats.averageStreak}</span>
                            <span class="label">Avg. Streak</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .insights {
        padding: 1rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1.5rem 0;
    }

    .stat-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .stat-circle {
        position: relative;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: conic-gradient(
            #4c1d95 calc(var(--percentage) * 1%),
            #e2e8f0 calc(var(--percentage) * 1%)
        );
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #64748b;
    }

    .stat-details {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        text-align: center;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .stat-item .label {
        font-size: 0.875rem;
        color: #64748b;
    }

    .stat-item .value {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
    }

    .category-bars {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .category-bar {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .bar-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #64748b;
    }

    .bar-container {
        position: relative;
        height: 8px;
        background: #f1f5f9;
        border-radius: 4px;
        overflow: hidden;
    }

    .bar {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: #4c1d95;
        transition: width 0.3s ease;
    }

    .bar-value {
        position: absolute;
        right: 0;
        top: -1.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #64748b;
    }

    .streak-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }

    .streak-stat {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .streak-icon {
        font-size: 2rem;
    }

    .streak-info {
        display: flex;
        flex-direction: column;
    }

    .streak-info .value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
    }

    .streak-info .label {
        font-size: 0.75rem;
        color: #64748b;
    }

    @media (max-width: 768px) {
        .streak-stats {
            grid-template-columns: 1fr;
        }
    }
</style>
