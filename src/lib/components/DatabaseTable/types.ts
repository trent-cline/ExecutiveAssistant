import type { SupabaseClient } from '@supabase/supabase-js';
import type { ComponentType, SvelteComponent } from 'svelte';

export interface Column {
    id: string;
    label: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    filterOptions?: string[];
    template?: (value: unknown, row?: Record<string, unknown>) => string;
    editable?: boolean;
    type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'url' | 'currency' | 'percentage' | 'milestones';
    required?: boolean;
    validation?: (value: unknown) => boolean | string;
    component?: ComponentType;
    componentProps?: Record<string, unknown>;
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
        canView?: (row: Record<string, unknown>) => boolean;
        canEdit?: (row: Record<string, unknown>) => boolean;
        canDelete?: (row: Record<string, unknown>) => boolean;
        canAdd?: boolean;
    };
    customActions?: {
        name: string;
        label: string;
        icon?: string;
        handler: (row: Record<string, unknown>) => void | Promise<void>;
        condition?: (row: Record<string, unknown>) => boolean;
    }[];
}

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';

export interface FilterState {
    column: string;
    operator: FilterOperator;
    value: string | number | boolean | null;
}

export interface SortState {
    column: string;
    direction: 'asc' | 'desc';
}

export interface CellContent {
    component?: ComponentType;
    props?: Record<string, unknown>;
    html?: string;
    text?: string;
}

export interface DatabaseTableProps {
    config: DatabaseTableConfig;
    supabase: SupabaseClient;
    initialData?: Record<string, unknown>[];
    onRowClick?: (row: Record<string, unknown>) => void;
    onDataChange?: (data: Record<string, unknown>[]) => void;
    className?: string;
}
