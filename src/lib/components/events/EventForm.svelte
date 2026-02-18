<script>
    import { API_ENDPOINTS } from '$lib/config';

    export let initialData = {
        eventId: '',
        title: '',
        dateTime: '',
        category: 'Career',
        capacity: 50
    };

    let formData = { ...initialData };
    
    // Fix date format for input=date (needs YYYY-MM-DD, but we might get ISO)
    if (formData.dateTime && formData.dateTime.includes('T')) {
        formData.dateTime = formData.dateTime.split('T')[0];
    }

    $: isEditing = formData.eventId !== '';

    // NEW: State variables to manage the AWS interaction
    let isSubmitting = false;
    let submitStatus = ''; // Will be 'success' or 'error'
    let statusMessage = '';
    
    // NEW: Validation state
    let validationErrors = {
        title: '',
        dateTime: '',
        category: '',
        capacity: ''
    };

    function validateForm() {
        let isValid = true;
        const errors = {
            title: '',
            dateTime: '',
            category: '',
            capacity: ''
        };

        // 1. Title Validation
        if (!formData.title || formData.title.trim() === '') {
            errors.title = 'Title is required.';
            isValid = false;
        } else if (formData.title.length < 3) {
            errors.title = 'Title must be at least 3 characters.';
            isValid = false;
        } else if (formData.title.length > 200) {
            errors.title = 'Title cannot exceed 200 characters.';
            isValid = false;
        }

        // 2. Date Validation
        if (!formData.dateTime) {
            errors.dateTime = 'Date is required.';
            isValid = false;
        } else {
            const selectedDate = new Date(formData.dateTime);
            const now = new Date();
            // Reset time part of "now" to compare dates correctly if we only care about day
            // But requirement says "future (after current date/time)". 
            // Since input=date only gives YYYY-MM-DD, we treat it as 00:00 UTC or local.
            // Let's just compare the date string to today's date string for simplicity, or strict future.
            // Strict future check:
            if (selectedDate < now) {
                // Allow today? User said "after current date/time". 
                // Since we default to 18:00:00Z when sending, let's just check if the day is in the past.
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    errors.dateTime = 'Date must be in the future.';
                    isValid = false;
                }
            }
        }

        // 3. Category Validation
        const validCategories = ['Career', 'Networking', 'Social', 'Mentorship'];
        if (!formData.category) {
            errors.category = 'Category is required.';
            isValid = false;
        } else if (!validCategories.includes(formData.category)) {
            errors.category = 'Invalid category selected.';
            isValid = false;
        }

        // 4. Capacity Validation
        if (!formData.capacity) {
            errors.capacity = 'Capacity is required.';
            isValid = false;
        } else {
            const cap = Number(formData.capacity);
            if (!Number.isInteger(cap) || cap < 1) {
                errors.capacity = 'Capacity must be at least 1.';
                isValid = false;
            } else if (cap > 1000) {
                errors.capacity = 'Capacity cannot exceed 1000.';
                isValid = false;
            }
        }

        validationErrors = errors;
        return isValid;
    }

    function clearError(field) {
        validationErrors[field] = '';
    }

    async function handleSubmit(event) {
        event.preventDefault(); // Prevent page refresh
        
        // 0. Validate before proceeding
        if (!validateForm()) {
            return;
        }

        // 1. Lock the form while we talk to AWS
        isSubmitting = true;
        submitStatus = '';
        statusMessage = '';

        try {
            // Prepare payload with ISO date
            const payload = { ...formData };
            if (payload.dateTime && !payload.dateTime.includes('T')) {
                // Append a default time if it's just a date string
                payload.dateTime = `${payload.dateTime}T18:00:00Z`;
            }

            // 2. Set up the exact API route and method based on Create vs. Edit
            const apiUrl = isEditing 
                ? API_ENDPOINTS.eventById(formData.eventId) // Update specific event
                : API_ENDPOINTS.events;              // Create new event
            
            const method = isEditing ? 'PUT' : 'POST';

            // 3. The actual AWS Fetch Call
            const response = await fetch(apiUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json' // Tell AWS we are sending JSON data
                },
                body: JSON.stringify(payload) // Convert our Svelte object into a JSON string
            });

            if (!response.ok) {
                throw new Error('Failed to save to AWS database');
            }

            // 4. Handle Success
            submitStatus = 'success';
            statusMessage = isEditing ? 'Event updated successfully!' : 'Event created successfully!';
            
            // If it was a new event, clear the form so they can make another one
            if (!isEditing) {
                formData = { eventId: '', title: '', dateTime: '', category: 'Career', capacity: 50 };
            }

        } catch (error) {
            console.error("API Error:", error);
            
            // Show real error message from AWS or network
            submitStatus = 'error';
            statusMessage = `Database Error: Could not save "${formData.title}". Please try again.`;
        } finally {
            // 6. Unlock the form
            isSubmitting = false;
        }
    }

    async function handleDelete() {
        // 1. Ask for confirmation before doing anything destructive
        const confirmed = confirm(`Are you sure you want to delete "${formData.title}"? This cannot be undone.`);
        if (!confirmed) return;

        isSubmitting = true;
        submitStatus = '';
        statusMessage = '';

        try {
            // 2. Point to the specific event ID using the DELETE method
            const apiUrl = API_ENDPOINTS.eventById(formData.eventId);
            
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
            formData = { eventId: '', title: '', dateTime: '', category: 'Career', capacity: 50 };

        } catch (error) {
            console.error("API Error:", error);
            
            // Show real error message
            submitStatus = 'error';
            statusMessage = `Database Error: Could not delete "${formData.title}". Please try again.`;
            // DO NOT clear formData on error
        } finally {
            isSubmitting = false;
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
        <input 
            type="text" 
            id="title" 
            bind:value={formData.title} 
            required 
            placeholder="e.g. Fall Case Competition" 
            disabled={isSubmitting} 
            oninput={() => clearError('title')}
            class:invalid={validationErrors.title}
        />
        {#if validationErrors.title}
            <span class="error-text">{validationErrors.title}</span>
        {/if}
    </div>

    <div class="form-row">
        <div class="form-group">
            <label for="date">Date</label>
            <input 
                type="date" 
                id="date" 
                bind:value={formData.dateTime} 
                required 
                disabled={isSubmitting}
                oninput={() => clearError('dateTime')}
                class:invalid={validationErrors.dateTime}
            />
            {#if validationErrors.dateTime}
                <span class="error-text">{validationErrors.dateTime}</span>
            {/if}
        </div>

        <div class="form-group">
            <label for="capacity">Capacity</label>
            <input 
                type="number" 
                id="capacity" 
                bind:value={formData.capacity} 
                required 
                min="1" 
                disabled={isSubmitting}
                oninput={() => clearError('capacity')}
                class:invalid={validationErrors.capacity}
            />
            {#if validationErrors.capacity}
                <span class="error-text">{validationErrors.capacity}</span>
            {/if}
        </div>
    </div>

    <div class="form-group">
        <label for="category">Category</label>
        <select 
            id="category" 
            bind:value={formData.category} 
            disabled={isSubmitting}
            onchange={() => clearError('category')}
            class:invalid={validationErrors.category}
        >
            <option value="Career">Career</option>
            <option value="Networking">Networking</option>
            <option value="Social">Social</option>
            <option value="Mentorship">Mentorship</option>
        </select>
        {#if validationErrors.category}
            <span class="error-text">{validationErrors.category}</span>
        {/if}
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
    
    /* NEW: Invalid input styling */
    input.invalid, select.invalid {
        border-color: #d32f2f;
        background-color: #ffebee;
    }
    
    .error-text {
        color: #d32f2f;
        font-size: 0.8rem;
        margin-top: 4px;
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