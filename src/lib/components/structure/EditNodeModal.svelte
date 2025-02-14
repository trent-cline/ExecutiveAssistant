<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { StructureNode, NodePosition } from '$lib/types/structure';
    import Modal from '$lib/components/containers/Modal.svelte';
    import { supabase } from '$lib/supabase';

    // Props
    export let show = false;
    export let node: StructureNode;
    export let existingNodes: StructureNode[] = [];

    // Constants
    const NODE_HEIGHT = 100; // Standard box height
    const VERTICAL_DISTANCE_THRESHOLD = 200; // Distance within which nodes can be connected

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        close: undefined;
        update: Partial<StructureNode>;
    }>();

    // State
    let nodePositions: Record<string, NodePosition> = {};
    let loading = false;
    let formData = {
        name: '',
        type: 'module' as StructureNode['type'],
        description: '',
        connections: [] as string[],
        platform: '',
        ownership: '',
        monthlyRevenue: ''
    };

    // Load node positions when modal opens
    $: if (show) {
        loadNodePositions();
    }

    async function loadNodePositions() {
        loading = true;
        try {
            const { data: positions, error: err } = await supabase
                .from('structure_node_positions')
                .select('node_id, x, y');

            if (err) throw err;

            nodePositions = (positions || []).reduce((acc, pos) => {
                acc[pos.node_id] = pos;
                return acc;
            }, {} as Record<string, NodePosition>);
        } catch (err) {
            console.error('Error loading node positions:', err);
        } finally {
            loading = false;
        }
    }

    // Initialize form data when node changes
    $: if (node) {
        formData = {
            name: node.name,
            type: node.type,
            description: node.description,
            connections: [...(node.connections || [])],
            platform: node.platform || '',
            ownership: node.ownership?.toString() || '',
            monthlyRevenue: node.monthlyRevenue?.toString() || ''
        };
    }

    // Computed properties
    $: currentNodePosition = nodePositions[node?.id];
    $: availableNodes = existingNodes.filter(n => {
        if (n.id === node?.id) return false;
        
        const pos = nodePositions[n.id];
        const currentPos = currentNodePosition;
        
        if (!pos || !currentPos) return false;

        // Only show nodes that are within the vertical threshold
        const verticalDistance = Math.abs(pos.y - currentPos.y);
        return verticalDistance <= VERTICAL_DISTANCE_THRESHOLD;
    });
    $: nodeTypeColor = {
        company: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        service: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        product: 'bg-blue-50 border-blue-200 text-blue-700',
        revenue: 'bg-orange-50 border-orange-200 text-orange-700',
        platform: 'bg-purple-50 border-purple-200 text-purple-700',
        module: 'bg-gray-50 border-gray-200 text-gray-700'
    }[formData.type];

    // Event handlers
    function handleSubmit() {
        const updatedNode: Partial<StructureNode> = {
            id: node.id,
            name: formData.name.trim(),
            type: formData.type,
            description: formData.description.trim(),
            connections: formData.connections,
            platform: formData.platform.trim() || null,
            ownership: formData.ownership ? parseFloat(formData.ownership) : null,
            monthlyRevenue: formData.monthlyRevenue ? parseFloat(formData.monthlyRevenue) : null
        };

        dispatch('update', updatedNode);
        handleClose();
    }

    function handleClose() {
        dispatch('close');
    }

    function toggleConnection(id: string) {
        const index = formData.connections.indexOf(id);
        if (index === -1) {
            formData.connections = [...formData.connections, id];
        } else {
            formData.connections = formData.connections.filter(c => c !== id);
        }
    }
</script>

