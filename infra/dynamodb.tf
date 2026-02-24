resource "aws_dynamodb_table" "events" {
  name         = "${var.project_name}-events-${var.stage_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"

  attribute {
    name = "eventId"
    type = "S"
  }

  # For GSI: StatusDateIndex
  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "dateTime"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusDateIndex"
    hash_key        = "status"
    range_key       = "dateTime"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "rsvps" {
  name         = "${var.project_name}-rsvps-${var.stage_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"
  range_key    = "userId"

  attribute {
    name = "eventId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "waitlist" {
  name         = "${var.project_name}-waitlist-${var.stage_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"
  range_key    = "joinedAtUserId"

  attribute {
    name = "eventId"
    type = "S"
  }

  attribute {
    name = "joinedAtUserId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "past_events" {
  name         = "${var.project_name}-past-events-${var.stage_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "yearMonth"
  range_key    = "dateEventId"

  attribute {
    name = "yearMonth"
    type = "S"
  }

  attribute {
    name = "dateEventId"
    type = "S"
  }
}