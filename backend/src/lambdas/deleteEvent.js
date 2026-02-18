import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const rsvpsTableName = process.env.RSVPS_TABLE_NAME;
    const eventId = event.pathParameters.id;
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };

    // Check Admin Auth
    if (event.requestContext?.authorizer && event.requestContext.authorizer.claims?.['custom:role'] !== 'admin') {
        return { statusCode: 403, headers, body: JSON.stringify({ message: "Forbidden" }) };
    }

    try {
        // 1. Query all RSVPs for this event
        const queryCommand = new QueryCommand({
            TableName: rsvpsTableName,
            KeyConditionExpression: "EventID = :eventId",
            ExpressionAttributeValues: {
                ":eventId": eventId
            }
        });

        const rsvpsResponse = await docClient.send(queryCommand);
        const rsvps = rsvpsResponse.Items || [];

        // 2. Delete RSVPs (BatchWriteItem)
        // DynamoDB BatchWriteItem limit is 25 items
        if (rsvps.length > 0) {
            const chunks = [];
            for (let i = 0; i < rsvps.length; i += 25) {
                chunks.push(rsvps.slice(i, i + 25));
            }

            for (const chunk of chunks) {
                const deleteRequests = chunk.map(rsvp => ({
                    DeleteRequest: {
                        Key: {
                            EventID: eventId,
                            UserID: rsvp.UserID
                        }
                    }
                }));

                const batchWriteCommand = new BatchWriteCommand({
                    RequestItems: {
                        [rsvpsTableName]: deleteRequests
                    }
                });

                await docClient.send(batchWriteCommand);
                // Note: In production, check for UnprocessedItems and retry
            }
        }

        // 3. Soft Delete Event (Update Status to Cancelled)
        const updateCommand = new UpdateCommand({
            TableName: eventsTableName,
            Key: { EventID: eventId },
            UpdateExpression: "SET #status = :cancelled",
            ExpressionAttributeNames: {
                "#status": "Status"
            },
            ExpressionAttributeValues: {
                ":cancelled": "Cancelled"
            }
        });

        await docClient.send(updateCommand);

        return {
            statusCode: 204,
            headers,
            body: ""
        };

    } catch (error) {
        console.error("Error deleting event:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
