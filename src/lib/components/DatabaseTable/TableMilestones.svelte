<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { SupabaseClient } from '@supabase/supabase-js';
    import ProjectMilestones from '../../../routes/projects/ProjectMilestones.svelte';

    export let row: any;
    export let tableName: string;
    export let supabase: SupabaseClient;

    const dispatch = createEventDispatcher();

    async function handleMilestoneChange(e: CustomEvent) {
        try {
            const { error } = await supabase
                .from(tableName)
                .update({
                    industry_identified: e.detail.milestones.industry_identified,
                    partner_ided: e.detail.milestones.partner_ided,
                    prototype_created: e.detail.milestones.prototype_created,
                    deal_signed: e.detail.milestones.deal_signed
                })
                .eq('id', row.id);
            
            if (error) throw error;
            
            // Dispatch event to notify parent of the update
            dispatch('milestoneUpdate', {
                rowId: row.id,
                milestones: e.detail.milestones
            });
        } catch (err) {
            console.error('Error updating project milestones:', err);
            dispatch('error', {
                message: 'Failed to update milestones',
                error: err
            });
        }
    }
</script>

<div class="milestone-cell">
    <ProjectMilestones 
        milestones={{
            industry_identified: row.industry_identified || false,
            partner_ided: row.partner_ided || false,
            prototype_created: row.prototype_created || false,
            deal_signed: row.deal_signed || false
        }}
        on:change={handleMilestoneChange}
    />
</div>

<style>
    .milestone-cell {
        padding: 0.5rem;
    }
</style>
