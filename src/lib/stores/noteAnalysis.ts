import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { PrivateNote, ShoppingItem, DLLTWNote, BrainDumpEntry } from '$lib/types';

interface AnalysisResult {
    categories: string[];
    title: string;
    priority: 'low' | 'medium' | 'high';
    tags?: string[];
    is_private?: boolean;
    recipient?: string;
    source: 'local' | 'public' | 'private';
    shopping_items?: Array<{
        name: string;
        quantity?: number;
        notes?: string;
        urgency?: 'low' | 'medium' | 'high';
    }>;
    dlltw_notes?: Array<{
        title: string;
        content: string;
        chapter?: string;
        key_points?: string[];
        book_section?: string;
    }>;
    project_references?: Array<{
        title: string;
        type: 'static_website' | 'mentor_to_launch' | 'other';
        description?: string;
        estimated_time?: string;
        priority?: 'low' | 'medium' | 'high';
        status?: 'planning' | 'in_progress' | 'review' | 'completed';
    }>;
    goals?: Array<{
        title: string;
        description?: string;
        target_date?: string;
        success_criteria?: string[];
        category?: 'personal' | 'business';
        milestones?: Array<{
            title: string;
            due_date?: string;
        }>;
    }>;
}

export const analyzeNote = async (note: PrivateNote) => {
    try {
        // Call analysis API
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: note.content })
        });

        if (!response.ok) {
            throw new Error('Failed to analyze note');
        }

        const analysis: AnalysisResult = await response.json();

        // Return analysis results without making database changes
        return {
            summary: analysis.title,
            category: analysis.categories[0] || 'Note',
            priority: analysis.priority || 'Low',
            status: 'Not Started',
            tags: analysis.tags || []
        };

    } catch (error) {
        console.error('Error analyzing note:', error);
        throw error;
    }
};

// Store for tracking analysis status
export const analysisStatus = writable<{
    isAnalyzing: boolean;
    error: string | null;
}>({
    isAnalyzing: false,
    error: null
});
