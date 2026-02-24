import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    const tableName = process.env.PAST_EVENTS_TABLE_NAME;
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    };

    try {
        const yearMonth = event.queryStringParameters?.yearMonth;
        const limit = Math.min(parseInt(event.queryStringParameters?.limit || "50", 10) || 50, 100);

        if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: "Query param yearMonth required (YYYY-MM)" }),
            };
        }

        const response = await docClient.send(
            new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "YearMonth = :ym",
                ExpressionAttributeValues: { ":ym": yearMonth },
                Limit: limit,
            })
        );

        const events = response.Items || [];
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ events, count: events.length }),
        };
    } catch (error) {
        console.error("Error fetching past events:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
