/**
 * Test Data Seeder for CMIS Engagement Platform
 * 
 * Usage:
 * node backend/scripts/seedTestData.js
 * 
 * Or with custom table name:
 * EVENTS_TABLE_NAME=MyTable node backend/scripts/seedTestData.js
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Configuration
const TABLE_NAME = process.env.EVENTS_TABLE_NAME || "CMIS-Events-cmis-events-12thman";
const TOTAL_EVENTS = 15;

// Helper to get random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to generate future date
const getFutureDate = (daysMetrics) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * daysMetrics));
    date.setHours(18, 0, 0, 0); // Set to 6 PM default
    return date.toISOString();
};

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

const generateEvents = () => {
    const events = [];

    // Ensure we cover all templates (total 15)
    EVENT_TEMPLATES.forEach((template, index) => {
        const capacity = getRandom(CAPACITIES);
        // Randomly assign some RSVPs (0 to capacity)
        const currentRSVPs = Math.floor(Math.random() * (capacity + 1));

        const event = {
            eventId: uuidv4(),      // Changed from EventID
            title: template.title,  // Changed from Title
            dateTime: getFutureDate(90), // Changed from Date
            category: template.category, // Changed from Category
            capacity: capacity,     // Changed from Capacity
            description: template.desc, // Changed from Description
            location: getRandom(LOCATIONS), // Changed from Location
            rsvpCount: currentRSVPs, // Changed from CurrentRSVPs
            version: 1,
            status: "Active",
            createdAt: new Date().toISOString(), // Changed from CreatedAt
            createdBy: "system-seed" // Changed from CreatedBy
        };
        events.push(event);
    });

    return events;
};

const seedData = async () => {
    console.log(`\n🌱 Starting seed for table: ${TABLE_NAME}\n`);

    const events = generateEvents();
    const chunks = [];

    // Split into chunks of 25 (DynamoDB limit)
    for (let i = 0; i < events.length; i += 25) {
        chunks.push(events.slice(i, i + 25));
    }

    let successCount = 0;
    let errorCount = 0;

    for (const chunk of chunks) {
        const putRequests = chunk.map(event => ({
            PutRequest: {
                Item: event
            }
        }));

        const command = new BatchWriteCommand({
            RequestItems: {
                [TABLE_NAME]: putRequests
            }
        });

        try {
            await docClient.send(command);
            successCount += chunk.length;
            console.log(`\x1b[32m✔ Successfully insterted batch of ${chunk.length} events\x1b[0m`);
        } catch (error) {
            errorCount += chunk.length;
            console.log(`\x1b[31m✖ Error inserting batch: ${error.message}\x1b[0m`);
        }
    }

    // Summary
    console.log("\n-------------------------------------------");
    console.log(`Total Events Created: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log("-------------------------------------------");

    if (successCount > 0) {
        const byCategory = events.reduce((acc, ev) => {
            acc[ev.Category] = (acc[ev.Category] || 0) + 1;
            return acc;
        }, {});

        console.log("\nBreakdown by Category:");
        Object.entries(byCategory).forEach(([cat, count]) => {
            console.log(`- ${cat}: ${count}`);
        });

        const totalCapacity = events.reduce((sum, ev) => sum + ev.Capacity, 0);
        console.log(`\nAverage Capacity: ${Math.round(totalCapacity / events.length)}`);

        const dates = events.map(e => new Date(e.Date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        console.log(`Date Range: ${minDate.toDateString()} to ${maxDate.toDateString()}`);
    }

    console.log("\nDone! 🚀\n");
};

seedData();
