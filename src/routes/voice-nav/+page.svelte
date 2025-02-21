<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';
    import AuthGuard from '$lib/components/AuthGuard.svelte';
    import { fade } from 'svelte/transition';
    import { componentCommands, commandSets } from '$lib/stores/componentCommands';
    import ComponentCommands from '$lib/components/voice-nav/ComponentCommands.svelte';
    import DynamicComponentLoader from '$lib/components/voice-nav/DynamicComponentLoader.svelte';
    import BrainInboxTable from '$lib/components/brain-inbox/BrainInboxTable.svelte';
    import '$lib/types/speech';

    let isListening = false;
    let status = '';
    let recognition: any = null;
    let transcript = '';
    let activeComponent: string | null = null;

    // Map of voice commands to components
    const commandMap = {
        'projects': { component: 'projects' },
        'goals': { component: 'goals' },
        'shopping': { component: 'shopping' },
        'brain': { component: 'brain-inbox' },
        'notes': { component: 'brain-inbox' },
        'private': { component: 'private-notes' },
        'dlltw': { component: 'dlltw' },
        'company': { component: 'company' }
    };

    let isBrowserSupported = false;

    onMount(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            isBrowserSupported = true;
            try {
                recognition = new window.webkitSpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;

                recognition.onstart = () => {
                    isListening = true;
                    status = 'Listening...';
                };

                recognition.onresult = (event: any) => {
                    transcript = Array.from(event.results)
                        .map((result: any) => result[0].transcript)
                        .join('');
                    
                    const command = transcript.toLowerCase().trim();
                    
                    Object.entries(commandMap).forEach(([key, value]) => {
                        if (command.includes(key)) {
                            if ($user || value.component === 'brain-inbox') {
                                activeComponent = value.component;
                                componentCommands.set(commandSets[value.component]);
                            } else {
                                status = 'Please log in to access this feature';
                                stopListening();
                            }
                        }
                    });

                    // Handle component-specific commands
                    if (activeComponent && commandSets[activeComponent]) {
                        const componentCmds = commandSets[activeComponent].commands;
                        for (const cmd of componentCmds) {
                            if (command.includes(cmd.command.toLowerCase())) {
                                // Handle component-specific actions here
                                console.log('Executing command:', cmd.command);
                                break;
                            }
                        }
                    }
                };

                recognition.onend = () => {
                    isListening = false;
                    status = '';
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    status = `Error: ${event.error}`;
                    isListening = false;
                };

            } catch (error) {
                console.error('Error initializing speech recognition:', error);
                status = 'Error initializing speech recognition';
                isBrowserSupported = false;
            }
        } else {
            status = 'Speech recognition not supported in this browser.';
            isBrowserSupported = false;
        }
    });

    function startListening() {
        if (recognition && isBrowserSupported) {
            try {
                recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                status = 'Error starting recognition';
            }
        }
    }

    function stopListening() {
        if (recognition && isBrowserSupported) {
            try {
                recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
                status = 'Error stopping recognition';
            }
        }
    }
</script>

<AuthGuard>
    <div class="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow-lg p-8 h-[calc(100vh-10rem)]">
                    {#if activeComponent === 'brain-inbox'}
                        <BrainInboxTable hideCompleted={true} />
                    {:else}
                        <DynamicComponentLoader componentName={activeComponent} />
                    {/if}
                </div>
            </div>

            <div class="space-y-8">
                <!-- Voice Control Panel -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <div class="text-center mb-8">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">Voice Navigation</h2>
                        <p class="text-gray-600 mb-6">Tell me what component you'd like to see</p>
                        
                        {#if isBrowserSupported}
                            <button 
                                class="btn btn-primary text-lg py-4 px-8 rounded-full w-full relative overflow-hidden {isListening ? 'bg-red-600 hover:bg-red-700' : ''}"
                                class:listening={isListening}
                                on:click={() => isListening ? stopListening() : startListening()}
                                disabled={!isBrowserSupported}
                            >
                                <span class="relative z-10 flex items-center justify-center">
                                    {#if isListening}
                                        <i class="fas fa-microphone text-xl mr-2"></i>
                                        Stop Listening
                                    {:else}
                                        <i class="fas fa-microphone-alt text-xl mr-2"></i>
                                        Start Listening
                                    {/if}
                                </span>
                            </button>
                        {/if}

                        {#if transcript}
                            <div class="mt-4 text-gray-600">"{transcript}"</div>
                        {/if}
                    </div>
                </div>

                <!-- Available Commands -->
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-6">Available Commands</h2>
                    
                    <div class="space-y-8">
                        <div class="command-group">
                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                                Notes & Tasks
                            </h3>
                            <ul class="space-y-2">
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-brain text-blue-500 w-5 mr-2"></i>
                                    "Show me brain inbox"
                                </li>
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-lock text-blue-500 w-5 mr-2"></i>
                                    "Show private notes"
                                    {#if !$user}<span class="ml-2 text-red-500">*</span>{/if}
                                </li>
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-book text-blue-500 w-5 mr-2"></i>
                                    "Show DLLTW notes"
                                    {#if !$user}<span class="ml-2 text-red-500">*</span>{/if}
                                </li>
                            </ul>
                        </div>

                        <div class="command-group">
                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                                Planning
                            </h3>
                            <ul class="space-y-2">
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-project-diagram text-green-500 w-5 mr-2"></i>
                                    "Show me projects"
                                    {#if !$user}<span class="ml-2 text-red-500">*</span>{/if}
                                </li>
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-bullseye text-green-500 w-5 mr-2"></i>
                                    "Show me goals"
                                    {#if !$user}<span class="ml-2 text-red-500">*</span>{/if}
                                </li>
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-shopping-cart text-green-500 w-5 mr-2"></i>
                                    "Show shopping list"
                                    {#if !$user}<span class="ml-2 text-red-500">*</span>{/if}
                                </li>
                            </ul>
                        </div>

                        <div class="command-group">
                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-3">
                                Company
                            </h3>
                            <ul class="space-y-2">
                                <li class="flex items-center text-gray-700">
                                    <i class="fas fa-sitemap text-purple-500 w-5 mr-2"></i>
                                    "Show company dashboard"
                                    {#if !$user}<span class="ml-2 text-red-500">*</span>{/if}
                                </li>
                            </ul>
                        </div>

                        {#if !$user}
                            <div class="mt-6 pt-4 border-t border-gray-200">
                                <p class="text-sm text-gray-500 flex items-center">
                                    <i class="fas fa-lock text-red-500 mr-2"></i>
                                    <span class="text-red-500">*</span> Requires login
                                </p>
                            </div>
                        {/if}

                        <!-- Component-specific commands -->
                        <ComponentCommands />
                    </div>
                </div>
            </div>
        </div>
    </div>
</AuthGuard>

<style>
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }

    .listening {
        animation: pulse 1.5s infinite;
    }

    :global(.fa-microphone),
    :global(.fa-microphone-alt) {
        display: inline-block !important;
    }
</style>
