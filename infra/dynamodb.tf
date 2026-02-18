resource "aws_dynamodb_table" "events" {
  name         = "${var.project_name}-events-${var.stage_name}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"

  attribute {
    name = "eventId"
    type = "S"
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
