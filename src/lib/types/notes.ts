export type NoteStatus = 'Not Started' | 'In Progress' | 'Done';
export type NotePriority = 'Low' | 'Medium' | 'High';
export type NoteSource = 'voice' | 'manual' | 'import';

export interface Note {
    id: string;
    name: string;
    summary: string;
    category: string;
    priority: NotePriority;
    due_date: string | null;
    created_at: string;
    status: NoteStatus;
    user_id: string;
    source: NoteSource;
    source_id: string | null;
    is_public: boolean;
}

export interface NoteFilters {
    searchTerm: string;
    category: string;
    priority: NotePriority | '';
    status: NoteStatus | '';
    source: NoteSource | '';
    showPublicOnly: boolean;
}

export interface NoteUpdatePayload {
    name?: string;
    summary?: string;
    category?: string;
    priority?: NotePriority;
    due_date?: string | null;
    status?: NoteStatus;
    is_public?: boolean;
}
