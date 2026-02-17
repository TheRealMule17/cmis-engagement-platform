<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<nav class="main-nav">
    <div class="nav-brand">Team 12th Man</div>
    <div class="nav-links">
        <a href="/">Home</a>
        <a href="/events">Active Events</a>
        <a href="/events/admin">Event Creation</a>
    </div>
</nav>

<main class="page-content">
    {@render children()}
</main>

<style>
    :global(:root) {
        --primary-color: #500000; /* Aggie Maroon */
        --primary-text: #FFFFFF;  /* White */
        --secondary-color: #707070; 
        --background-color: #F6F6F6;
        --card-bg: #FFFFFF;
        --border-color: #D1D1D1;
        --main-text: #000000;
        --secondary-text: #555555;
    }

    /* Reset the body so the navbar touches the edges of the screen */
    :global(body) {
        background-color: var(--background-color);
        color: var(--main-text);
        font-family: sans-serif;
        margin: 0;
        padding: 0; 
    }

    /* Navbar Styling */
    .main-nav {
        background-color: var(--primary-color);
        color: var(--primary-text);
        padding: 16px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .nav-brand {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .nav-links a {
        color: var(--primary-text);
        text-decoration: none;
        margin-left: 24px;
        font-size: 1.1rem;
        font-weight: 500;
        padding: 8px 12px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .nav-links a:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    /* Keep the page content centered and nicely spaced */
    .page-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
    }
</style>