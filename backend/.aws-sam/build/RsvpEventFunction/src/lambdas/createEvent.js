import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const tableName = process.env.EVENTS_TABLE_NAME;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    try {
        const body = JSON.parse(event.body);
        const eventId = uuidv4();
        const createdAt = new Date().toISOString();
        const createdBy = event.requestContext?.authorizer?.claims?.sub || "anonymous";

        // Validation
        if (!body.Title || body.Title.length < 3 || body.Title.length > 200) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Title must be between 3 and 200 characters" }) };
        }
        if (!body.Date || new Date(body.Date) <= new Date()) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Date must be a valid future date" }) };
        }
        const allowedCategories = ["Career", "Networking", "Social", "Mentorship"];
        if (!body.Category || !allowedCategories.includes(body.Category)) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Invalid Category" }) };
        }
        if (!body.Capacity || body.Capacity < 1 || body.Capacity > 1000) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Capacity must be between 1 and 1000" }) };
        }
        if (!body.Location || body.Location.length > 500) {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Location is required and must be under 500 characters" }) };
        }

        const newEvent = {
            EventID: eventId,
            Title: body.Title,
            Date: body.Date,
            Category: body.Category,
            Capacity: body.Capacity,
            Description: body.Description || "",
            Location: body.Location,
            CurrentRSVPs: 0,
            Version: 1,
            Status: "Active",
            CreatedAt: createdAt,
            CreatedBy: createdBy
        };

        const command = new PutCommand({
            TableName: tableName,
            Item: newEvent
        });

        await docClient.send(command);

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(newEvent)
        };
    } catch (error) {
        console.error("Error creating event:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
