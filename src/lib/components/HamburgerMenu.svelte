<script lang="ts">
    export let isOpen: boolean;
</script>

<button 
    class="hamburger" 
    class:open={isOpen} 
    on:click={() => isOpen = !isOpen}
    aria-label={isOpen ? "Close menu" : "Open menu"}
    aria-expanded={isOpen}
>
    <span></span>
    <span></span>
    <span></span>
</button>

<style>
    .hamburger {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        width: 2.5rem;
        height: 2.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        z-index: 1001;
        position: fixed;
        top: 1rem;
        left: 1rem;
        border-radius: 8px;
        transition: background-color 0.2s;
        -webkit-tap-highlight-color: transparent;
    }

    .hamburger:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    .hamburger span {
        width: 1.5rem;
        height: 2px;
        background: #333;
        border-radius: 2px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        transform-origin: 1px;
    }

    .hamburger.open span:first-child {
        transform: rotate(45deg) translate(0px, -2px);
    }

    .hamburger.open span:nth-child(2) {
        opacity: 0;
        transform: translateX(10px);
    }

    .hamburger.open span:nth-child(3) {
        transform: rotate(-45deg) translate(0px, 2px);
    }

    /* Desktop styles */
    @media (min-width: 1024px) {
        .hamburger {
            display: none;
        }
    }

    /* Touch device optimizations */
    @media (hover: none) {
        .hamburger:hover {
            background-color: transparent;
        }
    }
</style>
