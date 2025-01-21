<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';
    import { supabase } from '$lib/supabase';

    export let requireAuth = true;

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (requireAuth && !session) {
            goto('/login');
        }
    });
</script>

{#if $user || !requireAuth}
    <slot />
{:else}
    <div class="auth-loading">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span>Loading...</span>
    </div>
{/if}

<style>
    .auth-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
        color: #666;
    }
</style>
