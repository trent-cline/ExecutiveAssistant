<script lang="ts">
    export let padding = 'p-6';
    export let className = '';
    export let hover = false;
    export let fullWidth = false;
    export let fullHeight = false;
</script>

<div class="bg-white rounded-xl shadow-lg {padding} {className} {hover ? 'transition-all duration-200 hover:shadow-xl hover:-translate-y-1' : ''} {fullWidth ? 'w-full' : ''} {fullHeight ? 'h-full' : ''}">
    <slot />
</div>
