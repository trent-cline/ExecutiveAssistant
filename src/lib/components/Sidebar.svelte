<script lang="ts">
    import { user } from '$lib/auth';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { slide } from 'svelte/transition';
    
    export let isOpen = false;
    
    let isMobile = false;
    
    // Check if device is mobile on mount and window resize
    function checkMobile() {
        isMobile = window.innerWidth < 768;
    }
    
    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/';
    }
</script>

<svelte:window on:resize={checkMobile} />

<svelte:head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</svelte:head>

<!-- Overlay for mobile -->
{#if isMobile && isOpen}
    <div 
        class="overlay" 
        on:click={() => isOpen = false}
        on:keydown={(e) => e.key === 'Escape' && (isOpen = false)}
        role="button"
        tabindex="0"
        aria-label="Close sidebar overlay"
        transition:slide
    ></div>
{/if}

<!-- Sidebar -->
<nav 
    class:open={isOpen} 
    class:mobile={isMobile}
    aria-label="Main navigation"
>
    <div class="sidebar-header">
        <h2>Personal Assistant</h2>
        {#if isMobile}
            <button 
                class="close-btn" 
                on:click={() => isOpen = false}
                aria-label="Close sidebar"
            >
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        {/if}
    </div>

    <div class="nav-links">
        <a 
            href="/" 
            class:active={$page.url.pathname === '/'} 
            on:click={() => isMobile && (isOpen = false)}
        >
            <i class="fas fa-microphone"></i>
            Record Note
        </a>
        
        {#if $user}
            <a 
                href="/notes" 
                class:active={$page.url.pathname === '/notes'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-sticky-note"></i>
                My Notes
            </a>
            
            <a 
                href="/table" 
                class:active={$page.url.pathname === '/table'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-brain"></i>
                Brain Inbox
            </a>

            <a 
                href="/goals" 
                class:active={$page.url.pathname === '/goals'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-bullseye"></i>
                Goals
            </a>

            <a 
                href="/shopping" 
                class:active={$page.url.pathname === '/shopping'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-shopping-cart"></i>
                Shopping List
            </a>

            <a 
                href="/projects" 
                class:active={$page.url.pathname === '/projects'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-project-diagram"></i>
                Active Projects
            </a>

            <a 
                href="/dlltw" 
                class:active={$page.url.pathname === '/dlltw'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-book"></i>
                DLLTW Notes
            </a>
            
            <button class="logout-btn" on:click={handleLogout}>
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        {:else}
            <a 
                href="/login" 
                class:active={$page.url.pathname === '/login'}
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-sign-in-alt"></i>
                Login
            </a>
        {/if}
    </div>
</nav>

<style>
    nav {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        background: #1a1a1a;
        color: white;
        width: 250px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        z-index: 1000;
        transition: transform 0.3s ease;
    }

    /* Mobile styles */
    nav.mobile {
        transform: translateX(-100%);
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    }

    nav.mobile.open {
        transform: translateX(0);
    }

    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
    }

    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1rem;
        border-bottom: 1px solid #333;
        margin-bottom: 1rem;
    }

    h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 500;
    }

    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
    }

    .close-btn:hover {
        color: #ccc;
    }

    .nav-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    a, .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        transition: background-color 0.2s;
    }

    a:hover, .logout-btn:hover {
        background: #333;
    }

    .active {
        background: #0066cc;
    }

    .active:hover {
        background: #0052a3;
    }

    .logout-btn {
        background: none;
        border: none;
        color: #ff4444;
        cursor: pointer;
        width: 100%;
        text-align: left;
        margin-top: auto;
    }

    .logout-btn:hover {
        background: #331111;
    }

    i {
        width: 20px;
        text-align: center;
    }

    /* Desktop styles */
    @media (min-width: 768px) {
        nav {
            transform: none;
            box-shadow: none;
        }

        /* Add margin to main content on desktop */
        :global(main) {
            margin-left: 250px;
        }
    }
</style>
