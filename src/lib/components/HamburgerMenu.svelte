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
        display: none;
        flex-direction: column;
        justify-content: space-around;
        width: 2rem;
        height: 2rem;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        z-index: 1001;
    }

    .hamburger span {
        width: 2rem;
        height: 0.25rem;
        background: #333;
        border-radius: 10px;
        transition: all 0.3s linear;
        position: relative;
        transform-origin: 1px;
    }

    .hamburger.open span:first-child {
        transform: rotate(45deg);
    }

    .hamburger.open span:nth-child(2) {
        opacity: 0;
        transform: translateX(20px);
    }

    .hamburger.open span:nth-child(3) {
        transform: rotate(-45deg);
    }

    @media (max-width: 767px) {
        .hamburger {
            display: flex;
            position: fixed;
            top: 1rem;
            left: 1rem;
        }
    }
</style>
