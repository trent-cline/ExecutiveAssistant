<script lang="ts">
    import { activeCommands, type VoiceCommand } from '$lib/stores/voiceCommands';
    import { fade } from 'svelte/transition';

    $: navigationCommands = $activeCommands.filter(cmd => cmd.route);
    $: componentCommands = $activeCommands.filter(cmd => !cmd.route);
</script>

<div class="space-y-8">
    <div class="command-group">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Navigation Commands</h3>
        <div class="grid grid-cols-1 gap-4">
            {#each navigationCommands as command (command.command)}
            <div 
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                transition:fade
            >
                <div>
                    <p class="font-medium text-gray-900">{command.command}</p>
                    <p class="text-sm text-gray-500">{command.description}</p>
                </div>
                {#if command.route}
                    <a 
                        href={command.route}
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Go to page
                        <i class="fas fa-arrow-right ml-1"></i>
                    </a>
                {/if}
            </div>
            {/each}
        </div>
    </div>

    {#if componentCommands.length > 0}
        <div class="command-group">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Component Commands</h3>
            <div class="grid grid-cols-1 gap-4">
                {#each componentCommands as command (command.command)}
                <div 
                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    transition:fade
                >
                    <div>
                        <p class="font-medium text-gray-900">{command.command}</p>
                        <p class="text-sm text-gray-500">{command.description}</p>
                    </div>
                </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .command-group :global(.command-item) {
        transition: all 0.2s ease-in-out;
    }
    
    .command-group :global(.command-item:hover) {
        transform: translateX(4px);
    }
</style>
