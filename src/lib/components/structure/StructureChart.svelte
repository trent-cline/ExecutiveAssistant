<script lang="ts">
    import { onMount } from 'svelte';
    import type { StructureNode, ChartNode, ChartEdge } from '$lib/types/structure';
    import { supabase } from '$lib/supabase';
    
    export let nodes: StructureNode[] = [];
    
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let chartNodes: ChartNode[] = [];
    let edges: ChartEdge[] = [];
    let selectedNode: string | null = null;
    let isDragging = false;
    let dragNode: ChartNode | null = null;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;
    let saveTimeout: NodeJS.Timeout;
    
    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 100;
    const NODE_COLORS = {
        company: { bg: '#e8eaf6', border: '#3f51b5', text: '#1a237e' },
        platform: { bg: '#e8f5e9', border: '#43a047', text: '#1b5e20' },
        module: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
        revenue: { bg: '#fff3e0', border: '#f57c00', text: '#e65100' }
    };
    
    onMount(async () => {
        ctx = canvas.getContext('2d')!;
        await loadSavedPositions();
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });
    
    async function loadSavedPositions() {
        const { data: positions, error } = await supabase
            .from('structure_node_positions')
            .select('node_id, x, y');
            
        if (error) {
            console.error('Error loading positions:', error);
            initializeNodes();
            return;
        }
        
        // Initialize nodes with saved positions or defaults
        chartNodes = nodes.map((node, index) => {
            const savedPosition = positions?.find(p => p.node_id === node.id);
            return {
                id: node.id,
                x: savedPosition ? savedPosition.x : 100 + (index * 270),
                y: savedPosition ? savedPosition.y : node.type === 'company' ? 100 : 200,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                data: node
            };
        });
        
        // Create edges
        edges = [];
        nodes.forEach(node => {
            node.connections.forEach(targetId => {
                edges.push({
                    from: node.id,
                    to: targetId
                });
            });
        });
        
        draw();
    }
    
    function initializeNodes() {
        chartNodes = nodes.map((node, index) => ({
            id: node.id,
            x: 100 + (index * 270),
            y: node.type === 'company' ? 100 : 200,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            data: node
        }));
        
        edges = [];
        nodes.forEach(node => {
            node.connections.forEach(targetId => {
                edges.push({
                    from: node.id,
                    to: targetId
                });
            });
        });
    }
    
    async function saveNodePosition(node: ChartNode) {
        // Clear any existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Set a new timeout to save after 500ms of no movement
        saveTimeout = setTimeout(async () => {
            const { error } = await supabase
                .from('structure_node_positions')
                .upsert({
                    node_id: node.id,
                    x: node.x,
                    y: node.y,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'node_id'
                });
                
            if (error) {
                console.error('Error saving position:', error);
            }
        }, 500);
    }
    
    function handleResize() {
        const container = canvas?.parentElement;
        if (!container || !ctx) return;
        
        canvas.width = container.clientWidth || 800;
        canvas.height = container.clientHeight || 600;
        draw();
    }
    
    function draw() {
        if (!ctx) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        // Draw edges
        edges.forEach(edge => {
            const fromNode = chartNodes.find(n => n.id === edge.from);
            const toNode = chartNodes.find(n => n.id === edge.to);
            if (fromNode && toNode) {
                drawEdge(fromNode, toNode);
            }
        });
        
        // Draw nodes
        chartNodes.forEach(node => {
            drawNode(node, node.id === selectedNode);
        });
        
        // Restore canvas state
        ctx.restore();
    }
    
    function drawNode(node: ChartNode, isSelected: boolean) {
        const colors = NODE_COLORS[node.data.type];
        
        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        
        // Draw node background
        ctx.beginPath();
        ctx.roundRect(node.x, node.y, node.width, node.height, 8);
        ctx.fillStyle = colors.bg;
        ctx.strokeStyle = isSelected ? colors.text : colors.border;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.fill();
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw node content
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(node.data.name, node.x + 10, node.y + 25);
        
        // Draw type badge
        const type = node.data.type.charAt(0).toUpperCase() + node.data.type.slice(1);
        ctx.font = '12px Arial';
        ctx.fillStyle = colors.border;
        ctx.fillText(type, node.x + 10, node.y + 45);
        
        // Draw additional info
        if (node.data.ownership) {
            ctx.fillText(`Ownership: ${node.data.ownership}%`, node.x + 10, node.y + 65);
        }
        if (node.data.monthlyRevenue) {
            ctx.fillText(`Revenue: $${node.data.monthlyRevenue.toLocaleString()}/mo`, node.x + 10, node.y + 85);
        }
        if (node.data.platform) {
            ctx.fillText(`Platform: ${node.data.platform}`, node.x + 10, node.y + 65);
        }
    }
    
    function drawEdge(from: ChartNode, to: ChartNode) {
        const startX = from.x + from.width / 2;
        const startY = from.y + from.height / 2;
        const endX = to.x + to.width / 2;
        const endY = to.y + to.height / 2;
        
        // Calculate control points for curve
        const dx = endX - startX;
        const dy = endY - startY;
        const controlX = startX + dx * 0.5;
        const controlY = startY + dy * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrow
        const angle = Math.atan2(endY - controlY, endX - controlX);
        const arrowLength = 10;
        
        ctx.beginPath();
        ctx.moveTo(endX - arrowLength * Math.cos(angle - Math.PI / 6), 
                  endY - arrowLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX, endY);
        ctx.lineTo(endX - arrowLength * Math.cos(angle + Math.PI / 6),
                  endY - arrowLength * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function getMousePos(event: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left - offsetX) / scale,
            y: (event.clientY - rect.top - offsetY) / scale
        };
    }
    
    function handleMouseDown(event: MouseEvent) {
        const pos = getMousePos(event);
        
        // Check if clicking a node
        const clickedNode = chartNodes.find(node =>
            pos.x >= node.x && pos.x <= node.x + node.width &&
            pos.y >= node.y && pos.y <= node.y + node.height
        );
        
        if (clickedNode) {
            isDragging = true;
            dragNode = clickedNode;
            selectedNode = clickedNode.id;
        } else {
            // Start panning
            isPanning = true;
            lastX = event.clientX;
            lastY = event.clientY;
            selectedNode = null;
        }
        
        draw();
    }
    
    function handleMouseMove(event: MouseEvent) {
        if (isDragging && dragNode) {
            const pos = getMousePos(event);
            dragNode.x = pos.x - NODE_WIDTH / 2;
            dragNode.y = pos.y - NODE_HEIGHT / 2;
            saveNodePosition(dragNode);
            draw();
        } else if (isPanning) {
            offsetX += event.clientX - lastX;
            offsetY += event.clientY - lastY;
            lastX = event.clientX;
            lastY = event.clientY;
            draw();
        }
    }
    
    function handleMouseUp() {
        isDragging = false;
        isPanning = false;
        dragNode = null;
    }
    
    function handleWheel(event: WheelEvent) {
        event.preventDefault();
        
        const pos = getMousePos(event);
        const delta = -event.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 2);
        
        // Adjust offset to zoom towards mouse position
        if (newScale !== scale) {
            const factor = newScale / scale;
            offsetX = event.clientX - (event.clientX - offsetX) * factor;
            offsetY = event.clientY - (event.clientY - offsetY) * factor;
            scale = newScale;
            draw();
        }
    }
