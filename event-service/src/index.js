// index.js (single Lambda handler file)
 
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
  QueryCommand, 
  TransactWriteCommand
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
 
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
 
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const RSVPS_TABLE = process.env.RSVPS_TABLE;
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const sqs = new SQSClient({});
function response(statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      "access-control-allow-headers": "Content-Type,Authorization,X-User-Id,x-user-id"
    },
    body: bodyObj === undefined ? "" : JSON.stringify(bodyObj)
  };
}
 
function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : {};
  } catch {
    return null;
  }
}
 
function normalizePath(path) {
  if (!path) return "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}
 
function getUserId(event) {
  return (
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.headers?.["x-user-id"] ||
    event?.headers?.["X-User-Id"] ||
    "dev-user"
  );
}
 
function stripStagePrefix(event, segments) {
  const stage = event?.requestContext?.stage;
  if (stage && segments[0] === stage) return segments.slice(1);
  return segments;
}
 
exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = normalizePath(event.path);
  const body = safeJsonParse(event.body);
 
  if (event.body && body === null) {
    return response(400, { error: "INVALID_JSON" });
  }
 
  if (method === "GET" && (path === "/ping" || path.endsWith("/ping"))) {
    return response(200, { ok: true });
  }
 
  if (method === "OPTIONS") {
    return response(200, {});
  }
 
  let segments = path.split("/").filter(Boolean);
  segments = stripStagePrefix(event, segments);
 
// GET /events - Query via GSI 
if (method === "GET" && segments.length === 1 && segments[0] === "events") {
  const resp = await ddb.send(new QueryCommand({
    TableName: EVENTS_TABLE,
    IndexName: "StatusDateIndex",
    KeyConditionExpression: "#s = :active",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":active": "ACTIVE" }
  }));
  return response(200, resp.Items || []);
}
 
  // POST /events (create)
  if (method === "POST" && segments.length === 1 && segments[0] === "events") {
    const { title, dateTime, category, capacity } = body || {};
    const capNum = Number(capacity);
 
    if (!title || !dateTime || !category || !Number.isFinite(capNum) || capNum <= 0) {
      return response(400, { error: "INVALID_EVENT" });
    }
 
    const now = new Date().toISOString();
    const eventId = crypto.randomUUID();
 
    const item = {
      eventId,
      title,
      dateTime,
      category,
      capacity: capNum,
      rsvpCount: 0,
      status: "ACTIVE",  
      createdAt: now,
      updatedAt: now
    };
 
    await ddb.send(new PutCommand({ TableName: EVENTS_TABLE, Item: item }));
    return response(201, item);
  }
 
  // PUT /events/{eventId} (update)
  if (method === "PUT" && segments.length === 2 && segments[0] === "events") {
    const eventId = segments[1];
    const updates = [];
    const values = { ":u": new Date().toISOString() };
    const names = {};
 
    if (body?.title !== undefined) {
      updates.push("#t = :t");
      values[":t"] = body.title;
      names["#t"] = "title";
    }
    if (body?.dateTime !== undefined) {
      updates.push("#d = :d");
      values[":d"] = body.dateTime;
      names["#d"] = "dateTime";
    }
    if (body?.category !== undefined) {
      updates.push("#c = :c");
      values[":c"] = body.category;
      names["#c"] = "category";
    }
    if (body?.capacity !== undefined) {
      const capNum = Number(body.capacity);
      if (!Number.isFinite(capNum) || capNum <= 0) {
        return response(400, { error: "INVALID_CAPACITY" });
      }
      updates.push("#cap = :cap");
      values[":cap"] = capNum;
      names["#cap"] = "capacity";
    }
 
    if (updates.length === 0) {
      return response(400, { error: "NO_FIELDS_TO_UPDATE" });
    }
 
    updates.push("#u = :u");
    names["#u"] = "updatedAt";
 
    await ddb.send(
      new UpdateCommand({
        TableName: EVENTS_TABLE,
        Key: { eventId },
        UpdateExpression: "SET " + updates.join(", "),
        ExpressionAttributeValues: values,
        ExpressionAttributeNames: names,
        ConditionExpression: "attribute_exists(eventId)"
      })
    );
 
    return response(200, { status: "ok" });
  }
 
