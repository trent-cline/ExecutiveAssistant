<script>
    export let percentage = 0;
    export let size = 120;
    export let strokeWidth = 10;

    $: radius = (size - strokeWidth) / 2;
    $: circumference = radius * 2 * Math.PI;
    $: offset = circumference - (percentage / 100) * circumference;
    $: strokeDasharray = `${circumference} ${circumference}`;
    $: viewBox = `0 0 ${size} ${size}`;
</script>

<div class="progress-ring" style="width: {size}px; height: {size}px;">
    <svg {viewBox}>
        <!-- Background circle -->
        <circle
            class="progress-ring__circle-bg"
            stroke="#e2e8f0"
            fill="transparent"
            r={radius}
            cx={size/2}
            cy={size/2}
            stroke-width={strokeWidth}
        />
        <!-- Progress circle -->
        <circle
            class="progress-ring__circle"
            stroke="#4c1d95"
            fill="transparent"
            r={radius}
            cx={size/2}
            cy={size/2}
            stroke-width={strokeWidth}
            style="stroke-dasharray: {strokeDasharray}; stroke-dashoffset: {offset};"
        />
        <!-- Percentage text -->
        <text
            x="50%"
            y="50%"
            text-anchor="middle"
            dominant-baseline="middle"
            class="progress-ring__text"
        >
            {Math.round(percentage)}%
        </text>
    </svg>
</div>

<style>
    .progress-ring {
        position: relative;
    }

    .progress-ring__circle {
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
        transition: stroke-dashoffset 0.35s;
    }

    .progress-ring__text {
        font-size: 1.5rem;
        font-weight: 600;
        fill: #4c1d95;
    }
</style>
