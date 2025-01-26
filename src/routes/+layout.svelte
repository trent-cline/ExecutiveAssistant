<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { user } from '$lib/auth';
    import { supabase } from '$lib/supabase';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import HamburgerMenu from '$lib/components/HamburgerMenu.svelte';
    import FloatingVoiceRecorder from '$lib/components/FloatingVoiceRecorder.svelte';
    import { onMount, onDestroy } from 'svelte';

    let isMenuOpen = false;
    let isMobile = false;

    // Protected routes that require authentication
    const protectedRoutes = [
        '/table',
        '/goals',
        '/shopping-list',
        '/active-projects',
        '/dlltw-notes',
        '/private-notes',
        '/company'
    ];

    onMount(() => {
        const unsubscribe = user.subscribe(($user) => {
            if ($user && $page.url.pathname === '/') {
                goto('/table');
            } else if (!$user && protectedRoutes.includes($page.url.pathname)) {
                goto('/');
            }
        });

        return () => {
            unsubscribe();
        };
    });

    // Cleanup
    onDestroy(() => {
        if (browser) {
            window.removeEventListener('resize', () => {
                isMobile = window.innerWidth < 768;
            });
        }
    });
</script>

<div class="app-container">
    {#if $user || $page.url.pathname === '/'}
        <HamburgerMenu bind:isOpen={isMenuOpen} />
        <Sidebar bind:isOpen={isMenuOpen} />
    {/if}

    <main class:with-sidebar={(!isMobile && ($user || $page.url.pathname === '/'))}>
        <slot />
    </main>
    <FloatingVoiceRecorder />
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
        background: #f5f5f5;
        overflow-x: hidden;
    }

    :global(*) {
        box-sizing: border-box;
    }

    .app-container {
        position: relative;
        min-height: 100vh;
        width: 100%;
    }

    main {
        min-height: 100vh;
        padding: 1rem;
        width: 100%;
        transition: padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Mobile styles (default) */
    main {
        padding-top: 4rem; /* Space for hamburger menu */
        padding-left: 1rem;
        padding-right: 1rem;
    }

    /* Desktop styles */
    @media (min-width: 1024px) {
        main.with-sidebar {
            padding-left: calc(280px + 2rem); /* Sidebar width + padding */
            padding-top: 2rem;
        }
    }

    /* Larger screens */
    @media (min-width: 1536px) {
        main {
            padding-right: 2rem;
        }
        
        main.with-sidebar {
            padding-left: calc(280px + 3rem);
            padding-right: 3rem;
        }
    }
</style>

<svelte:head>
    {#if isMenuOpen}
        <style>
            body {
                overflow: hidden;
            }
        </style>
    {/if}
</svelte:head>
