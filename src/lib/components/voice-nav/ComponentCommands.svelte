<script lang="ts">
    import { fade } from 'svelte/transition';
    import { componentCommands } from '$lib/stores/componentCommands';
</script>

{#if $componentCommands}
    <div class="command-group mt-8" transition:fade>
        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
            {$componentCommands.title}
        </h3>
        <ul class="space-y-2">
            {#each $componentCommands.commands as command}
                <li class="flex items-center text-gray-700">
                    <i class="fas {command.icon} {command.iconColor} w-5 mr-2"></i>
                    "{command.command}"
                    <span class="text-sm text-gray-500 ml-2">- {command.description}</span>
                </li>
            {/each}
        </ul>
    </div>
{/if}

<style>
    .command-group {
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
