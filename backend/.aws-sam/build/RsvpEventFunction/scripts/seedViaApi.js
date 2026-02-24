/**
 * API Data Seeder for CMIS Engagement Platform
 * 
 * Usage:
 * node backend/scripts/seedViaApi.js
 */

const API_URL = 'https://ckj49oe5ya.execute-api.us-east-1.amazonaws.com/demo/events';
const TOTAL_EVENTS = 15;

// Categories matching the frontend
const CATEGORIES = {
    CAREER: "Career",
    NETWORKING: "Networking",
    SOCIAL: "Social",
    MENTORSHIP: "Mentorship"
};

const LOCATIONS = ["MSC 2400", "Zachry 210", "Memorial Student Center", "Wehner 113", "Rudder Tower"];

const EVENT_TEMPLATES = [
    // Career (5)
    { title: "Goldman Sachs Info Session", category: CATEGORIES.CAREER, desc: "Join us to learn about opportunities at Goldman Sachs." },
    { title: "Google Tech Talk", category: CATEGORIES.CAREER, desc: "Engineers from Google discuss cloud infrastructure." },
    { title: "McKinsey Case Workshop", category: CATEGORIES.CAREER, desc: "Learn how to crack the case interview with consultants." },
    { title: "Career Fair Prep", category: CATEGORIES.CAREER, desc: "Get your resume reviewed and practice your elevator pitch." },
    { title: "Startup Internship Panel", category: CATEGORIES.CAREER, desc: "Hear from students who interned at top startups." },

    // Networking (4)
    { title: "CMIS Mixer", category: CATEGORIES.NETWORKING, desc: "Meet fellow MIS students and faculty." },
    { title: "Alumni Networking Night", category: CATEGORIES.NETWORKING, desc: "Connect with Aggie MIS alumni working in industry." },
    { title: "Industry Night", category: CATEGORIES.NETWORKING, desc: "Network with corporate partners." },
    { title: "Coffee Chat with Seniors", category: CATEGORIES.NETWORKING, desc: "Casual networking with graduating seniors." },

    // Social (3)
    { title: "End of Year BBQ", category: CATEGORIES.SOCIAL, desc: "Celebrate the end of the semester with food and games." },
    { title: "Game Night", category: CATEGORIES.SOCIAL, desc: "Join us for board games and video games at the rec center." },
    { title: "Ice Cream Social", category: CATEGORIES.SOCIAL, desc: "Take a break from studying with free ice cream." },

    // Mentorship (3)
    { title: "First Year Mentoring Kickoff", category: CATEGORIES.MENTORSHIP, desc: "Meet your mentor and set goals for the semester." },
    { title: "Career Advice Panel", category: CATEGORIES.MENTORSHIP, desc: "Mentors share advice on navigating career paths." },
    { title: "Resume Workshop", category: CATEGORIES.MENTORSHIP, desc: "Mentors review resumes and provide feedback." }
];

const CAPACITIES = [20, 50, 75, 100, 150, 200];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getFutureDate = (daysMetrics) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysMetrics));
    date.setHours(18, 0, 0, 0); // Set to 6 PM default
    return date.toISOString();
};

const generateEvents = () => {
    const events = [];
    EVENT_TEMPLATES.forEach((template) => {
        const capacity = getRandom(CAPACITIES);
        const event = {
            title: template.title,
            dateTime: getFutureDate(90),
            category: template.category,
            capacity: capacity,
            description: template.desc,
            location: getRandom(LOCATIONS)
            // Note: We don't send rsvpCount, backend inits it to 0. 
            // If we want random RSVPs, we have to fake it by calling the RSVP endpoint later, 
            // but for now let's just create empty events.
        };
        events.push(event);
    });
    return events;
};

const seedViaApi = async () => {
    console.log(`\n🌱 Starting API seed to: ${API_URL}\n`);

    const events = generateEvents();
    let successCount = 0;
    let errorCount = 0;

    for (const event of events) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (response.ok) {
                successCount++;
                process.stdout.write('.'); // Progress dot
            } else {
                errorCount++;
                const errText = await response.text();
                console.log(`\n✖ Error creating "${event.title}": ${response.status} ${errText}`);
            }
        } catch (error) {
            errorCount++;
            console.log(`\n✖ Network Error creating "${event.title}": ${error.message}`);
        }
    }

    console.log("\n\n-------------------------------------------");
    console.log(`Total Events Sent: ${events.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("-------------------------------------------");
    console.log("\nDone! 🚀\n");
};

seedViaApi();
