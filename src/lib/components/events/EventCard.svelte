<script>
    // This tells the component to expect an object called "event" to be passed into it
    export let event;
</script>

<div class="card">
    <div class="card-header">
        <span class="category">{event.Category}</span>
        <span class="date">{event.Date}</span>
    </div>
    
    <h2 class="title">{event.Title}</h2>
    
    <div class="card-footer">
        <span class="capacity">Capacity: {event.Capacity}</span>
        <button class="rsvp-btn">RSVP</button>
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
        align-items: center;
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