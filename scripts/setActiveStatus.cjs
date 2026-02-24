const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }));
const TABLE = "twelfth-man-event-core-events-demo";

async function run() {
  const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
  console.log(`Found ${result.Items.length} events`);

  for (const item of result.Items) {
    if (!item.status) {
      await ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { eventId: item.eventId },
        UpdateExpression: "SET #s = :active",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":active": "ACTIVE" }
      }));
      console.log(`Updated ${item.eventId}`);
    }
  }
  console.log("Done!");
}

run().catch(console.error);