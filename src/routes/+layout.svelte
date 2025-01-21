<script lang="ts">
    import { user } from '$lib/auth';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabase';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import HamburgerMenu from '$lib/components/HamburgerMenu.svelte';

    // Handle logout
    async function handleLogout() {
        await supabase.auth.signOut();
        goto('/');
    }

    // Only protect /notes route
    $: {
        if (!$user && $page.url.pathname === '/notes') {
            goto('/login');
        }
    }

    let isMenuOpen = false;
</script>

<HamburgerMenu bind:isOpen={isMenuOpen} />
<Sidebar bind:isOpen={isMenuOpen} />

{#if $user && $page.url.pathname === '/notes'}
    <nav>
        <div class="nav-content">
            <span>Personal Assistant</span>
            <button on:click={handleLogout}>Logout</button>
        </div>
    </nav>
{/if}

<main>
    <slot />
</main>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
        background: #f5f5f5;
    }

    main {
        min-height: 100vh;
        padding: 1rem;
    }

    /* Add padding for hamburger menu on mobile */
    @media (max-width: 767px) {
        main {
            padding-top: 4rem;
        }
    }

    nav {
        background-color: #0066cc;
        padding: 1rem;
        color: white;
    }

    .nav-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    button {
        background: transparent;
        border: 1px solid white;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
    }

    button:hover {
        background: white;
        color: #0066cc;
    }
</style>
