<script lang="ts">
    import StructureChart from '$lib/components/structure/StructureChart.svelte';
    import CreateNodeModal from '$lib/components/structure/CreateNodeModal.svelte';
    import EditNodeModal from '$lib/components/structure/EditNodeModal.svelte';
    import type { StructureNode, ChartLine } from '$lib/types/structure';
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import Card from '$lib/components/containers/Card.svelte';

    let structureNodes: StructureNode[] = [];
    let structureLines: ChartLine[] = [];
    let loading = false;
    let error: Error | null = null;
    let showCreateModal = false;
    let showEditModal = false;
    let selectedNode: StructureNode | null = null;
    let structureChart: any; // Reference to the chart component

    async function loadStructureData() {
        try {
            loading = true;
            error = null;

            // Load nodes
            const { data: nodes, error: nodesError } = await supabase
                .from('structure_nodes')
                .select('*')
                .eq('user_id', 'public');

            if (nodesError) throw nodesError;
            structureNodes = nodes || [];

            // Load lines
            const { data: lines, error: linesError } = await supabase
                .from('structure_lines')
                .select('*');

            if (linesError) throw linesError;
            structureLines = lines.map(line => ({
                ...line,
                isSelected: false
            }));

        } catch (e) {
            console.error('Error loading structure data:', e);
            error = e instanceof Error ? e : new Error('Failed to load structure data');
        } finally {
            loading = false;
        }
    }

    async function handleCreateNode(event: CustomEvent<Partial<StructureNode>>) {
        const newNode = event.detail;
        try {
            // Generate a new ID that doesn't conflict with existing ones
            const maxId = Math.max(...structureNodes.map(n => parseInt(n.id) || 0), 0);
            const id = (maxId + 1).toString();
            
            const nodeData = {
                id,
                user_id: 'public',
                name: newNode.name,
                type: newNode.type,
                description: newNode.description || '',
                connections: newNode.connections || [],
                platform: newNode.platform || null,
                ownership: newNode.ownership || null,
                monthly_revenue: newNode.monthlyRevenue || null
            };

            const { data, error: err } = await supabase
                .from('structure_nodes')
                .insert([nodeData])
                .select()
                .single();

            if (err) throw err;

            // Only update the list if the insert was successful
            if (data) {
                structureNodes = [...structureNodes, data];
                showCreateModal = false;
            }
        } catch (e) {
            console.error('Error creating node:', e);
            alert('Failed to create node. Please try again.');
        }
    }

    async function handleEditNode(event: CustomEvent<Partial<StructureNode>>) {
        const updatedNode = event.detail;
        try {
            const { data, error: err } = await supabase
                .from('structure_nodes')
                .update({
                    name: updatedNode.name,
                    type: updatedNode.type,
                    description: updatedNode.description,
                    connections: updatedNode.connections,
                    platform: updatedNode.platform,
                    ownership: updatedNode.ownership,
                    monthly_revenue: updatedNode.monthlyRevenue
                })
                .eq('id', updatedNode.id)
                .select()
                .single();

            if (err) throw err;

            // Update local state with the database response
            if (data) {
                // Create a new array to force reactivity
                structureNodes = [...structureNodes.map(node => 
                    node.id === updatedNode.id 
                        ? {
                            ...node,
                            name: data.name,
                            type: data.type,
                            description: data.description,
                            connections: data.connections,
                            platform: data.platform,
                            ownership: data.ownership,
                            monthlyRevenue: data.monthly_revenue
                        }
                        : node
                )];
            }
            showEditModal = false;
            selectedNode = null;
        } catch (e) {
            console.error('Error updating node:', e);
            alert('Failed to update node. Please try again.');
        }
    }

    async function handleLineCreated(event: CustomEvent<ChartLine>) {
        const line = event.detail;
        try {
            const { data, error: err } = await supabase
                .from('structure_lines')
                .insert({
                    id: line.id,
                    x1: line.x1,
                    y1: line.y1,
                    x2: line.x2,
                    y2: line.y2,
                    is_dashed: line.isDashed,
                    color: line.color
                })
                .select()
                .single();

            if (err) throw err;
            if (data) {
                structureLines = [...structureLines, { ...data, isDashed: data.is_dashed, isSelected: false }];
            }
        } catch (e) {
            console.error('Error creating line:', e);
            alert('Failed to save line. Please try again.');
        }
    }

    async function handleLineUpdated(event: CustomEvent<ChartLine>) {
        const line = event.detail;
        try {
            const { error: err } = await supabase
                .from('structure_lines')
                .update({
                    x1: line.x1,
                    y1: line.y1,
                    x2: line.x2,
                    y2: line.y2,
                    is_dashed: line.isDashed,
                    color: line.color
                })
                .eq('id', line.id);

            if (err) throw err;
            structureLines = structureLines.map(l => l.id === line.id ? line : l);
        } catch (e) {
            console.error('Error updating line:', e);
            alert('Failed to update line. Please try again.');
        }
    }

    async function handleLineDeleted(event: CustomEvent<string>) {
        const lineId = event.detail;
        try {
            const { error: err } = await supabase
                .from('structure_lines')
                .delete()
                .eq('id', lineId);

            if (err) throw err;
            structureLines = structureLines.filter(l => l.id !== lineId);
        } catch (e) {
            console.error('Error deleting line:', e);
            alert('Failed to delete line. Please try again.');
        }
    }

    onMount(() => {
        loadStructureData();
    });
