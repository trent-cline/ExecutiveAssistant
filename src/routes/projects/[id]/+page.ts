import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageLoad = async ({ params }) => {
    try {
        // Try to find project in active_projects
        let { data: project, error: activeError } = await supabase
            .from('active_projects')
            .select('*')
            .eq('id', params.id)
            .single();

        if (!activeError && project) {
            return {
                project,
                projectType: 'active'
            };
        }

        // Try mentor_to_launch_projects
        ({ data: project, error: activeError } = await supabase
            .from('mentor_to_launch_projects')
            .select('*')
            .eq('id', params.id)
            .single());

        if (!activeError && project) {
            return {
                project,
                projectType: 'mentor'
            };
        }

        // Try pro_bono_projects
        ({ data: project, error: activeError } = await supabase
            .from('pro_bono_projects')
            .select('*')
            .eq('id', params.id)
            .single());

        if (!activeError && project) {
            return {
                project,
                projectType: 'probono'
            };
        }

        // If we get here, no project was found
        throw error(404, 'Project not found');
    } catch (err) {
        console.error('Error loading project:', err);
        throw error(500, 'Error loading project');
    }
};
