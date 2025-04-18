<script lang="ts">
    import BrainInboxTable from '../brain-inbox/BrainInboxTable.svelte';
    import GoalInsights from '../goals/GoalInsights.svelte';
    import { fade } from 'svelte/transition';
    import { supabase } from '$lib/supabase';
    import { onMount } from 'svelte';

    export let componentName: string | null = null;

    let loading = true;
    let error = '';
    let componentData: any = null;

    // Map of available components
    const components = {
        'brain-inbox': BrainInboxTable,
        'goals': GoalInsights
    };

    async function loadComponentData(name: string) {
        loading = true;
        error = '';
        try {
            switch (name) {
                case 'brain-inbox': {
                    const { data, error: err } = await supabase
                        .from('brain_dump_database')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (err) throw err;
                    componentData = { notes: data || [] };
                    break;
                }
                case 'goals': {
                    const { data, error: err } = await supabase
                        .from('goals')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (err) throw err;
                    componentData = { goals: data || [] };
                    break;
                }
                // Projects page has been removed, redirecting to company page
                case 'projects': {
                    const { data, error: err } = await supabase
                        .from('active_projects')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (err) throw err;
                    componentData = { projects: data || [] };
                    // Note: Projects are now shown on the company page
                    break;
                }
                case 'shopping': {
                    const { data, error: err } = await supabase
                        .from('shopping_list')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (err) throw err;
                    componentData = { items: data || [] };
                    break;
                }
                case 'dlltw': {
                    const { data, error: err } = await supabase
                        .from('dlltw_notes')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (err) throw err;
                    componentData = { notes: data || [] };
                    break;
                }
                case 'private-notes': {
                    const { data, error: err } = await supabase
                        .from('private_notes')
                        .select('*')
                        .order('created_at', { ascending: false });
                    
                    if (err) throw err;
                    componentData = { notes: data || [] };
                    break;
                }
                case 'company': {
                    const [fundingData, structureData] = await Promise.all([
                        supabase.from('funding_sources').select('*').order('created_at', { ascending: false }),
                        supabase.from('structure_nodes').select('*')
                    ]);
                    
                    if (fundingData.error) throw fundingData.error;
                    if (structureData.error) throw structureData.error;
                    
                    componentData = {
                        funding: fundingData.data || [],
                        structure: structureData.data || []
                    };
                    break;
                }
                default:
                    componentData = null;
            }
        } catch (err) {
            console.error('Error loading component data:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    }

    // Dynamic imports for other components
    async function loadComponent(name: string) {
        loading = true;
        try {
            switch (name) {
                // Projects page has been removed, redirecting to company page
                case 'projects': {
                    // Redirect to company dashboard instead since projects are now there
                    const module = await import('../company/CompanyDashboard.svelte');
                    return module.default;
                }
                case 'shopping': {
                    const module = await import('../shopping/ShoppingList.svelte');
                    return module.default;
                }
                case 'brain-inbox': {
                    const module = await import('../brain-inbox/BrainInboxTable.svelte');
                    return module.default;
                }
                case 'private-notes': {
                    const module = await import('../private-notes/PrivateNotes.svelte');
                    return module.default;
                }
                case 'dlltw': {
                    const module = await import('../dlltw/DLLTWNotes.svelte');
                    return module.default;
                }
                case 'company': {
                    const module = await import('../company/CompanyDashboard.svelte');
                    return module.default;
                }
                case 'goals': {
                    const module = await import('../goals/GoalInsights.svelte');
                    return module.default;
                }
                default:
                    throw new Error(`Unknown component: ${name}`);
            }
        } catch (err) {
            error = `Error loading component: ${err.message}`;
            return null;
        } finally {
            loading = false;
        }
    }

    $: if (componentName && !(componentName in components)) {
        loadComponent(componentName).then((component) => {
            if (component) {
                components[componentName] = component;
            }
        });
    }

    $: if (componentName) {
        loadComponentData(componentName);
    }
</script>

{#if loading}
    <div class="flex items-center justify-center h-full" transition:fade>
        <div class="text-lg text-gray-600">Loading {componentName}...</div>
    </div>
{:else if error}
    <div class="flex items-center justify-center h-full text-red-600" transition:fade>
        <div class="text-lg">Error: {error}</div>
    </div>
{:else if componentName && componentName in components}
    <div transition:fade>
        <svelte:component 
            this={components[componentName]} 
            {...componentData} 
        />
    </div>
{:else}
    <div class="flex flex-col items-center justify-center h-full text-center" transition:fade>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Voice Navigation</h1>
        <p class="text-lg text-gray-600">Tell me what component you'd like to see</p>
        <div class="mt-8 text-left">
            <p class="text-gray-600 mb-2">Available components:</p>
            <ul class="list-disc list-inside space-y-1">
                <li>Brain Inbox</li>
                <li>Goals</li>
                <li>Shopping List</li>
                <li>DLLTW Notes</li>
                <li>Private Notes</li>
                <li>Company Dashboard</li>
            </ul>
        </div>
    </div>
{/if}

<style>
    .flex {
        display: flex;
    }
    .flex-col {
        flex-direction: column;
    }
    .items-center {
        align-items: center;
    }
    .justify-center {
        justify-content: center;
    }
    .h-full {
        height: 100%;
    }
    .text-center {
        text-align: center;
    }
    .text-left {
        text-align: left;
    }
    .text-lg {
        font-size: 1.125rem;
        line-height: 1.75rem;
    }
    .text-4xl {
        font-size: 2.25rem;
        line-height: 2.5rem;
    }
    .font-bold {
        font-weight: 700;
    }
    .text-gray-600 {
        color: rgb(75 85 99);
    }
    .text-gray-900 {
        color: rgb(17 24 39);
    }
    .text-red-600 {
        color: rgb(220 38 38);
    }
    .mb-4 {
        margin-bottom: 1rem;
    }
    .mb-2 {
        margin-bottom: 0.5rem;
    }
    .mt-8 {
        margin-top: 2rem;
    }
    .list-disc {
        list-style-type: disc;
    }
    .list-inside {
        list-style-position: inside;
    }
    .space-y-1 > * + * {
        margin-top: 0.25rem;
    }
</style>
