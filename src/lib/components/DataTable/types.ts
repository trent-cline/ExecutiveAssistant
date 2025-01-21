export interface Column {
    id: string;
    label: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterOptions?: string[];
    template?: (value: any) => string;
    editable?: boolean;
    actions?: ColumnAction[];
}

export interface ColumnAction {
    icon: string;
    label: string;
    action: string;
}

export interface SortConfig {
    column: string;
    direction: 'asc' | 'desc';
}

export interface FilterConfig {
    column: string;
    values: Set<string>;
}
