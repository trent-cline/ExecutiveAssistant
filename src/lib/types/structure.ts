export interface StructureNode {
    id: string;
    name: string;
    type: 'company' | 'service' | 'product' | 'revenue' | 'platform' | 'module';
    description: string;
    connections: string[];
    x: number;
    y: number;
    ownership?: number;
    monthlyRevenue?: number;
    platform?: string;
    width?: number;
    height?: number;
}

export interface ChartNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    data: StructureNode;
    isResizing?: boolean;
}

export interface ChartEdge {
    from: string;
    to: string;
}

export interface NodePosition {
    node_id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    created_at?: string;
    updated_at?: string;
}

export interface StructureLine {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isDashed: boolean;
    color?: string;
}

export interface ChartLine extends StructureLine {
    isSelected?: boolean;
}

export type NodeColors = {
    [key in StructureNode['type']]: {
        bg: string;
        border: string;
        text: string;
    };
};
