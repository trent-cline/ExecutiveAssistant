import type { SupabaseClient } from '@supabase/supabase-js';
import type { SvelteComponent } from 'svelte';

export interface Column {
    id: string;
    label: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterOptions?: string[];
    template?: (value: any, row?: any) => string;
    editable?: boolean;
    type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'url' | 'currency' | 'percentage' | 'milestones';
    required?: boolean;
    validation?: (value: any) => boolean | string;
    component?: typeof SvelteComponent;
    componentProps?: Record<string, any>;
}

export interface DatabaseTableConfig {
    tableName: string;
    columns: Column[];
    defaultSort?: { column: string; direction: 'asc' | 'desc' };
    pageSize?: number;
    features?: {
        search?: boolean;
        filter?: boolean;
        sort?: boolean;
        pagination?: boolean;
        add?: boolean;
        edit?: boolean;
        delete?: boolean;
        export?: boolean;
        import?: boolean;
        select?: boolean;
    };
    permissions?: {
        canView?: (row: any) => boolean;
        canEdit?: (row: any) => boolean;
        canDelete?: (row: any) => boolean;
        canAdd?: boolean;
    };
    customActions?: {
        name: string;
        label: string;
        icon?: string;
        handler: (row: any) => void | Promise<void>;
        condition?: (row: any) => boolean;
    }[];
}

export interface FilterState {
    [column: string]: {
        operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
        value: any;
    };
}

export interface SortState {
    column: string;
    direction: 'asc' | 'desc';
}

export interface CellContent {
    component?: typeof SvelteComponent;
    props?: Record<string, any>;
    html?: string;
    text?: string;
}

export interface DatabaseTableProps {
    config: DatabaseTableConfig;
    supabase: SupabaseClient;
    initialData?: any[];
    onRowClick?: (row: any) => void;
    onDataChange?: (data: any[]) => void;
    className?: string;
}
