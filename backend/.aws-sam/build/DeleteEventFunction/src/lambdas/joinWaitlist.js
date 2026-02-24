import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const waitlistTableName = process.env.WAITLIST_TABLE_NAME;
    const eventId = event.pathParameters.id;
    const userId = event.requestContext?.authorizer?.claims?.sub
        || event.headers?.["x-user-id"]
        || event.headers?.["X-User-Id"]
        || "anonymous_user";

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };

    try {
        const getEventCommand = new GetCommand({
            TableName: eventsTableName,
            Key: { EventID: eventId },
        });
        const eventResp = await docClient.send(getEventCommand);
        if (!eventResp.Item) {
            return { statusCode: 404, headers, body: JSON.stringify({ message: "Event not found" }) };
        }
        const ev = eventResp.Item;
        if (ev.Status !== "Active") {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "This event is not available for waitlist" }) };
        }
        if (ev.CurrentRSVPs < ev.Capacity) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Event has capacity; please RSVP instead of joining the waitlist" }),
            };
        }

        const joinedAt = new Date().toISOString();
        const joinedAtUserID = `${joinedAt}#${userId}`;

        const queryExisting = new QueryCommand({
            TableName: waitlistTableName,
            KeyConditionExpression: "EventID = :eid",
            FilterExpression: "UserID = :uid",
            ExpressionAttributeValues: { ":eid": eventId, ":uid": userId },
        });
        const existingList = await docClient.send(queryExisting);
        if (existingList.Items && existingList.Items.length > 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "Already on waitlist", position: "registered" }),
            };
        }

        await docClient.send(
            new PutCommand({
                TableName: waitlistTableName,
                Item: {
                    EventID: eventId,
                    JoinedAtUserID: joinedAtUserID,
                    UserID: userId,
                    JoinedAt: joinedAt,
                },
            })
        );

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: "You have been added to the waitlist",
                eventId,
            }),
        };
    } catch (error) {
        console.error("Error joining waitlist:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
