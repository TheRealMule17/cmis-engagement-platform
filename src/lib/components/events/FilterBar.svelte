<script>
    // We export these so the main page can read what the user selected
    export let selectedCategory = 'All';
    export let selectedDate = '';
    
    // We can pass in a list of unique categories to populate the dropdown
    export let categories = ['All', 'Career', 'Networking', 'Social'];
</script>

<div class="filter-container">
    <div class="filter-group">
        <label for="category">Category:</label>
        <select id="category" bind:value={selectedCategory}>
            {#each categories as category}
                <option value={category}>{category}</option>
            {/each}
        </select>
    </div>

    <div class="filter-group">
        <label for="date">Date:</label>
        <input type="date" id="date" bind:value={selectedDate} />
    </div>
</div>

<style>
    .filter-container {
        display: flex;
        gap: 20px;
        margin-bottom: 24px;
        padding: 16px;
        background-color: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    label {
        font-weight: bold;
        color: var(--main-text);
    }

    select, input {
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        /* Using the theme colors for focus states */
        outline-color: var(--primary-color); 
    }
</style>