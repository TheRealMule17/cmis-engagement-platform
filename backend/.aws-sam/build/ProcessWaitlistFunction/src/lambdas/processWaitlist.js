import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    GetCommand,
    UpdateCommand,
    PutCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const rsvpsTableName = process.env.RSVPS_TABLE_NAME;
    const waitlistTableName = process.env.WAITLIST_TABLE_NAME;

    for (const record of event.Records || []) {
        let eventId;
        try {
            const body = JSON.parse(record.body || "{}");
            eventId = body.eventId;
        } catch {
            console.warn("Invalid SQS message body", record.body);
            continue;
        }
        if (!eventId) continue;

        try {
            const getEventCommand = new GetCommand({
                TableName: eventsTableName,
                Key: { EventID: eventId },
            });
            const eventResp = await docClient.send(getEventCommand);
            const ev = eventResp.Item;
            if (!ev || ev.Status !== "Active" || ev.CurrentRSVPs >= ev.Capacity) {
                continue;
            }

            const queryWaitlist = new QueryCommand({
                TableName: waitlistTableName,
                KeyConditionExpression: "EventID = :eid",
                ExpressionAttributeValues: { ":eid": eventId },
                Limit: 1,
            });
            const waitlistResp = await docClient.send(queryWaitlist);
            const items = waitlistResp.Items || [];
            if (items.length === 0) continue;

            const first = items[0];
            const userId = first.UserID;
            const joinedAtUserID = first.JoinedAtUserID;

            try {
                const updateEventCommand = new UpdateCommand({
                    TableName: eventsTableName,
                    Key: { EventID: eventId },
                    UpdateExpression: "SET CurrentRSVPs = CurrentRSVPs + :inc",
                    ConditionExpression:
                        "CurrentRSVPs < :capacity AND attribute_exists(EventID) AND #status = :activeStatus",
                    ExpressionAttributeNames: { "#status": "Status" },
                    ExpressionAttributeValues: {
                        ":inc": 1,
                        ":capacity": ev.Capacity,
                        ":activeStatus": "Active",
                    },
                });
                await docClient.send(updateEventCommand);
            } catch (err) {
                if (err.name === "ConditionalCheckFailedException") continue;
                throw err;
            }

            await docClient.send(
                new PutCommand({
                    TableName: rsvpsTableName,
                    Item: {
                        EventID: eventId,
                        UserID: userId,
                        RSVPDate: new Date().toISOString(),
                        Status: "Confirmed",
                        AttendanceCheckedIn: false,
                    },
                })
            );

            await docClient.send(
                new DeleteCommand({
                    TableName: waitlistTableName,
                    Key: { EventID: eventId, JoinedAtUserID: joinedAtUserID },
                })
            );
        } catch (error) {
            console.error("Process waitlist error for event", eventId, error);
            throw error;
        }
    }
};