</script>

<div class="structure-chart-container">
    <canvas
        bind:this={canvas}
        on:mousedown={handleMouseDown}
        on:mousemove={handleMouseMove}
        on:mouseup={handleMouseUp}
        on:mouseleave={handleMouseUp}
        on:wheel={handleWheel}
    />
    <div class="controls">
        <button class="zoom-btn" on:click={() => { scale = Math.min(2, scale + 0.1); draw(); }}>
            <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-btn" on:click={() => { scale = Math.max(0.1, scale - 0.1); draw(); }}>
            <i class="fas fa-minus"></i>
        </button>
        <button class="zoom-btn" on:click={() => { scale = 1; offsetX = 0; offsetY = 0; draw(); }}>
            <i class="fas fa-compress-arrows-alt"></i>
        </button>
    </div>
</div>

<style>
    .structure-chart-container {
        width: 100%;
        height: 800px;
        background: #fafafa;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        position: relative;
    }
    
    canvas {
        cursor: grab;
    }
    
    canvas:active {
        cursor: grabbing;
    }
    
    .controls {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        gap: 0.5rem;
        background: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .zoom-btn {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        background: white;
        color: #4b5563;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .zoom-btn:hover {
        background: #f3f4f6;
        color: #111827;
        border-color: #d1d5db;
    }
</style>
