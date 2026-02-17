<div class="hero">
    <h1 style="color: var(--primary-color)">Welcome to the CMIS Engagement Platform</h1>
    <p style="color: var(--secondary-text)">Manage Student Profiles, Recruitment Events, Mentorship, and Case Competitions.</p>
    
    <div class="action-buttons">
        <a href="/events" class="btn primary">View Active Events</a>
        <a href="/events/admin" class="btn secondary">Admin: Create Event</a>
    </div>
</div>

<style>
    .hero {
        text-align: center;
        padding: 60px 20px;
        background-color: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        margin-top: 40px;
    }

    h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
    }

    p {
        font-size: 1.2rem;
        margin-bottom: 40px;
    }

    .btn {
        display: inline-block;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
        margin: 0 10px;
        transition: opacity 0.2s;
    }

    .btn:hover {
        opacity: 0.8;
    }

    .primary {
        background-color: var(--primary-color);
        color: var(--primary-text);
    }

    .secondary {
        background-color: var(--background-color);
        color: var(--main-text);
        border: 1px solid var(--border-color);
    }
</style>