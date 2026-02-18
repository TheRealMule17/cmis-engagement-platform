import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const rsvpsTableName = process.env.RSVPS_TABLE_NAME;
    const eventId = event.pathParameters.id;
    const userId = event.requestContext?.authorizer?.claims?.sub || "anonymous_user";

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    try {
        // STEP 1: Check if RSVP exists
        const getRsvpCommand = new GetCommand({
            TableName: rsvpsTableName,
            Key: {
                EventID: eventId,
                UserID: userId
            }
        });
        const rsvpResponse = await docClient.send(getRsvpCommand);
        const rsvp = rsvpResponse.Item;

        if (!rsvp) {
            return { statusCode: 404, headers, body: JSON.stringify({ message: "You do not have an RSVP for this event" }) };
        }
        if (rsvp.Status === 'Cancelled') {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "Your RSVP is already cancelled" }) };
        }

        // STEP 2: Update RSVP to Cancelled (soft delete)
        const updateRsvpCommand = new UpdateCommand({
            TableName: rsvpsTableName,
            Key: {
                EventID: eventId,
                UserID: userId
            },
            UpdateExpression: "SET #status = :cancelled, CancelledAt = :cancelledAt",
            ExpressionAttributeNames: {
                "#status": "Status"
            },
            ExpressionAttributeValues: {
                ":cancelled": "Cancelled",
                ":cancelledAt": new Date().toISOString()
            }
        });

        await docClient.send(updateRsvpCommand);

        // STEP 3: ATOMIC DECREMENT on Events table
        // We only decrement if CurrentRSVPs > 0
        try {
            const updateEventCommand = new UpdateCommand({
                TableName: eventsTableName,
                Key: { EventID: eventId },
                UpdateExpression: "SET CurrentRSVPs = CurrentRSVPs - :dec, Version = Version + :inc",
                ConditionExpression: "CurrentRSVPs > :zero AND attribute_exists(EventID)",
                ExpressionAttributeValues: {
                    ":dec": 1,
                    ":inc": 1,
                    ":zero": 0
                }
            });

            await docClient.send(updateEventCommand);

        } catch (err) {
            if (err.name === 'ConditionalCheckFailedException') {
                console.warn(`Could not decrement RSVP count for event ${eventId} (Count might be 0 already)`);
                // We still consider this a success for the user as their RSVP is cancelled
            } else {
                throw err;
            }
        }

        // STEP 4: Return success
        return {
            statusCode: 204,
            headers,
            body: ""
        };

    } catch (error) {
        console.error("Error cancelling RSVP:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
