import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const tableName = process.env.EVENTS_TABLE_NAME;
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };

    try {
        const now = new Date().toISOString();
        const limit = Math.min(parseInt(event.queryStringParameters?.limit || "100", 10) || 100, 100);
        const nextToken = event.queryStringParameters?.nextToken;

        const queryParams = {
            TableName: tableName,
            IndexName: "StatusDateIndex",
            KeyConditionExpression: "#status = :active AND #date >= :now",
            ExpressionAttributeNames: { "#status": "Status", "#date": "Date" },
            ExpressionAttributeValues: { ":active": "Active", ":now": now },
            Limit: limit,
        };
        if (nextToken) {
            try {
                queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, "base64").toString());
            } catch (_) {}
        }

        const response = await docClient.send(new QueryCommand(queryParams));
        const events = response.Items || [];
        const nextKey = response.LastEvaluatedKey;
        const nextTokenOut = nextKey
            ? Buffer.from(JSON.stringify(nextKey)).toString("base64")
            : undefined;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                events,
                count: events.length,
                ...(nextTokenOut && { nextToken: nextTokenOut }),
            }),
        };
    } catch (error) {
        console.error("Error fetching events:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