<Modal {show} on:close={handleClose}>
    <div class="p-6 max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Edit Node</h2>
            <div class="px-3 py-1 rounded-full text-sm font-medium border {nodeTypeColor}">
                {formData.type}
            </div>
        </div>

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Name field -->
                <div class="form-field col-span-2">
                    <label class="form-label required" for="name">Name</label>
                    <input
                        id="name"
                        type="text"
                        bind:value={formData.name}
                        class="form-input"
                        required
                        placeholder="Enter node name"
                    />
                </div>

                <!-- Type field -->
                <div class="form-field">
                    <label class="form-label required" for="type">Type</label>
                    <select
                        id="type"
                        bind:value={formData.type}
                        class="form-select"
                    >
                        <option value="company">Company</option>
                        <option value="service">Service</option>
                        <option value="product">Product</option>
                        <option value="revenue">Revenue</option>
                        <option value="platform">Platform</option>
                        <option value="module">Module</option>
                    </select>
                </div>

                <!-- Platform field -->
                <div class="form-field">
                    <label class="form-label" for="platform">
                        Platform
                        <span class="text-gray-500 text-sm font-normal">(optional)</span>
                    </label>
                    <input
                        id="platform"
                        type="text"
                        bind:value={formData.platform}
                        class="form-input"
                        placeholder="e.g., Web, Mobile, Desktop"
                    />
                </div>

                <!-- Ownership field -->
                <div class="form-field">
                    <label class="form-label" for="ownership">
                        Ownership %
                        <span class="text-gray-500 text-sm font-normal">(optional)</span>
                    </label>
                    <div class="relative">
                        <input
                            id="ownership"
                            type="number"
                            bind:value={formData.ownership}
                            min="0"
                            max="100"
                            step="0.01"
                            class="form-input pr-8"
                            placeholder="0.00"
                        />
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                </div>

                <!-- Monthly Revenue field -->
                <div class="form-field">
                    <label class="form-label" for="monthlyRevenue">
                        Monthly Revenue
                        <span class="text-gray-500 text-sm font-normal">(optional)</span>
                    </label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            id="monthlyRevenue"
                            type="number"
                            bind:value={formData.monthlyRevenue}
                            min="0"
                            step="0.01"
                            class="form-input pl-7"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <!-- Description field -->
                <div class="form-field col-span-2">
                    <label class="form-label" for="description">
                        Description
                        <span class="text-gray-500 text-sm font-normal">(optional)</span>
                    </label>
                    <textarea
                        id="description"
                        bind:value={formData.description}
                        class="form-textarea"
                        rows="3"
                        placeholder="Enter a description of this node"
                    ></textarea>
                </div>

                <!-- Connections field -->
                <div class="form-field col-span-2">
                    <label class="form-label mb-3">Connected Nodes</label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {#each availableNodes as availableNode (availableNode.id)}
                            <label class="connection-item">
                                <input
                                    type="checkbox"
                                    checked={formData.connections.includes(availableNode.id)}
                                    on:change={() => toggleConnection(availableNode.id)}
                                    class="form-checkbox"
                                />
                                <div class="ml-3">
                                    <div class="font-medium text-gray-900">{availableNode.name}</div>
                                    <div class="text-sm text-gray-500">{availableNode.type}</div>
                                </div>
                            </label>
                        {/each}
                    </div>
                </div>
            </div>

            <!-- Form actions -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
                <button
                    type="button"
                    on:click={handleClose}
                    class="btn btn-secondary"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Save Changes
                </button>
            </div>
        </form>
    </div>
</Modal>

<style>
    .form-field {
        @apply space-y-1.5;
    }

    .form-label {
        @apply block text-sm font-medium text-gray-900;
    }

    .form-label.required::after {
        content: "*";
        @apply text-red-500 ml-0.5;
    }

    .form-input,
    .form-select,
    .form-textarea {
        @apply block w-full rounded-lg border-gray-300 shadow-sm 
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500
               placeholder:text-gray-400;
    }

    .form-checkbox {
        @apply h-4 w-4 rounded border-gray-300 text-blue-600 
               focus:ring-2 focus:ring-blue-500;
    }

    .connection-item {
        @apply flex items-start p-3 rounded-lg border border-gray-200 
               hover:bg-gray-50 transition-colors cursor-pointer;
    }

    .btn {
        @apply px-4 py-2 rounded-lg text-sm font-medium
               focus:outline-none focus:ring-2 focus:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-colors duration-200;
    }

    .btn-primary {
        @apply bg-blue-600 text-white hover:bg-blue-700
               focus:ring-blue-500;
    }

    .btn-secondary {
        @apply bg-white text-gray-700 border border-gray-300
               hover:bg-gray-50 focus:ring-blue-500;
    }
</style>
