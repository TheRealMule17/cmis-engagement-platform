<script>
    // 1. Import onMount from Svelte's core library
    import { onMount } from 'svelte';
    import EventCard from '$lib/components/events/EventCard.svelte';
    import FilterBar from '$lib/components/events/FilterBar.svelte';

    // 2. Setup our state variables
    let allEvents = []; // This starts empty now!
    let currentCategory = 'All';
    let currentDate = '';
    let currentSearch = '';
    
    // UI State variables
    let isLoading = true;
    let errorMessage = '';

    // 3. The Fetch Logic (Runs automatically when the page first loads)
    onMount(async () => {
        try {
            // Placeholder URL: You will swap this with your real AWS API Gateway URL later!
            const response = await fetch('https://your-api-gateway-url.amazonaws.com/prod/events');
            
            if (!response.ok) {
                throw new Error('Failed to fetch events from AWS');
            }
            
            // If successful, populate the array with the real database items
            allEvents = await response.json();
            
        } catch (error) {
            console.error("API Error:", error);
            
            // THE DEMO SAFETY NET: If the API fails, show an error but load the mock data anyway!
            errorMessage = "⚠️ Could not connect to AWS. Loading offline mock data.";
            allEvents = [
                { ID: "101", Title: "Resume Workshop", Date: "2026-05-18", Category: "Career", Capacity: 50 },
                { ID: "102", Title: "AWS Guest Speaker", Date: "2026-05-20", Category: "Networking", Capacity: 150 },
                { ID: "103", Title: "End of Year Tailgate", Date: "2026-05-20", Category: "Social", Capacity: 300 }
            ];
        } finally {
            // Whether it succeeded or failed, we are done loading.
            isLoading = false;
        }
    });

    // 4. THE THICK CLIENT LOGIC (Stays exactly the same!)
    $: filteredEvents = allEvents.filter(event => {
        const matchesCategory = currentCategory === 'All' || event.Category === currentCategory;
        const matchesDate = currentDate === '' || event.Date === currentDate;
        const matchesSearch = event.Title.toLowerCase().includes(currentSearch.toLowerCase());
        
        return matchesCategory && matchesDate && matchesSearch;
    });
</script>

<h1 style="color: var(--primary-color);">CMIS Event Catalog</h1>

<FilterBar 
    bind:selectedCategory={currentCategory} 
    bind:selectedDate={currentDate} 
    bind:searchQuery={currentSearch}
/>

{#if isLoading}
    <div class="loading-state">
        <p>Loading events from database...</p>
    </div>
{:else}
    
    {#if errorMessage}
        <div class="error-banner">
            <p>{errorMessage}</p>
        </div>
    {/if}

    <div class="catalog-grid">
        {#each filteredEvents as singleEvent}
            <EventCard event={singleEvent} />
        {/each}
        
        {#if filteredEvents.length === 0}
            <p style="color: var(--secondary-text);">No events found matching your filters.</p>
        {/if}
    </div>
{/if}

<style>
    .catalog-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .loading-state {
        text-align: center;
        padding: 40px;
        color: var(--secondary-color);
        font-size: 1.2rem;
    }

    .error-banner {
        background-color: #ffebee;
        color: #c62828;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-weight: bold;
        border: 1px solid #ef9a9a;
    }
</style>