<script lang="ts">
    import { user } from '$lib/auth';
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { slide, fade } from 'svelte/transition';
    
    export let isOpen = false;
    
    let isMobile = true; // Default to mobile
    
    // Check if device is mobile on mount and window resize
    function checkMobile() {
        isMobile = window.innerWidth < 1024; // Increased breakpoint for better tablet support
    }
    
    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/';
    }

    // Initialize mobile check on mount
    if (typeof window !== 'undefined') {
        checkMobile();
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
        transition:fade={{ duration: 200 }}
    ></div>
{/if}

<!-- Sidebar -->
<nav 
    class:open={isOpen} 
    class:mobile={isMobile}
    aria-label="Main navigation"
    transition:slide={{ duration: 300, axis: 'x' }}
>
    <div class="sidebar-header">
        <a href="/" class="header-link">
            <h2>Executive Assistant</h2>
        </a>
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
        {#if $user}
            <a 
                href="/voice-nav" 
                class:active={$page.url.pathname === '/voice-nav'} 
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-microphone-alt" aria-hidden="true"></i>
                Voice Navigation
            </a>

            <a 
                href="/table" 
                class:active={$page.url.pathname === '/table'} 
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-brain" aria-hidden="true"></i>
                Brain Inbox
            </a>

            <a 
                href="/private-notes" 
                class:active={$page.url.pathname === '/private-notes'} 
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-envelope" aria-hidden="true"></i>
                Private Notes
            </a>

            <a 
                href="/prm" 
                class:active={$page.url.pathname.startsWith('/prm')} 
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-address-book" aria-hidden="true"></i>
                Relationships
            </a>
            <div class="sidebar-separator"></div>
            <a 
                href="/company" 
                class:active={$page.url.pathname === '/company'} 
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-building" aria-hidden="true"></i>
                Pillar Apps
            </a>
            
            <button class="logout-btn" on:click={handleLogout}>
                <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                Logout
            </button>
        {:else}
            <a 
                href="/login" 
                class:active={$page.url.pathname === '/login'} 
                on:click={() => isMobile && (isOpen = false)}
            >
                <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
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
        width: 100%;
        max-width: 300px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        z-index: 1000;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
    }

    /* Mobile styles are default now */
    nav.open {
        transform: translateX(0);
    }

    /* Desktop styles */
    @media (min-width: 1024px) {
        nav {
            transform: none;
            width: 280px;
        }
    }

    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        z-index: 999;
        backdrop-filter: blur(2px);
    }

    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid #333;
        margin-bottom: 1.25rem;
    }

    .sidebar-separator {
        border-top: 1.5px solid #3b3b3b;
        margin: 1.25rem 0 1rem 0;
        width: 90%;
        align-self: center;
    }

    h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .header-link {
        text-decoration: none;
        color: inherit;
    }

    .header-link:hover h2 {
        color: var(--primary);
    }

    .close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.75rem;
        margin: -0.75rem;
        border-radius: 50%;
        transition: background-color 0.2s;
    }

    .close-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
    }

    .nav-links a {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.875rem 1rem;
        color: #fff;
        text-decoration: none;
        border-radius: 8px;
        transition: background-color 0.2s;
        font-size: 1rem;
        -webkit-tap-highlight-color: transparent;
    }

    .nav-links a:active {
        background-color: rgba(255, 255, 255, 0.15);
    }

    .nav-links a.active {
        background-color: rgba(255, 255, 255, 0.1);
        font-weight: 500;
    }

    .nav-links a:hover:not(.active) {
        background-color: rgba(255, 255, 255, 0.05);
    }

    .nav-links i {
        font-size: 1.25rem;
        width: 1.5rem;
        text-align: center;
    }

    .logout-btn {
        margin-top: auto;
        background: none;
        border: none;
        color: #ff4444;
        padding: 0.875rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        font-size: 1rem;
        transition: background-color 0.2s;
    }

    .logout-btn:hover {
        background-color: rgba(255, 68, 68, 0.1);
    }

    /* Touch device optimizations */
    @media (hover: none) {
        .nav-links a:hover:not(.active) {
            background-color: transparent;
        }

        .logout-btn:hover {
            background-color: transparent;
        }
    }
</style>
