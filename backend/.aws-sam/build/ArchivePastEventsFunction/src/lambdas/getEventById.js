import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const rsvpsTableName = process.env.RSVPS_TABLE_NAME;
    const eventId = event.pathParameters.id;
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    if (!eventId) {
        return { statusCode: 400, headers, body: JSON.stringify({ message: "Missing EventID" }) };
    }

    try {
        // Get Event
        const getCommand = new GetCommand({
            TableName: eventsTableName,
            Key: { EventID: eventId }
        });
        const eventResponse = await docClient.send(getCommand);
        const eventItem = eventResponse.Item;

        if (!eventItem) {
            return { statusCode: 404, headers, body: JSON.stringify({ message: "Event not found" }) };
        }

        // Get RSVPs (only Confirmed count toward capacity)
        const queryCommand = new QueryCommand({
            TableName: rsvpsTableName,
            KeyConditionExpression: "EventID = :eventId",
            ExpressionAttributeValues: { ":eventId": eventId },
        });
        const rsvpResponse = await docClient.send(queryCommand);
        const allRsvps = rsvpResponse.Items || [];
        const confirmed = allRsvps.filter((r) => r.Status === "Confirmed");
        const rsvps = confirmed.map((item) => item.UserID);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                event: eventItem,
                rsvps,
                rsvpCount: rsvps.length,
            }),
        };
    } catch (error) {
        console.error("Error fetching event:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
