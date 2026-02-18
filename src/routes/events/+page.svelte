<script>
    // 1. Import onMount from Svelte's core library
    import { onMount } from 'svelte';
    import EventCard from '$lib/components/events/EventCard.svelte';
    import FilterBar from '$lib/components/events/FilterBar.svelte';
    import { API_ENDPOINTS } from '$lib/config';

    // 2. Setup our state variables
    let allEvents = []; // This starts empty now!
    let currentCategory = 'All';
    let currentDate = '';
    let currentSearch = '';
    
    // UI State variables
    let isLoading = true;
    let errorMessage = '';

    // 3. The Fetch Logic (Runs automatically when the page first loads)
    async function fetchEvents() {
        isLoading = true;
        errorMessage = '';
        try {
            const response = await fetch(API_ENDPOINTS.events);
            
            if (!response.ok) {
                throw new Error('Failed to fetch events from AWS');
            }
            
            // If successful, populate the array with the real database items
            allEvents = await response.json();
            
        } catch (error) {
            console.error("API Error:", error);
            errorMessage = "⚠️ Could not connect to AWS. Please check your network connection.";
            allEvents = []; // No mock data fallback
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        fetchEvents();
    });

    // Callback to refresh events after RSVP
    function refreshEvents() {
        fetchEvents();
    }

    // 4. THE THICK CLIENT LOGIC (Stays exactly the same!)
    $: filteredEvents = allEvents.filter(event => {
        const matchesCategory = currentCategory === 'All' || event.category === currentCategory;
        // Simple date check: check if the ISO string starts with the YYYY-MM-DD selected
        const matchesDate = currentDate === '' || (event.dateTime && event.dateTime.startsWith(currentDate));
        const matchesSearch = event.title.toLowerCase().includes(currentSearch.toLowerCase());
        
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
            <EventCard event={singleEvent} onRsvpSuccess={refreshEvents} />
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