// DELETE /events/{eventId} - soft delete with status=CANCELED
if (method === "DELETE" && segments.length === 2 && segments[0] === "events") {
  const eventId = segments[1];
  const now = new Date().toISOString();

  await ddb.send(new UpdateCommand({
    TableName: EVENTS_TABLE,
    Key: { eventId },
    UpdateExpression: "SET #s = :canceled, updatedAt = :u",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":canceled": "CANCELED", ":u": now },
    ConditionExpression: "attribute_exists(eventId)"
  }));

  return response(200, { status: "ok" });
}
 
  // POST /events/{eventId}/rsvp
  if (method === "POST" && segments.length === 3 && segments[0] === "events" && segments[2] === "rsvp") {
    const eventId = segments[1];
    const userId = getUserId(event);
    const now = new Date().toISOString();
 
    // Fetch event first to get capacity
    const eventResult = await ddb.send(
      new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
    );
 
    if (!eventResult.Item) {
      return response(404, { error: "EVENT_NOT_FOUND" });
    }
 
    const capacity = eventResult.Item.capacity;
 
    try {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: RSVPS_TABLE,
                Item: { eventId, userId, createdAt: now },
                ConditionExpression: "attribute_not_exists(eventId)"
              }
            },
            {
              Update: {
                TableName: EVENTS_TABLE,
                Key: { eventId },
                UpdateExpression: "SET rsvpCount = if_not_exists(rsvpCount, :z) + :one, updatedAt = :u",
                ConditionExpression: "attribute_exists(eventId) AND rsvpCount < :cap",
                ExpressionAttributeValues: {
                  ":one": 1,
                  ":z": 0,
                  ":u": now,
                  ":cap": capacity
                }
              }
            }
          ]
        })
      );
 
      return response(200, { status: "ok" });
    } catch (err) {
      const name = err?.name || "UnknownError";
      const message = err?.message || String(err);
      const cancellationReasons =
        err?.CancellationReasons || err?.$response?.data?.CancellationReasons;
 
      const isTxnCancel =
        name === "TransactionCanceledException" ||
        message.includes("TransactionCanceled") ||
        message.includes("ConditionalCheckFailed") ||
        message.includes("ConditionalCheckFailedException");
 
      if (isTxnCancel) {
        // Re-fetch to give a precise error message
        try {
          const evt = await ddb.send(
            new GetCommand({ TableName: EVENTS_TABLE, Key: { eventId } })
          );
 
          if (!evt.Item) return response(404, { error: "EVENT_NOT_FOUND" });
 
          if ((evt.Item.rsvpCount ?? 0) >= (evt.Item.capacity ?? 0)) {
            return response(409, { error: "EVENT_FULL" });
          }
 
          return response(409, { error: "ALREADY_RSVPED" });
        } catch {
          // fall through
        }
      }
 
      return response(500, {
        error: "RSVP_FAILED",
        name,
        message,
        cancellationReasons,
        requestId: err?.$metadata?.requestId,
        httpStatusCode: err?.$metadata?.httpStatusCode
      });
    }
  }
// POST /events/{eventId}/waitlist (join waitlist)
if (method === "POST" && segments.length === 3 && segments[0] === "events" && segments[2] === "waitlist") {
  const eventId = segments[1];
  const userId = getUserId(event);
  const now = new Date().toISOString();
  const joinedAtUserId = `${now}#${userId}`;  // combined range key

  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.WAITLIST_QUEUE_URL,
    MessageBody: JSON.stringify({ eventId, userId }),
    MessageGroupId: eventId,
    MessageDeduplicationId: `${eventId}-${userId}`
  }));

  await ddb.send(new PutCommand({
    TableName: process.env.WAITLIST_TABLE,
    Item: { eventId, joinedAtUserId, userId, createdAt: now },
    ConditionExpression: "attribute_not_exists(eventId) AND attribute_not_exists(joinedAtUserId)"
  }));

  return response(200, { status: "ok" });
}

// DELETE /events/{eventId}/waitlist (leave waitlist)
if (method === "DELETE" && segments.length === 3 && segments[0] === "events" && segments[2] === "waitlist") {
  const eventId = segments[1];
  const userId = getUserId(event);

  // Query to find the user's waitlist entry first
  const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
  const result = await ddb.send(new QueryCommand({
    TableName: process.env.WAITLIST_TABLE,
    KeyConditionExpression: "eventId = :eid",
    FilterExpression: "userId = :uid",
    ExpressionAttributeValues: { ":eid": eventId, ":uid": userId }
  }));

  if (result.Items?.length > 0) {
    await ddb.send(new DeleteCommand({
      TableName: process.env.WAITLIST_TABLE,
      Key: { eventId, joinedAtUserId: result.Items[0].joinedAtUserId }
    }));
  }

  return response(200, { status: "ok" });
}
  return response(404, { error: "NOT_FOUND", method, path });
};