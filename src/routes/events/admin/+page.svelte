<script>
    import { onMount } from 'svelte';
    import EventForm from '$lib/components/events/EventForm.svelte';
    import { API_ENDPOINTS } from '$lib/config';

    let currentMode = 'create'; // can be 'create' or 'edit'

    // 1. State for our dropdown
    let allEvents = [];
    let isLoading = true;
    let selectedEventId = '';

    function normalizeEvent(ev) {
        return {
            eventId: ev.eventId ?? ev.EventID,
            title: ev.title ?? ev.Title,
            dateTime: ev.dateTime ?? ev.Date,
            category: ev.category ?? ev.Category,
            capacity: ev.capacity ?? ev.Capacity ?? 0,
            rsvpCount: ev.rsvpCount ?? ev.CurrentRSVPs ?? ev.currentRSVPs ?? 0,
            description: ev.description ?? ev.Description,
            location: ev.location ?? ev.Location,
        };
    }

    // 2. Fetch the existing events as soon as the admin page loads
    onMount(async () => {
        isLoading = true;
        try {
            const response = await fetch(API_ENDPOINTS.events);
            if (!response.ok) throw new Error('Failed to fetch events');
            const data = await response.json();
            const raw = Array.isArray(data) ? data : (data.events || []);
            allEvents = raw.map(normalizeEvent);
        } catch (error) {
            console.error("API Error:", error);
            allEvents = [];
        } finally {
            isLoading = false;
        }
    });

    // 3. THICK CLIENT LOGIC: Reactively find the full event object when the dropdown changes
    $: eventToEdit = allEvents.find(event => event.eventId === selectedEventId);

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
                        <option value={event.eventId}>{event.title} ({event.dateTime})</option>
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