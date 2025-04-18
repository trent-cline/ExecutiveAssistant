<script lang="ts">
    import { user, isLoading } from '$lib/auth';

    // This component is now simpler since server-side auth handles most protection
    // It's mainly used for UI rendering decisions and additional client-side protection
    export let requireAuth = true;
</script>

{#if $isLoading}
    <div class="auth-loading">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        <span>Loading...</span>
    </div>
{:else if $user || !requireAuth}
    <slot />
{:else}
    <div class="auth-redirect">
        <p>You need to be logged in to view this content.</p>
        <p>Redirecting to login page...</p>
    </div>
{/if}

<style>
    .auth-loading, .auth-redirect {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 2rem;
        color: #666;
    }
    
    .auth-redirect {
        color: #d32f2f;
    }
</style>