</script>

<div class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <div class="flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold mb-4">Company Structure</h1>
                <p class="text-gray-600">Interactive visualization of the company structure and relationships</p>
            </div>
            <button
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                on:click={() => showCreateModal = true}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                Add Node
            </button>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div class="flex items-center mb-4">
            <h2 class="text-xl font-semibold">Structure Chart</h2>
        </div>
        {#if loading}
            <div class="flex justify-center items-center h-96">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        {:else if error}
            <div class="text-red-500 p-4 text-center">
                {error}
            </div>
        {:else if structureNodes.length > 0}
            <div class="mb-6">
                <StructureChart
                    bind:this={structureChart}
                    nodes={structureNodes}
                    lines={structureLines}
                    on:edit={(e) => {
                        selectedNode = e.detail;
                        showEditModal = true;
                    }}
                    on:lineCreated={handleLineCreated}
                    on:lineUpdated={handleLineUpdated}
                    on:lineDeleted={handleLineDeleted}
                />
            </div>
            <div class="text-sm text-gray-600 mb-4">
                <p>Hold Alt + Click and drag to create a line</p>
                <p>Hold Alt + Shift + Click and drag to create a dashed line</p>
                <p>Click line endpoints to move them</p>
                <p>Press Delete to remove a selected line</p>
            </div>
        {:else}
            <div class="text-gray-500 p-4 text-center">
                No structure data available
            </div>
        {/if}
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">Legend</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="legend-item company">
                <span class="color-box"></span>
                <span>Company</span>
            </div>
            <div class="legend-item platform">
                <span class="color-box"></span>
                <span>Platform</span>
            </div>
            <div class="legend-item module">
                <span class="color-box"></span>
                <span>Module</span>
            </div>
            <div class="legend-item revenue">
                <span class="color-box"></span>
                <span>Revenue</span>
            </div>
        </div>
    </div>
</div>

<CreateNodeModal
    bind:show={showCreateModal}
    existingNodes={structureNodes}
    on:create={handleCreateNode}
/>

{#if selectedNode}
    <EditNodeModal
        bind:show={showEditModal}
        node={selectedNode}
        existingNodes={structureNodes}
        on:update={handleEditNode}
        on:close={() => {
            showEditModal = false;
            selectedNode = null;
        }}
    />
{/if}

<style>
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .color-box {
        width: 1.5rem;
        height: 1.5rem;
        border: 2px solid;
        border-radius: 0.25rem;
    }

    .company .color-box {
        background-color: #e8eaf6;
        border-color: #3f51b5;
    }

    .platform .color-box {
        background-color: #e8f5e9;
        border-color: #43a047;
    }

    .module .color-box {
        background-color: #e3f2fd;
        border-color: #1976d2;
    }

    .revenue .color-box {
        background-color: #fff3e0;
        border-color: #f57c00;
    }
</style>
