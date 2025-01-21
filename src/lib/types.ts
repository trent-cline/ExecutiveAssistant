// Base Types
export interface Note {
    id: string;
    content: string;
    created_at: string;
    analyzed: boolean;
}

export interface PrivateNote extends Note {
    user_id?: string;
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    completed: boolean;
    created_at: string;
}

// Goal Related Types
export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: 'not_started' | 'in_progress' | 'completed';
    due_date?: string;
    created_at: string;
}

export interface GoalMilestone extends Milestone {
    goal_id: string;
}

export interface GoalProgress {
    id: string;
    goal_id: string;
    note: string;
    progress_percentage: number;
    created_at: string;
}

export interface GoalReward {
    id: string;
    goal_id: string;
    reward: string;
    claimed: boolean;
    created_at: string;
}

// Project Related Types
export interface Project {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: 'active' | 'on_hold' | 'completed';
    created_at: string;
}

export interface ProjectMilestone extends Milestone {
    project_id: string;
}

// Shopping Related Types
export interface ShoppingItem {
    id: string;
    user_id: string;
    item: string;
    quantity: number;
    note_id?: string;
    completed: boolean;
    created_at: string;
}

// DLLTW Notes Types
export interface DLLTWNote {
    id: string;
    user_id: string;
    content: string;
    chapter?: string;
    note_id?: string;
    created_at: string;
}

// Brain Dump Types
export interface BrainDumpEntry {
    id: string;
    user_id: string;
    content: string;
    category?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
    status?: 'new' | 'processed' | 'archived';
    created_at: string;
}

// Project Types
export interface StaticWebsiteProject {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: string;
    url?: string;
    created_at: string;
}

export interface MentorToLaunchProject {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: string;
    mentor?: string;
    created_at: string;
}
