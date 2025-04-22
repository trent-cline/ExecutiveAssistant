<script lang="ts">
    import '../app.css';
    import { Modal, initializeStores } from '@skeletonlabs/skeleton';
    initializeStores();
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { user, session, initAuth } from '$lib/auth';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import HamburgerMenu from '$lib/components/HamburgerMenu.svelte';
    import FloatingVoiceRecorder from '$lib/components/FloatingVoiceRecorder.svelte';
    import { onMount, onDestroy } from 'svelte';

    export let data;

    
    let isMobile = false;

    onMount(() => {
        // Initialize auth with data from server
        const authUnsubscribe = initAuth(data.user, data.session);
        
        // Check window size on mount
        if (browser) {
            const checkSize = () => {
                isMobile = window.innerWidth < 768;
            };
            checkSize();
            window.addEventListener('resize', checkSize);
            
            return () => {
                authUnsubscribe.unsubscribe();
                window.removeEventListener('resize', checkSize);
            };
        }
        
        return () => {
            if (authUnsubscribe) {
                authUnsubscribe.unsubscribe();
            }
        };
    });
</script>

<div class="app-container">
    {#if $user || $page.url.pathname === '/'}
        <HamburgerMenu />
        <Sidebar />
    {/if}

    <main class:with-sidebar={(!isMobile && ($user || $page.url.pathname === '/'))}>
        <Modal />
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


