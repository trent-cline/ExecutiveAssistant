<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import type { StructureNode, ChartNode, ChartEdge, NodePosition, ChartLine } from '$lib/types/structure';
    import { supabase } from '$lib/supabase';

    // Props
    export let nodes: StructureNode[] = [];
    export let lines: ChartLine[] = [];
    export let loading = false;
    export let error: Error | null = null;

    // Event dispatcher
    const dispatch = createEventDispatcher<{
        edit: StructureNode;
        error: Error;
        lineCreated: ChartLine;
        lineUpdated: ChartLine;
        lineDeleted: string;
    }>();

    // Canvas state
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let chartNodes: ChartNode[] = [];
    let chartLines: ChartLine[] = [];
    let edges: ChartEdge[] = [];
    let isLoading = false;

    // Interaction state
    let selectedNodeId: string | null = null;
    let isDrawingLine = false;
    let currentLine: Partial<ChartLine> | null = null;
    let selectedLine: ChartLine | null = null;
    let isDraggingLine = false;
    let dragLinePoint: 'start' | 'end' | null = null;
    let isDragging = false;
    let dragNode: ChartNode | null = null;
    let isPanning = false;
    let isResizing = false;
    let resizeNode: ChartNode | null = null;
    let lastX = 0;
    let lastY = 0;
    let lastClickTime = 0;

    // View state
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    // Constants
    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 100;
    const MIN_NODE_WIDTH = 150;
    const MIN_NODE_HEIGHT = 80;
    const RESIZE_HANDLE_SIZE = 10;
    const DOUBLE_CLICK_DELAY = 300; // milliseconds
    const DEBOUNCE_DELAY = 200;

    const NODE_COLORS: NodeColors = {
        company: { bg: '#e8eaf6', border: '#3f51b5', text: '#1a237e' },
        platform: { bg: '#e8f5e9', border: '#43a047', text: '#1b5e20' },
        module: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
        revenue: { bg: '#fff3e0', border: '#f57c00', text: '#e65100' },
        service: { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c' },
        product: { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' }
    };

    // Watch for changes in nodes prop
    $: {
        if (nodes && nodes.length > 0) {
            chartNodes = nodes.map((node, index) => {
                const existingNode = chartNodes.find(n => n.id === node.id);
                return {
                    id: node.id,
                    x: existingNode?.x ?? 100 + (index * 270),
                    y: existingNode?.y ?? (node.type === 'company' ? 100 : 200),
                    width: existingNode?.width ?? NODE_WIDTH,
                    height: existingNode?.height ?? NODE_HEIGHT,
                    data: node,
                    isResizing: false
                };
            });
            createEdges();
            requestAnimationFrame(() => draw());
        }
    }

    // Watch for changes in lines prop
    $: {
        if (lines) {
            chartLines = lines;
            requestAnimationFrame(() => draw());
        }
    }

    // Initialization
    onMount(async () => {
        try {
            ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            await loadSavedPositions();
            handleResize();
            window.addEventListener('resize', debounce(handleResize, DEBOUNCE_DELAY));
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('keydown', handleKeyDown);
            };
        } catch (err) {
            handleError(err);
        }
    });

    // Error handling
    function handleError(err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('StructureChart error:', error);
        dispatch('error', error);
    }

    // Debounce utility
    function debounce<T extends (...args: any[]) => void>(
        fn: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }

    // Data loading
    async function loadSavedPositions() {
        isLoading = true;
        try {
            const { data: positions, error: err } = await supabase
                .from('structure_node_positions')
                .select('node_id, x, y, width, height');
                
            if (err) throw err;
            
            if (positions) {
                initializeNodesWithPositions(positions);
            } else {
                initializeNodes();
            }
        } catch (err) {
            handleError(err);
        } finally {
            isLoading = false;
        }
    }

    function initializeNodesWithPositions(positions: NodePosition[] | null) {
        chartNodes = nodes.map((node, index) => {
            const savedPosition = positions?.find(p => p.node_id === node.id);
            return {
                id: node.id,
                x: savedPosition?.x ?? 100 + (index * 270),
                y: savedPosition?.y ?? (node.type === 'company' ? 100 : 200),
                width: savedPosition?.width ?? NODE_WIDTH,
                height: savedPosition?.height ?? NODE_HEIGHT,
                data: node,
                isResizing: false
            };
        });
    }

    function initializeNodes() {
        chartNodes = nodes.map((node, index) => {
            return {
                id: node.id,
                x: 100 + (index * 270),
                y: node.type === 'company' ? 100 : 200,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                data: node,
                isResizing: false
            };
        });
    }

    function createEdges() {
        edges = [];
        chartNodes.forEach(node => {
            if (node.data.connections) {
                node.data.connections.forEach(targetId => {
                    edges.push({
                        from: node.id,
                        to: targetId
                    });
                });
            }
        });
        draw();
    }

    // Drawing functions
    function draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        // Draw lines first (behind nodes)
        chartLines.forEach(drawLine);

        // Draw current line being created
        if (isDrawingLine && currentLine) {
            drawLine(currentLine as ChartLine);
        }

        // Draw node connections
        edges.forEach(edge => {
            const fromNode = chartNodes.find(n => n.id === edge.from);
            const toNode = chartNodes.find(n => n.id === edge.to);
            if (fromNode && toNode) {
                drawConnection(fromNode, toNode);
            }
        });
        
        // Draw nodes
        chartNodes.forEach(node => {
            drawNode(node);
        });
        
        ctx.restore();
    }

    function drawLine(line: ChartLine) {
        if (!ctx) return;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = line.color || '#000000';
        ctx.lineWidth = line.isSelected ? 3 : 2;

        if (line.isDashed) {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }

        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();

        // Draw endpoints for selected lines
        if (line.isSelected) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = line.color || '#000000';
            ctx.beginPath();
            ctx.arc(line.x1, line.y1, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(line.x2, line.y2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawConnection(fromNode: ChartNode, toNode: ChartNode) {
        if (!ctx) return;

        const startX = fromNode.x + fromNode.width / 2;
        const startY = fromNode.y + fromNode.height / 2;
        const endX = toNode.x + toNode.width / 2;
        const endY = toNode.y + toNode.height / 2;

        ctx.beginPath();
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function drawNode(node: ChartNode) {
        const colors = NODE_COLORS[node.data.type] || NODE_COLORS.module;
        const isSelected = node.id === selectedNodeId;
        
        // Draw node background
        ctx.beginPath();
        roundRect(ctx, node.x, node.y, node.width, node.height, 8);
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#2196f3' : colors.border;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
        
        // Draw node content with dynamic text wrapping
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        wrapText(ctx, node.data.name, node.x + 10, node.y + 25, node.width - 20, 20);
        
        ctx.font = '14px Inter, system-ui, sans-serif';
        let yOffset = 45;
        
        ctx.fillText(node.data.type, node.x + 10, node.y + yOffset);
        yOffset += 20;
        
        if (node.data.platform) {
            wrapText(ctx, `Platform: ${node.data.platform}`, node.x + 10, node.y + yOffset, node.width - 20, 20);
            yOffset += 20;
        }
        if (node.data.monthlyRevenue) {
            ctx.fillText(`Revenue: $${node.data.monthlyRevenue.toLocaleString()}/mo`, node.x + 10, node.y + yOffset);
        }

        // Draw resize handle if selected
        if (isSelected) {
            ctx.fillStyle = '#2196f3';
            ctx.fillRect(
                node.x + node.width - RESIZE_HANDLE_SIZE,
                node.y + node.height - RESIZE_HANDLE_SIZE,
                RESIZE_HANDLE_SIZE,
                RESIZE_HANDLE_SIZE
            );
        }
    }

    function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    function isOverLine(line: ChartLine, x: number, y: number, threshold: number = 5) {
        const A = { x: line.x1, y: line.y1 };
        const B = { x: line.x2, y: line.y2 };
        const P = { x, y };
        
        // Calculate distance from point to line segment
        const lengthSquared = Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2);
        if (lengthSquared === 0) return Math.hypot(P.x - A.x, P.y - A.y) <= threshold;
        
        let t = ((P.x - A.x) * (B.x - A.x) + (P.y - A.y) * (B.y - A.y)) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        const projection = {
            x: A.x + t * (B.x - A.x),
            y: A.y + t * (B.y - A.y)
        };
        
        return Math.hypot(P.x - projection.x, P.y - projection.y) <= threshold;
    }

    function getMousePos(event: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left - offsetX) / scale,
            y: (event.clientY - rect.top - offsetY) / scale
        };
    }

    function isOverResizeHandle(node: ChartNode, x: number, y: number): boolean {
        if (node.id !== selectedNodeId) return false;
        
        const handleX = node.x + node.width - RESIZE_HANDLE_SIZE;
        const handleY = node.y + node.height - RESIZE_HANDLE_SIZE;
        
        return x >= handleX && x <= handleX + RESIZE_HANDLE_SIZE &&
               y >= handleY && y <= handleY + RESIZE_HANDLE_SIZE;
    }

    function isOverNode(node: ChartNode, x: number, y: number) {
        return x >= node.x && x <= node.x + node.width &&
               y >= node.y && y <= node.y + node.height;
    }

    // Event handlers
    function handleMouseDown(event: MouseEvent) {
        const pos = getMousePos(event);
        
        // Check for node interaction first
        const clickedNode = chartNodes.find(n => isOverNode(n, pos.x, pos.y));
        if (clickedNode) {
            const now = Date.now();
            
            // Check for resize handle if node is selected
            if (selectedNodeId === clickedNode.id && isOverResizeHandle(clickedNode, pos.x, pos.y)) {
                isResizing = true;
                resizeNode = clickedNode;
                return;
            }

            // Handle double click for edit
            if (now - lastClickTime < DOUBLE_CLICK_DELAY) {
                dispatch('edit', clickedNode.data);
            } else {
                // Single click for selection and drag
                selectedNodeId = clickedNode.id;
                isDragging = true;
                dragNode = clickedNode;
                // Deselect any selected line
                chartLines.forEach(l => l.isSelected = false);
                selectedLine = null;
            }
            lastClickTime = now;
            draw();
            return;
        } else if (!event.altKey) {
            // Deselect node if clicking empty space and not creating a line
            selectedNodeId = null;
        }

        // Check for line interaction
        const clickedLine = chartLines.find(line => {
            const startDist = Math.hypot(line.x1 - pos.x, line.y1 - pos.y);
            const endDist = Math.hypot(line.x2 - pos.x, line.y2 - pos.y);
            if (startDist <= 5 || endDist <= 5) {
                dragLinePoint = startDist <= 5 ? 'start' : 'end';
                return true;
            }
            return isOverLine(line, pos.x, pos.y);
        });

        if (clickedLine) {
            chartLines.forEach(l => l.isSelected = false);
            clickedLine.isSelected = true;
            selectedLine = clickedLine;
            isDraggingLine = dragLinePoint !== null;
            draw();
            return;
        }

        // Start drawing new line with Alt
        if (event.altKey) {
            isDrawingLine = true;
            currentLine = {
                id: crypto.randomUUID(),
                x1: pos.x,
                y1: pos.y,
                x2: pos.x,
                y2: pos.y,
                isDashed: event.shiftKey,
                color: '#000000',
                isSelected: true
            };
            return;
        }

        // Start panning if no other interaction
        if (!isResizing && !isDragging && !isDrawingLine) {
            isPanning = true;
            lastX = event.clientX;
            lastY = event.clientY;
        }
    }

    function handleMouseMove(event: MouseEvent) {
        const pos = getMousePos(event);

        if (isDrawingLine && currentLine) {
            currentLine.x2 = pos.x;
            currentLine.y2 = pos.y;
            requestAnimationFrame(() => draw());
            return;
        }

        if (isDraggingLine && selectedLine && dragLinePoint) {
            if (dragLinePoint === 'start') {
                selectedLine.x1 = pos.x;
                selectedLine.y1 = pos.y;
            } else {
                selectedLine.x2 = pos.x;
                selectedLine.y2 = pos.y;
            }
            requestAnimationFrame(() => draw());
            return;
        }

        if (isResizing && resizeNode) {
            resizeNode.width = Math.max(MIN_NODE_WIDTH, pos.x - resizeNode.x);
            resizeNode.height = Math.max(MIN_NODE_HEIGHT, pos.y - resizeNode.y);
            saveNodePosition(resizeNode);
            draw();
            return;
        }

        if (isDragging && dragNode) {
            dragNode.x = pos.x - dragNode.width / 2;
            dragNode.y = pos.y - dragNode.height / 2;
            saveNodePosition(dragNode);
            draw();
            return;
        }

        if (isPanning) {
            offsetX += event.clientX - lastX;
            offsetY += event.clientY - lastY;
            lastX = event.clientX;
            lastY = event.clientY;
            draw();
            return;
        }

        // Update cursor based on what's under it
        const overResizeHandle = chartNodes.some(n => isOverResizeHandle(n, pos.x, pos.y));
        const overNode = chartNodes.some(n => isOverNode(n, pos.x, pos.y));
        const overLine = chartLines.some(line => {
            const startDist = Math.hypot(line.x1 - pos.x, line.y1 - pos.y);
            const endDist = Math.hypot(line.x2 - pos.x, line.y2 - pos.y);
            return startDist <= 5 || endDist <= 5 || isOverLine(line, pos.x, pos.y);
        });
        
        canvas.style.cursor = overResizeHandle ? 'se-resize' : 
                             overNode ? 'move' :
                             overLine ? 'pointer' : 
                             'default';
    }

    function handleMouseUp() {
        if (isResizing && resizeNode) {
            saveNodePosition(resizeNode);
            resizeNode.isResizing = false;
            resizeNode = null;
        }
        
        if (isDragging && dragNode) {
            saveNodePosition(dragNode);
            dragNode = null;
        }
        
        if (isDrawingLine && currentLine) {
            const line: ChartLine = {
                ...currentLine as ChartLine,
                isSelected: false
            };
            dispatch('lineCreated', line);
            isDrawingLine = false;
            currentLine = null;
        }

        if (isDraggingLine && selectedLine) {
            dispatch('lineUpdated', selectedLine);
            isDraggingLine = false;
            dragLinePoint = null;
        }

        isResizing = false;
        isDragging = false;
        isPanning = false;
        canvas.style.cursor = 'default';
    }

    function handleWheel(event: WheelEvent) {
        event.preventDefault();
        
        const pos = getMousePos(event);
        const delta = -event.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 2);
        
        if (newScale !== scale) {
            const factor = newScale / scale;
            offsetX = event.clientX - (event.clientX - offsetX) * factor;
            offsetY = event.clientY - (event.clientY - offsetY) * factor;
            scale = newScale;
            draw();
        }
    }

    function handleResize() {
        const container = canvas.parentElement;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            draw();
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Delete' && selectedLine) {
            dispatch('lineDeleted', selectedLine.id);
            selectedLine = null;
        }
    }

    // Data persistence
    const saveNodePosition = debounce(async (node: ChartNode) => {
        try {
            const { error: err } = await supabase
                .from('structure_node_positions')
                .upsert({
                    node_id: node.id,
                    x: node.x,
                    y: node.y,
                    width: node.width,
                    height: node.height,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'node_id'
                });

            if (err) throw err;
        } catch (err) {
            handleError(err);
        }
    }, DEBOUNCE_DELAY);

    // Helper functions
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
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
        <button 
            class="zoom-btn" 
            on:click={() => { scale = Math.min(2, scale + 0.1); draw(); }}
            aria-label="Zoom in"
        >
            <i class="fas fa-plus"></i>
        </button>
        <button 
            class="zoom-btn" 
            on:click={() => { scale = Math.max(0.1, scale - 0.1); draw(); }}
            aria-label="Zoom out"
        >
            <i class="fas fa-minus"></i>
        </button>
        <button 
            class="zoom-btn" 
            on:click={() => { scale = 1; offsetX = 0; offsetY = 0; draw(); }}
            aria-label="Reset view"
        >
            <i class="fas fa-compress-arrows-alt"></i>
        </button>
    </div>
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    {/if}
    {#if error}
        <div class="error-overlay">
            <div class="alert alert-danger" role="alert">
                {error.message}
            </div>
        </div>
    {/if}
</div>

<style>
    .structure-chart-container {
        @apply w-full h-[800px] bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative;
    }
    
    canvas {
        @apply cursor-grab;
    }
    
    canvas:active {
        @apply cursor-grabbing;
    }
    
    .controls {
        @apply absolute bottom-4 right-4 flex gap-2 bg-white p-2 rounded-lg shadow-sm;
    }
    
    .zoom-btn {
        @apply w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-600 
               hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors;
    }
    
    .loading-overlay {
        @apply absolute top-0 left-0 w-full h-full bg-gray-100 opacity-75 flex justify-center items-center;
    }
    
    .error-overlay {
        @apply absolute top-0 left-0 w-full h-full bg-gray-100 opacity-75 flex justify-center items-center;
    }
</style>
