# The Dead Letter Queue (Must be created first)
resource "aws_sqs_queue" "waitlist_dlq" {
  name                        = "${var.project_name}-dlq-${var.stage_name}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600 # Keeps failed messages for 14 days
}

# The Main Waitlist Queue
resource "aws_sqs_queue" "waitlist_queue" {
  name                        = "${var.project_name}-waitlist-${var.stage_name}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = 30 # Adjust this if your Lambda takes longer than 30s to run

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.waitlist_dlq.arn
    maxReceiveCount     = 3 # Sends to DLQ after 3 failed processing attempts
  })
}