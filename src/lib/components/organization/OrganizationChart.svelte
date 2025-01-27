<script lang="ts">
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabase';
    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();

    export let employees: any[] = [];
    
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let chartNodes: any[] = [];
    let edges: any[] = [];
    let selectedNode: string | null = null;
    let isDragging = false;
    let dragNode: any | null = null;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;
    let saveTimeout: NodeJS.Timeout;
    let lastClickTime = 0;
    const doubleClickDelay = 300; // milliseconds
    
    const NODE_WIDTH = 220;
    const NODE_HEIGHT = 100;
    const NODE_COLORS = {
        CEO: { bg: '#e8eaf6', border: '#3f51b5', text: '#1a237e' },
        Manager: { bg: '#e8f5e9', border: '#43a047', text: '#1b5e20' },
        Developer: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
        Designer: { bg: '#fff3e0', border: '#f57c00', text: '#e65100' },
        Product: { bg: '#f3e5f5', border: '#8e24aa', text: '#4a148c' },
        Marketing: { bg: '#fce4ec', border: '#e91e63', text: '#880e4f' },
        Sales: { bg: '#e1f5fe', border: '#03a9f4', text: '#01579b' },
        Other: { bg: '#f5f5f5', border: '#9e9e9e', text: '#212121' }
    };
    
    onMount(async () => {
        if (!canvas) return;
        ctx = canvas.getContext('2d')!;
        await loadSavedPositions();
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });
    
    async function loadSavedPositions() {
        try {
            const { data: positions, error } = await supabase
                .from('organization_positions')
                .select('employee_id, x, y');
                
            if (error) {
                console.error('Error loading positions:', error);
                initializeNodes();
                return;
            }
            
            // Initialize nodes with saved positions or defaults
            chartNodes = employees.map((emp, index) => {
                const savedPosition = positions?.find(p => p.employee_id === emp.id);
                return {
                    id: emp.id,
                    x: savedPosition ? savedPosition.x : 100 + (index * 270),
                    y: savedPosition ? savedPosition.y : !emp.reports_to ? 100 : 200,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    data: emp
                };
            });
            
            // Create edges based on reporting structure
            edges = employees
                .filter(emp => emp.reports_to)
                .map(emp => ({
                    from: emp.reports_to,
                    to: emp.id
                }));
            
            draw();
        } catch (err) {
            console.error('Error in loadSavedPositions:', err);
            initializeNodes();
        }
    }
    
    function initializeNodes() {
        let levels = new Map();
        
        // First, find the CEO (no reports_to)
        const ceo = employees.find(emp => !emp.reports_to);
        if (ceo) {
            levels.set(0, [ceo]);
            
            // Then, recursively assign levels
            let currentLevel = 1;
            let hasNewNodes = true;
            
            while (hasNewNodes) {
                const previousLevelIds = levels.get(currentLevel - 1).map(e => e.id);
                const currentLevelNodes = employees.filter(emp => 
                    previousLevelIds.includes(emp.reports_to)
                );
                
                if (currentLevelNodes.length > 0) {
                    levels.set(currentLevel, currentLevelNodes);
                    currentLevel++;
                } else {
                    hasNewNodes = false;
                }
            }
        }
        
        // Now position nodes based on their level
        chartNodes = [];
        levels.forEach((levelNodes, level) => {
            const levelWidth = levelNodes.length * (NODE_WIDTH + 50);
            const startX = (canvas.width - levelWidth) / 2;
            
            levelNodes.forEach((node, index) => {
                chartNodes.push({
                    id: node.id,
                    x: startX + index * (NODE_WIDTH + 50),
                    y: 100 + level * (NODE_HEIGHT + 50),
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    data: node
                });
            });
        });
        
        // Create edges based on reporting structure
        edges = employees
            .filter(emp => emp.reports_to)
            .map(emp => ({
                from: emp.reports_to,
                to: emp.id
            }));
    }
    
    async function saveNodePosition(node: any) {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        saveTimeout = setTimeout(async () => {
            const { error } = await supabase
                .from('organization_positions')
                .upsert({
                    employee_id: node.id,
                    x: node.x,
                    y: node.y
                });
                
            if (error) {
                console.error('Error saving position:', error);
            }
        }, 500);
    }
    
    function handleResize() {
        if (!canvas) return;
        const container = canvas.parentElement;
        if (!container) return;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
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
                ctx.beginPath();
                ctx.moveTo(
                    fromNode.x + fromNode.width / 2,
                    fromNode.y + fromNode.height
                );
                ctx.lineTo(
                    toNode.x + toNode.width / 2,
                    toNode.y
                );
                ctx.strokeStyle = '#9ca3af';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
        
        // Draw nodes
        chartNodes.forEach(node => {
            const colors = NODE_COLORS[node.data.role as keyof typeof NODE_COLORS] || NODE_COLORS.Other;
            
            // Draw node background
            ctx.fillStyle = colors.bg;
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(node.x, node.y, node.width, node.height, 8);
            ctx.fill();
            ctx.stroke();
            
            // Draw role banner
            ctx.fillStyle = colors.border;
            ctx.fillRect(node.x, node.y, node.width, 24);
            
            // Draw text
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(
                node.data.role,
                node.x + node.width / 2,
                node.y + 16
            );
            
            ctx.fillStyle = colors.text;
            ctx.font = 'bold 14px Inter';
            ctx.fillText(
                node.data.name,
                node.x + node.width / 2,
                node.y + 45
            );
            
            ctx.font = '12px Inter';
            ctx.fillText(
                node.data.title,
                node.x + node.width / 2,
                node.y + 65
            );
            
            if (node.data.department) {
                ctx.fillStyle = '#6b7280';
                ctx.font = '11px Inter';
                ctx.fillText(
                    node.data.department,
                    node.x + node.width / 2,
                    node.y + 85
                );
            }
        });
        
        ctx.restore();
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
        
        // Check if clicked on a node
        const clickedNode = chartNodes.find(node =>
            pos.x >= node.x &&
            pos.x <= node.x + node.width &&
            pos.y >= node.y &&
            pos.y <= node.y + node.height
        );
        
        if (clickedNode) {
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime < doubleClickDelay) {
                // Double click detected
                dispatch('dblclick', clickedNode.data);
                isDragging = false;
                dragNode = null;
            } else {
                isDragging = true;
                dragNode = clickedNode;
                selectedNode = clickedNode.id;
            }
            lastClickTime = currentTime;
        } else {
            isPanning = true;
            lastX = event.clientX;
            lastY = event.clientY;
        }
    }
    
    function handleMouseMove(event: MouseEvent) {
        if (isDragging && dragNode) {
            const pos = getMousePos(event);
            dragNode.x = pos.x - NODE_WIDTH / 2;
            dragNode.y = pos.y - NODE_HEIGHT / 2;
            draw();
            saveNodePosition(dragNode);
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
        dragNode = null;
        isPanning = false;
    }
    
    function handleWheel(event: WheelEvent) {
        event.preventDefault();
        const delta = -event.deltaY;
        const factor = 0.1;
        const newScale = delta > 0 ? scale * (1 + factor) : scale / (1 + factor);
        
        // Limit scale
        if (newScale >= 0.5 && newScale <= 2) {
            scale = newScale;
            draw();
        }
    }
</script>

<div class="chart-container">
    <canvas
        bind:this={canvas}
        on:mousedown={handleMouseDown}
        on:mousemove={handleMouseMove}
        on:mouseup={handleMouseUp}
        on:mouseleave={handleMouseUp}
        on:wheel={handleWheel}
    />
</div>

<style>
    .chart-container {
        width: 100%;
        height: 100%;
        min-height: 600px;
        position: relative;
        overflow: hidden;
    }

    canvas {
        width: 100%;
        height: 100%;
        cursor: grab;
    }

    canvas:active {
        cursor: grabbing;
    }
</style>
