import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    PutCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async () => {
    const eventsTableName = process.env.EVENTS_TABLE_NAME;
    const pastEventsTableName = process.env.PAST_EVENTS_TABLE_NAME;
    const now = new Date().toISOString();

    let archived = 0;
    let lastKey;

    do {
        const queryParams = {
            TableName: eventsTableName,
            IndexName: "StatusDateIndex",
            KeyConditionExpression: "#status = :active AND #date < :now",
            ExpressionAttributeNames: { "#status": "Status", "#date": "Date" },
            ExpressionAttributeValues: { ":active": "Active", ":now": now },
            Limit: 25,
            ...(lastKey && { ExclusiveStartKey: lastKey }),
        };

        const response = await docClient.send(new QueryCommand(queryParams));
        const items = response.Items || [];
        lastKey = response.LastEvaluatedKey;

        for (const ev of items) {
            const dateStr = ev.Date || "";
            const yearMonth = dateStr.slice(0, 7);
            const dateEventID = `${dateStr}#${ev.EventID}`;

            await docClient.send(
                new PutCommand({
                    TableName: pastEventsTableName,
                    Item: {
                        YearMonth: yearMonth,
                        DateEventID: dateEventID,
                        EventID: ev.EventID,
                        Title: ev.Title,
                        Date: ev.Date,
                        Category: ev.Category,
                        Capacity: ev.Capacity,
                        CurrentRSVPs: ev.CurrentRSVPs,
                        Description: ev.Description || "",
                        Location: ev.Location || "",
                        Status: "Archived",
                        CreatedAt: ev.CreatedAt,
                        CreatedBy: ev.CreatedBy,
                        ArchivedAt: new Date().toISOString(),
                    },
                })
            );

            await docClient.send(
                new UpdateCommand({
                    TableName: eventsTableName,
                    Key: { EventID: ev.EventID },
                    UpdateExpression: "SET #status = :archived, ArchivedAt = :archivedAt",
                    ExpressionAttributeNames: { "#status": "Status" },
                    ExpressionAttributeValues: {
                        ":archived": "Archived",
                        ":archivedAt": new Date().toISOString(),
                    },
                })
            );
            archived++;
        }
    } while (lastKey);

    return { archived };
};
