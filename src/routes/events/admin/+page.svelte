<script>
    import { onMount } from 'svelte';
    import EventForm from '$lib/components/events/EventForm.svelte';

    let currentMode = 'create'; // can be 'create' or 'edit'

    // 1. State for our dropdown
    let allEvents = [];
    let isLoading = true;
    let selectedEventId = '';

    // 2. Fetch the existing events as soon as the admin page loads
    onMount(async () => {
        try {
            const response = await fetch('https://your-api-gateway-url.amazonaws.com/prod/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            allEvents = await response.json();
        } catch (error) {
            // Demo Fallback: Load mock data if AWS isn't connected yet
            allEvents = [
                { ID: "101", Title: "Resume Workshop", Date: "2026-05-18", Category: "Career", Capacity: 50 },
                { ID: "102", Title: "AWS Guest Speaker", Date: "2026-05-20", Category: "Networking", Capacity: 150 },
                { ID: "103", Title: "End of Year Tailgate", Date: "2026-05-20", Category: "Social", Capacity: 300 }
            ];
        } finally {
            isLoading = false;
        }
    });

    // 3. THICK CLIENT LOGIC: Reactively find the full event object when the dropdown changes
    $: eventToEdit = allEvents.find(event => event.ID === selectedEventId);

</script>

<div class="admin-header">
    <h1 style="color: var(--primary-color)">Event Management Panel</h1>
    
    <div class="toggle-buttons">
        <button 
            class={currentMode === 'create' ? 'active' : ''} 
            onclick={() => { currentMode = 'create'; selectedEventId = ''; }}
        >
            Create New Event
        </button>
        <button 
            class={currentMode === 'edit' ? 'active' : ''} 
            onclick={() => currentMode = 'edit'}
        >
            Edit Existing Event
        </button>
    </div>
</div>

<div class="form-container">
    {#if currentMode === 'create'}
        <EventForm />
    {:else}
        <div class="edit-selector">
            <label for="eventSelect">Select an Event to Edit:</label>
            
            {#if isLoading}
                <p style="color: var(--secondary-color)">Loading events from AWS...</p>
            {:else}
                <select id="eventSelect" bind:value={selectedEventId}>
                    <option value="" disabled>-- Choose an Event --</option>
                    {#each allEvents as event}
                        <option value={event.ID}>{event.Title} ({event.Date})</option>
                    {/each}
                </select>
            {/if}
        </div>

        {#if selectedEventId && eventToEdit}
            {#key selectedEventId}
                <EventForm initialData={eventToEdit} />
            {/key}
        {/if}
    {/if}
</div>

<style>
    .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--border-color);
    }

    .toggle-buttons button {
        padding: 8px 16px;
        margin-left: 10px;
        border: 1px solid var(--border-color);
        background-color: var(--card-bg);
        cursor: pointer;
        border-radius: 4px;
        color: var(--main-text);
        font-weight: bold;
    }

    .toggle-buttons button.active {
        background-color: var(--secondary-color);
        color: var(--primary-text);
        border-color: var(--secondary-color);
    }

    /* Styling for the new dropdown area */
    .edit-selector {
        background-color: var(--card-bg);
        padding: 20px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        margin-bottom: 24px;
        max-width: 500px;
        margin-left: auto;
        margin-right: auto;
    }

    .edit-selector label {
        display: block;
        font-weight: bold;
        margin-bottom: 10px;
        color: var(--main-text);
    }

    .edit-selector select {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 1rem;
        outline-color: var(--primary-color);
    }
</style>