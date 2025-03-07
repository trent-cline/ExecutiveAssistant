<script lang="ts">
    import { initializeStores } from '@skeletonlabs/skeleton';
    import { AppShell } from '@skeletonlabs/skeleton';
    
    // Initialize all Skeleton stores
    initializeStores();
</script>

<div class="h-full" data-theme="modern">
    <AppShell>
        <slot />
    </AppShell>
</div>
