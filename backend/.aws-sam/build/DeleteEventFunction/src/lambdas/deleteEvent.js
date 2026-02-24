import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const eventId = event.pathParameters.id;
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };

    if (event.requestContext?.authorizer && event.requestContext.authorizer.claims?.["custom:role"] !== "admin") {
        return { statusCode: 403, headers, body: JSON.stringify({ message: "Forbidden" }) };
    }

    try {
        // Never delete: soft-delete only. Set Status to Cancelled; do not delete RSVP records.
        const updateCommand = new UpdateCommand({
            TableName: eventsTableName,
            Key: { EventID: eventId },
            UpdateExpression: "SET #status = :cancelled, CancelledAt = :cancelledAt",
            ConditionExpression: "attribute_exists(EventID)",
            ExpressionAttributeNames: { "#status": "Status" },
            ExpressionAttributeValues: {
                ":cancelled": "Cancelled",
                ":cancelledAt": new Date().toISOString(),
            },
        });

        await docClient.send(updateCommand);

        return {
            statusCode: 204,
            headers,
            body: "",
        };
    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            return { statusCode: 404, headers, body: JSON.stringify({ message: "Event not found" }) };
        }
        console.error("Error deleting event:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
