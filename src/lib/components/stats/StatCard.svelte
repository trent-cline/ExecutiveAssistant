<script lang="ts">
    import Card from '../containers/Card.svelte';
    export let title: string;
    export let value: string | number;
    export let subtitle: string = '';
    export let icon: string = '';
    export let color: 'indigo' | 'emerald' | 'amber' | 'rose' = 'indigo';

    const colorClasses = {
        indigo: 'text-indigo-600',
        emerald: 'text-emerald-600',
        amber: 'text-amber-600',
        rose: 'text-rose-600'
    };
</script>

<Card hover={true}>
    <div class="flex items-start justify-between">
        <div>
            <h3 class="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
            <p class="text-3xl font-bold {colorClasses[color]}">{value}</p>
            {#if subtitle}
                <p class="text-sm text-gray-500 mt-1">{subtitle}</p>
            {/if}
        </div>
        {#if icon}
            <div class="p-3 rounded-full {color === 'indigo' ? 'bg-indigo-100' : color === 'emerald' ? 'bg-emerald-100' : color === 'amber' ? 'bg-amber-100' : 'bg-rose-100'}">
                <i class="{icon} text-xl {colorClasses[color]}" aria-hidden="true"></i>
            </div>
        {/if}
    </div>
</Card>
