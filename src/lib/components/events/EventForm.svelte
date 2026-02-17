<script>
    export let initialData = {
        ID: '',
        Title: '',
        Date: '',
        Category: 'Career',
        Capacity: 50
    };

    let formData = { ...initialData };
    $: isEditing = formData.ID !== '';

    // NEW: State variables to manage the AWS interaction
    let isSubmitting = false;
    let submitStatus = ''; // Will be 'success' or 'error'
    let statusMessage = '';

    async function handleSubmit(event) {
        event.preventDefault(); // Prevent page refresh
        
        // 1. Lock the form while we talk to AWS
        isSubmitting = true;
        submitStatus = '';
        statusMessage = '';

        try {
            // 2. Set up the exact API route and method based on Create vs. Edit
            const apiUrl = isEditing 
                ? `https://your-api-gateway-url.amazonaws.com/prod/events/${formData.ID}` // Update specific event
                : `https://your-api-gateway-url.amazonaws.com/prod/events`;              // Create new event
            
            const method = isEditing ? 'PUT' : 'POST';

            // 3. The actual AWS Fetch Call
            const response = await fetch(apiUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json' // Tell AWS we are sending JSON data
                },
                body: JSON.stringify(formData) // Convert our Svelte object into a JSON string
            });

            if (!response.ok) {
                throw new Error('Failed to save to AWS database');
            }

            // 4. Handle Success
            submitStatus = 'success';
            statusMessage = isEditing ? 'Event updated successfully!' : 'Event created successfully!';
            
            // If it was a new event, clear the form so they can make another one
            if (!isEditing) {
                formData = { ID: '', Title: '', Date: '', Category: 'Career', Capacity: 50 };
            }

        } catch (error) {
            console.error("API Error:", error);
            
            // 5. THE DEMO SAFETY NET
            // Because your API URL is fake right now, the fetch will purposely fail. 
            // We catch it here to show a mock success message for your Phase 1 demo!
            submitStatus = 'error';
            statusMessage = `⚠️ AWS API not connected yet. (Simulated ${isEditing ? 'Update' : 'Create'} for: "${formData.Title}")`;
        } finally {
            // 6. Unlock the form
            isSubmitting = false;
        }

        async function handleDelete() {
        // 1. Ask for confirmation before doing anything destructive
        const confirmed = confirm(`Are you sure you want to delete "${formData.Title}"? This cannot be undone.`);
        if (!confirmed) return;

        isSubmitting = true;
        submitStatus = '';
        statusMessage = '';

        try {
            // 2. Point to the specific event ID using the DELETE method
            const apiUrl = `https://your-api-gateway-url.amazonaws.com/prod/events/${formData.ID}`;
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to delete from AWS database');
            }

            submitStatus = 'success';
            statusMessage = 'Event deleted successfully!';
            
            // Clear the form back to a blank state after deleting
            formData = { ID: '', Title: '', Date: '', Category: 'Career', Capacity: 50 };

        } catch (error) {
            console.error("API Error:", error);
            
            // THE DEMO SAFETY NET
            submitStatus = 'success'; // Showing green for the demo
            statusMessage = `⚠️ AWS API not connected yet. (Simulated Delete for: "${formData.Title}")`;
            
            // Still clear the form so the demo looks realistic
            formData = { ID: '', Title: '', Date: '', Category: 'Career', Capacity: 50 };
        } finally {
            isSubmitting = false;
        }
    }
    }
</script>

<form class="event-form" onsubmit={handleSubmit}>
    <h2 class="form-title">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>

    {#if statusMessage}
        <div class="status-banner {submitStatus}">
            {statusMessage}
        </div>
    {/if}

    <div class="form-group">
        <label for="title">Event Title</label>
        <input type="text" id="title" bind:value={formData.Title} required placeholder="e.g. Fall Case Competition" disabled={isSubmitting} />
    </div>

    <div class="form-row">
        <div class="form-group">
            <label for="date">Date</label>
            <input type="date" id="date" bind:value={formData.Date} required disabled={isSubmitting} />
        </div>

        <div class="form-group">
            <label for="capacity">Capacity</label>
            <input type="number" id="capacity" bind:value={formData.Capacity} required min="1" disabled={isSubmitting} />
        </div>
    </div>

    <div class="form-group">
        <label for="category">Category</label>
        <select id="category" bind:value={formData.Category} disabled={isSubmitting}>
            <option value="Career">Career</option>
            <option value="Networking">Networking</option>
            <option value="Social">Social</option>
            <option value="Mentorship">Mentorship</option>
        </select>
    </div>

   <div class="form-actions">
        {#if isEditing}
            <button type="button" class="delete-btn" onclick={handleDelete} disabled={isSubmitting}>
                Delete Event
            </button>
        {/if}

        <button type="submit" class="submit-btn" disabled={isSubmitting}>
            {#if isSubmitting}
                Processing...
            {:else}
                {isEditing ? 'Save Changes' : 'Create Event'}
            {/if}
        </button>
    </div>
</form>

<style>
    /* ... (Keep all your existing form styles the same) ... */
    
    .event-form {
        background-color: var(--card-bg);
        border: 1px solid var(--border-color);
        padding: 24px;
        border-radius: 8px;
        max-width: 500px;
        margin: 0 auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .form-title {
        color: var(--primary-color);
        margin-top: 0;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
        padding-bottom: 10px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        margin-bottom: 16px;
    }

    .form-row {
        display: flex;
        gap: 16px;
    }

    .form-row .form-group {
        flex: 1;
    }

    label {
        font-weight: bold;
        margin-bottom: 8px;
        color: var(--main-text);
        font-size: 0.9rem;
    }

    input, select {
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 1rem;
        outline-color: var(--primary-color);
    }

    .form-actions {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
    }

    .submit-btn {
        background-color: var(--primary-color);
        color: var(--primary-text);
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
    }

    .submit-btn:hover {
        opacity: 0.9;
    }

    .submit-btn:disabled {
        background-color: var(--secondary-color);
        cursor: not-allowed;
        opacity: 0.7;
    }

    /* NEW: Styling for the success/error banners */
    .status-banner {
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 20px;
        font-weight: bold;
        text-align: center;
    }

    .status-banner.success {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
    }

    .status-banner.error {
        background-color: #fff3e0;
        color: #ef6c00;
        border: 1px solid #ffe0b2;
    }

    .delete-btn {
        background-color: transparent;
        color: #d32f2f; /* Red text for destructive actions */
        border: 1px solid #d32f2f;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        margin-right: 12px; /* Space between Delete and Save */
    }

    .delete-btn:hover {
        background-color: #ffebee; /* Light red background on hover */
    }

    .delete-btn:disabled {
        border-color: var(--secondary-color);
        color: var(--secondary-color);
        cursor: not-allowed;
    }
</style>