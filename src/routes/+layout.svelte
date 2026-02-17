<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
    /* These variables will cascade down to every component in your app */
    :global(:root) {
        --primary-color: #500000; /* Aggie Maroon */
        --primary-text: #FFFFFF;  /* White */
        --secondary-color: #707070; /* Gray for unselected items */
        --background-color: #F6F6F6;
        --card-bg: #FFFFFF;
        --border-color: #D1D1D1;
        --main-text: #000000;
        --secondary-text: #555555;
    }

    :global(body) {
        background-color: var(--background-color);
        color: var(--main-text);
        font-family: sans-serif;
        margin: 0;
        padding: 20px;
    }
</style>