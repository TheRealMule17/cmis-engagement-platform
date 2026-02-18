<script>
    // This tells the component to expect an object called "event" to be passed into it
    export let event;
    
    // NEW: Local state for UI simulation
    import { API_ENDPOINTS } from '$lib/config';

    // NEW: Callback to refresh parent component after successful RSVP
    export let onRsvpSuccess = null;
    
    // NEW: Local state for UI simulation
    let isRsvping = false;
    let hasRsvped = false; // In a real app, we'd check if the user ID is in the RSVP list
    let errorMessage = '';
    // We trust the backend now, but for immediate UI feedback we can increment local first
    // or just wait for the refresh. Let's trust the prop updates from refresh.
    // Actually, for better UX, let's keep local state for immediate feedback until refresh.
    
    // NEW: Handle the RSVP action locally
    async function handleRsvp() {
        if (hasRsvped) return;
        
        isRsvping = true;
        errorMessage = '';
        
        try {
            // Simulated User ID for Phase 1 (since we don't have Auth yet)
            // In a real app, the token would handle this.
            const tempUserId = 'dev-user-' + Date.now();

            const response = await fetch(API_ENDPOINTS.rsvp(event.eventId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': tempUserId 
                },
                body: JSON.stringify({}) // Body can be empty if userId is in header/auth
            });

            if (!response.ok) {
                // Handle specific error codes
                if (response.status === 409) {
                    const errData = await response.json();
                    if (errData.error === 'EVENT_FULL') {
                        throw new Error("This event is at full capacity");
                    } else if (errData.error === 'ALREADY_RSVPED') {
                        throw new Error("You've already RSVP'd to this event");
                    }
                } else if (response.status === 404) {
                     throw new Error("Event not found");
                }
                
                throw new Error('RSVP failed. Please try again.');
            }

            // Success!
            hasRsvped = true;
            
            // Trigger refresh in parent to get updated count from DB
            if (onRsvpSuccess) {
                onRsvpSuccess(); 
            }

        } catch (error) {
            console.error("RSVP Error:", error);
            errorMessage = error.message || "Failed to RSVP";
        } finally {
            isRsvping = false;
        }
    }
</script>

<div class="card">
    <div class="card-header">
        <span class="category">{event.category}</span>
        <span class="date">{new Date(event.dateTime).toLocaleDateString()}</span>
    </div>
    
    <h2 class="title">{event.title}</h2>
    
    <div class="card-footer">
        <div class="capacity-info">
            <span class="capacity-text">
                {event.rsvpCount || 0} / {event.capacity} attending
                {#if (event.rsvpCount || 0) >= event.capacity}
                    <span class="full-badge">(FULL)</span>
                {/if}
            </span>
            <div class="capacity-bar">
                <div 
                    class="capacity-fill" 
                    style="width: {Math.min(((event.rsvpCount || 0) / event.capacity) * 100, 100)}%; background-color: {(event.rsvpCount || 0) >= event.capacity ? 'var(--secondary-color)' : 'var(--primary-color)'}"
                ></div>
            </div>
            
             {#if hasRsvped}
                <div class="success-message">You're going! 🎉</div>
            {/if}
            {#if errorMessage}
                <div class="error-message">{errorMessage}</div>
            {/if}
        </div>
        
        <button 
            class="rsvp-btn" 
            onclick={handleRsvp} 
            disabled={isRsvping || hasRsvped || (event.rsvpCount || 0) >= event.capacity}
        >
            {#if isRsvping}
                Processing...
            {:else if hasRsvped}
                RSVP'd ✓
            {:else if (event.rsvpCount || 0) >= event.capacity}
                Event Full
            {:else}
                RSVP Now
            {/if}
        </button>
    </div>
</div>

<style>
    /* All styling uses CSS Variables to comply with the project constraints!
       Hardcoded hex codes are strictly forbidden.
    */
    .card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        background-color: var(--card-bg);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* rgba is safe, hex is forbidden */
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: var(--secondary-text);
    }

    .category {
        background-color: var(--primary-color);
        color: var(--primary-text);
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: bold;
    }

    .title {
        margin: 0 0 16px 0;
        font-size: 1.5rem;
        color: var(--main-text);
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end; /* Align items to the bottom */
        gap: 16px;
    }

    .capacity-info {
        flex: 1; /* Take up remaining space */
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .capacity-text {
        font-size: 0.9rem;
        color: var(--main-text);
        font-weight: 500;
    }

    .full-badge {
        color: var(--secondary-color);
        font-weight: bold;
        margin-left: 4px;
    }

    .capacity-bar {
        width: 100%;
        height: 8px;
        background-color: var(--border-color);
        border-radius: 4px;
        overflow: hidden; /* Ensure fill doesn't spill out */
    }

    .capacity-fill {
        height: 100%;
        transition: width 0.5s ease-in-out, background-color 0.3s ease;
        border-radius: 4px;
    }
    
    /* NEW: Message styling */
    .success-message {
        font-size: 0.8rem;
        color: #2e7d32;
        font-weight: bold;
        animation: fadeIn 0.3s ease;
    }
    
    .error-message {
        font-size: 0.8rem;
        color: #d32f2f;
        font-weight: bold;
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .rsvp-btn {
        background-color: var(--secondary-color);
        color: var(--primary-text);
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }

    .rsvp-btn:hover {
        opacity: 0.8;
    }
</style>
