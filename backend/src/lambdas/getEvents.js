import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

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
        const command = new ScanCommand({
            TableName: tableName,
            FilterExpression: "#status = :active",
            ExpressionAttributeNames: {
                "#status": "Status"
            },
            ExpressionAttributeValues: {
                ":active": "Active"
            }
        });

        const response = await docClient.send(command);
        let events = response.Items || [];

        // Filter out past events (Date < current date)
        const now = new Date();
        events = events.filter(event => new Date(event.Date) >= now);

        // Sort by Date ascending
        events.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                events,
                count: events.length
            })
        };
    } catch (error) {
        console.error("Error fetching events:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
