/**
 * Test Data Seeder for CMIS Engagement Platform (Via API)
 * 
 * Usage:
 * node scripts/seedTestData.js
 */

const API_URL = process.env.API_URL || 'https://ckj49oe5ya.execute-api.us-east-1.amazonaws.com/demo/events';

// Specific event mix requested
const EVENTS_TO_CREATE = [
    // Career (5)
    { title: "Goldman Sachs Info Session", category: "Career", desc: "Join us to learn about opportunities at Goldman Sachs." },
    { title: "Google Tech Talk", category: "Career", desc: "Engineers from Google discuss cloud infrastructure." },
    { title: "McKinsey Case Workshop", category: "Career", desc: "Learn how to crack the case interview with consultants." },
    { title: "Deloitte Consulting Prep", category: "Career", desc: "Case interview preparation with Deloitte practitioners." },
    { title: "Amazon SDE Interview Workshop", category: "Career", desc: "Deep dive into Amazon's leadership principles and coding challenges." },

    // Networking (4)
    { title: "CMIS Mixer", category: "Networking", desc: "Meet fellow MIS students and faculty." },
    { title: "Alumni Networking Night", category: "Networking", desc: "Connect with Aggie MIS alumni working in industry." },
    { title: "Industry Panel Discussion", category: "Networking", desc: "Panel discussion with industry leaders about tech trends." },
    { title: "Corporate Speed Dating", category: "Networking", desc: "Quick 5-minute networking sessions with various companies." },

    // Social (3)
    { title: "End of Year BBQ", category: "Social", desc: "Celebrate the end of the semester with food and games." },
    { title: "Game Night", category: "Social", desc: "Join us for board games and video games at the rec center." },
    { title: "Spring Formal", category: "Social", desc: "Annual spring formal event for MIS students." },

    // Mentorship (3)
    { title: "First Year Mentoring Kickoff", category: "Mentorship", desc: "Meet your mentor and set goals for the semester." },
    { title: "Career Advice Panel", category: "Mentorship", desc: "Mentors share advice on navigating career paths." },
    { title: "Grad School Application Workshop", category: "Mentorship", desc: "Guidance on applying to graduate programs." }
];

const CAPACITIES = [20, 50, 75, 100, 150, 200];

// Helper to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate future date/time
const getFutureDate = (minDays, maxDays) => {
    const date = new Date();
    // Random day between minDays and maxDays from now
    const daysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    date.setDate(date.getDate() + daysToAdd);

    // Random hour between 18 (6 PM) and 20 (8 PM)
    const hour = Math.floor(Math.random() * (20 - 18 + 1)) + 18;
    date.setHours(hour, 0, 0, 0); // Sets minutes/seconds to 0

    return date.toISOString();
};

const seedData = async () => {
    console.log(`\n🌱 Starting seed for API: ${API_URL}\n`);

    let successCount = 0;
    let errorCount = 0;
    const categoryCounts = {};

    for (const template of EVENTS_TO_CREATE) {
        // Construct the full event object
        const eventData = {
            title: template.title,
            dateTime: getFutureDate(1, 90), // Spread over next 90 days
            category: template.category,
            capacity: getRandom(CAPACITIES),
            description: template.desc || `Description for ${template.title}`,
            location: "TBD" // Default location
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                successCount++;
                // Track category counts
                categoryCounts[eventData.category] = (categoryCounts[eventData.category] || 0) + 1;

                // Color output (Green check)
                process.stdout.write(`\x1b[32m✔\x1b[0m Created: ${eventData.title}\n`);
            } else {
                errorCount++;
                const errText = await response.text();
                // Color output (Red X)
                console.log(`\x1b[31m✖\x1b[0m Failed: ${eventData.title} (${response.status} ${errText})`);
            }
        } catch (error) {
            errorCount++;
            console.log(`\x1b[31m✖\x1b[0m Network Error: ${eventData.title} (${error.message})`);
        }

        // 500ms delay as requested
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log("\n-------------------------------------------");
    if (errorCount === 0) {
        console.log(`\x1b[32m✅ Created ${successCount} events successfully!\x1b[0m`);
    } else {
        console.log(`⚠️ Finished with ${errorCount} errors.`);
    }

    // Print Category Breakdown
    Object.entries(categoryCounts).forEach(([cat, count]) => {
        console.log(`${cat}: ${count} events`);
    });
    console.log("-------------------------------------------\n");
};

seedData();
