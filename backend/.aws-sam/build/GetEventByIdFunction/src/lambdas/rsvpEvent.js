import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const rsvpsTableName = process.env.RSVPS_TABLE_NAME;
    const eventId = event.pathParameters.id;
    const userId = event.requestContext?.authorizer?.claims?.sub || "anonymous_user"; // Fallback for dev

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    try {
        // STEP 1: Check if user already has RSVP
        const getRsvpCommand = new GetCommand({
            TableName: rsvpsTableName,
            Key: {
                EventID: eventId,
                UserID: userId
            }
        });
        const rsvpResponse = await docClient.send(getRsvpCommand);
        if (rsvpResponse.Item && rsvpResponse.Item.Status === 'Confirmed') {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "You have already RSVP'd to this event" }) };
        }

        // STEP 2: Get current event details to check preliminary validity (optional but good for specific error msgs)
        const getEventCommand = new GetCommand({
            TableName: eventsTableName,
            Key: { EventID: eventId }
        });
        const eventResp = await docClient.send(getEventCommand);
        if (!eventResp.Item) {
            return { statusCode: 404, headers, body: JSON.stringify({ message: "Event not found" }) };
        }
        const eventItem = eventResp.Item;
        if (eventItem.Status !== 'Active') {
            return { statusCode: 400, headers, body: JSON.stringify({ message: "This event is no longer available" }) };
        }

        // STEP 3: ATOMIC INCREMENT (CRITICAL)
        // We try to increment CurrentRSVPs only if it is less than Capacity.
        // This prevents race conditions where multiple users try to RSVP to the last spot simultaneously.
        try {
            const updateEventCommand = new UpdateCommand({
                TableName: eventsTableName,
                Key: { EventID: eventId },
                UpdateExpression: "SET CurrentRSVPs = CurrentRSVPs + :inc, Version = Version + :inc",
                ConditionExpression: "CurrentRSVPs < :capacity AND attribute_exists(EventID) AND #status = :activeStatus",
                ExpressionAttributeNames: {
                    "#status": "Status"
                },
                ExpressionAttributeValues: {
                    ":inc": 1,
                    ":capacity": eventItem.Capacity,
                    ":activeStatus": "Active"
                },
                ReturnValues: "ALL_NEW"
            });

            const updateResult = await docClient.send(updateEventCommand);
            const updatedEvent = updateResult.Attributes;

            // STEP 4: Create RSVP record (only if Step 3 succeeded)
            const putRsvpCommand = new PutCommand({
                TableName: rsvpsTableName,
                Item: {
                    EventID: eventId,
                    UserID: userId,
                    RSVPDate: new Date().toISOString(),
                    Status: "Confirmed",
                    AttendanceCheckedIn: false
                }
            });

            await docClient.send(putRsvpCommand);

            // STEP 5: Return success
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: "RSVP successful",
                    event: {
                        EventID: updatedEvent.EventID,
                        Title: updatedEvent.Title,
                        CurrentRSVPs: updatedEvent.CurrentRSVPs,
                        Capacity: updatedEvent.Capacity
                    }
                })
            };

        } catch (err) {
            if (err.name === 'ConditionalCheckFailedException') {
                // This means either:
                // 1. Event is full (CurrentRSVPs >= Capacity)
                // 2. Event is not Active
                // 3. Event does not exist (though we checked earlier, it might have been deleted)
                return {
                    statusCode: 409,
                    headers,
                    body: JSON.stringify({ message: "This event is at full capacity or unavailable" })
                };
            }
            throw err; // Re-throw other errors to be caught by outer catch
        }

    } catch (error) {
        console.error("Error processing RSVP:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
