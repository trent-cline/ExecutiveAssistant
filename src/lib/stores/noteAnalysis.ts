import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { PrivateNote, ShoppingItem, DLLTWNote, BrainDumpEntry } from '$lib/types';

interface AnalysisResult {
    shopping_items?: string[];
    dlltw_notes?: Array<{
        content: string;
        chapter?: string;
    }>;
    brain_dump?: {
        content: string;
        category?: string;
        priority?: 'low' | 'medium' | 'high';
    };
}

export const analyzeNote = async (note: PrivateNote) => {
    try {
        // Call your analysis API
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

        // Distribute items to appropriate tables
        if (analysis.shopping_items) {
            await Promise.all(analysis.shopping_items.map(item => 
                supabase
                    .from('shopping_list')
                    .insert({
                        item,
                        note_id: note.id,
                        quantity: 1,
                        completed: false
                    })
            ));
        }

        if (analysis.dlltw_notes) {
            await Promise.all(analysis.dlltw_notes.map(note => 
                supabase
                    .from('dlltw_notes')
                    .insert({
                        content: note.content,
                        chapter: note.chapter
                    })
            ));
        }

        if (analysis.brain_dump) {
            await supabase
                .from('brain_dump_database')
                .insert({
                    content: analysis.brain_dump.content,
                    category: analysis.brain_dump.category,
                    priority: analysis.brain_dump.priority,
                    status: 'new'
                });
        }

        // Mark note as analyzed
        await supabase
            .from('private_notes')
            .update({ analyzed: true })
            .eq('id', note.id);

        return analysis;
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
