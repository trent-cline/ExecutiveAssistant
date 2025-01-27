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
}

export interface ChartNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    data: StructureNode;
}

export interface ChartEdge {
    from: string;
    to: string;
}
